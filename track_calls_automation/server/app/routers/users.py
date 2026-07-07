from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, AsyncGenerator
from uuid import UUID
from app.database import get_db
from app.models import User
from app.schemas import UserOut, ApproveWarrior, RoleUpdate, UserOutBasic, UserTrackStatusPayload, UserUpdateAdmin
from app.security import get_current_user, RoleChecker
from datetime import datetime
from sse_starlette.sse import EventSourceResponse
import json
import asyncio
import select
import psycopg2
from app.database import db_url

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ── Role guards ───────────────────────────────────────────────────────────────
admin_or_super   = RoleChecker(["admin", "super_admin"])
super_admin_only = RoleChecker(["super_admin"])


# ── List / Read endpoints ─────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Any logged-in user can fetch their own profile."""
    print(f"INFO: GET /users/me requested by user {current_user.email} (Role: {current_user.role}, Tracking Active: {current_user.is_tracking_active})")
    
    emp_id = getattr(current_user, "cached_employee_id", None)
    if emp_id is None and current_user.system_id:
        from app.models import OrgEmployee
        emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == current_user.system_id).first()
        if emp_rec:
            emp_id = emp_rec.employee_id
            
    out = UserOut.from_orm(current_user)
    out.employee_id = emp_id
    return out


@router.get("/", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """Admin / Super-admin: see every user in their organisation."""
    if current_user.organisation_id is not None:
        users_list = db.query(User).filter(User.organisation_id == current_user.organisation_id).all()
    else:
        users_list = db.query(User).filter(User.organisation_id.is_(None)).all()
        
    return users_list


@router.get("/pending", response_model=List[UserOut])
def get_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Returns all users awaiting approval in the caller's organisation, filtered by role hierarchy:
    - admin      → sees pending warriors and group_leaders
    - super_admin → sees pending admins (and warriors/group_leaders too)
    """
    query = db.query(User).filter(User.is_approved == False)

    if current_user.organisation_id is not None:
        query = query.filter(User.organisation_id == current_user.organisation_id)
    else:
        query = query.filter(User.organisation_id.is_(None))

    if current_user.role == "admin":
        # Admins can only see & approve warriors and group_leaders
        query = query.filter(User.role.in_(["warrior", "group_leader"]))

    return query.all()


@router.get("/my-team", response_model=List[UserOutBasic])
def get_my_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"INFO: GET /users/my-team requested by user {current_user.email} (Role: {current_user.role})")
    """
    Role-scoped team view:
    - group_leader  → their directly assigned warriors
    - admin         → all warriors and group_leaders in their organisation
    - super_admin   → everyone in their organisation
    - warrior       → only themselves
    """
    if current_user.role == "group_leader":
        # Fetch users where current_user is one of the assigned managers
        users_list = db.query(User).filter(User.managers.any(User.id == current_user.id)).all()
    elif current_user.role == "admin":
        org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
        users_list = db.query(User).filter(User.role.in_(["warrior", "group_leader"]), org_filter).all()
    elif current_user.role == "super_admin":
        org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
        users_list = db.query(User).filter(org_filter).all()
    else:
        users_list = [current_user]

    for u in users_list:
        if u.is_tracking_active:
            should_deactivate = False
            if u.last_activity_timestamp:
                diff = (datetime.utcnow() - u.last_activity_timestamp).total_seconds()
                if diff >= 35:
                    should_deactivate = True
            else:
                should_deactivate = True

            if should_deactivate:
                u.is_tracking_active = False
                db.add(u)
                db.commit()
                # Sync offline state to Firestore
                try:
                    from app.firebase_service import update_tracking_status_in_firestore
                    from app.models import OrgEmployee
                    emp_id = ""
                    if u.system_id:
                        emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == u.system_id).first()
                        if emp_rec:
                            emp_id = emp_rec.employee_id
                    update_tracking_status_in_firestore(
                        emp_id=emp_id,
                        organisation_id=str(u.organisation_id) if u.organisation_id else "",
                        system_id=u.system_id or "",
                        is_tracking_enabled=False,
                        last_activity_timestamp=u.last_activity_timestamp or datetime.utcnow()
                    )
                except Exception as ex:
                    print(f"ERROR: Failed to update Firestore on offline timeout: {ex}")
                
    return users_list


# ── Approval endpoints (hierarchy-aware) ──────────────────────────────────────

@router.post("/approve", response_model=UserOut)
def approve_user(
    payload: ApproveWarrior,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Unified approval endpoint. Rules:
    ┌────────────────┬──────────────────────────────────────────────────────-┐
    │ Pending role   │ Who can approve        │ leader_id needed?            │
    ├────────────────┼──────────────────────────────────────────────────────-┤
    │ warrior        │ admin / super_admin    │ YES — assigns to group_leader│
    │ group_leader   │ admin / super_admin    │ NO                           │
    │ admin          │ super_admin ONLY       │ NO                           │
    └────────────────┴──────────────────────────────────────────────────────-┘
    After approval, is_approved = True and the user can log in.
    """
    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot approve a user from another organisation"
        )

    if target.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already approved"
        )

    # ── Approving an admin → only super_admin can do this ────────────────────
    if target.role == "admin":
        if current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a super_admin can approve an admin account"
            )
        target.is_approved = True
        db.commit()
        db.refresh(target)
        return target

    # ── Approving a warrior → leader_id is mandatory ─────────────────────────
    if target.role == "warrior":
        if not payload.leader_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="leader_id is required when approving a warrior"
            )
        leader = db.query(User).filter(User.id == payload.leader_id).first()
        if not leader:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group leader not found")
        if leader.organisation_id != current_user.organisation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The selected group leader must belong to your organisation"
            )
        if leader.role != "group_leader":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="leader_id must point to a user with role 'group_leader'"
            )
        if not leader.is_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected group leader is not yet approved themselves"
            )
        target.manager_id = leader.id
        target.is_approved = True
        db.commit()
        db.refresh(target)
        
        return target

    # ── Approving a group_leader → just approve, no manager needed ───────────
    if target.role == "group_leader":
        target.is_approved = True
        db.commit()
        db.refresh(target)
        return target

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Cannot approve a user with role '{target.role}' through this endpoint"
    )


# ── Admin utility endpoints ───────────────────────────────────────────────────

@router.put("/role", response_model=UserOut)
def update_user_role(
    update: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Change a user's role.
    - admin can change warrior ↔ group_leader
    - super_admin can change anything (including promoting to admin)
    """
    VALID_ROLES = {"super_admin", "admin", "group_leader", "warrior"}
    if update.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Choose from: {', '.join(sorted(VALID_ROLES))}"
        )

    target_user = db.query(User).filter(User.id == update.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target_user.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify a user from another organisation"
        )

    if update.role in ("super_admin", "admin") and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a super_admin can assign 'admin' or 'super_admin' roles"
        )

    target_user.role = update.role
    db.commit()
    db.refresh(target_user)
    return target_user


@router.put("/deactivate/{user_id}", response_model=UserOut)
def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """Soft-disable a user (is_active = False). They cannot log in."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate a user from another organisation"
        )
    target.is_active = False
    db.commit()
    db.refresh(target)
    return target


@router.put("/{user_id}/tracking", response_model=UserOut)
def update_user_tracking(
    user_id: UUID,
    enabled: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enable/disable call tracking for a warrior.
    - Group Leaders can toggle tracking only for warriors reporting directly to them.
    - Admins and Super Admins can toggle tracking for any warrior.
    """
    print(f"INFO: PUT /users/{user_id}/tracking (enabled={enabled}) requested by {current_user.email} (Role: {current_user.role})")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if target.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify a user from another organisation"
        )

    # Check permissions
    if current_user.role == "group_leader":
        if target.manager_id != current_user.id or target.role != "warrior":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only toggle tracking for warriors reporting directly to you."
            )
    elif current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to toggle tracking status."
        )
        
    target.is_tracking_active = enabled
    db.commit()
    db.refresh(target)
    return target


@router.put("/me/tracking-active", response_model=UserOut)
async def update_my_tracking_active(
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows the logged-in user (e.g. warrior) to toggle their active tracking status on the database.
    """
    print(f"INFO: PUT /users/me/tracking-active (active={active}) requested by {current_user.email}")
    current_user.is_tracking_active = active
    current_user.last_activity_timestamp = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    # Invalidate cache so GET /users/me gets the fresh value immediately
    from app.security import invalidate_user_cache
    invalidate_user_cache(str(current_user.id))
    
    # Immediately broadcast status change to SSE listeners in memory
    await broadcast_user_status(current_user, db)
    
    return current_user


@router.post("/track/status")
async def post_track_status(
    payload: UserTrackStatusPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Receives periodic status pings/heartbeats from the mobile app.
    Updates local PostgreSQL database. Triggers pg_notify.
    """
    # Parse last_activity_timestamp
    timestamp_val = payload.last_activity_timestamp
    from datetime import timezone
    try:
        val = float(timestamp_val)
        if val > 1e11:  # Milliseconds timestamp
            val = val / 1000.0
        parsed_dt = datetime.fromtimestamp(val, tz=timezone.utc).replace(tzinfo=None)
    except ValueError:
        try:
            parsed_dt = datetime.fromisoformat(timestamp_val.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
        except Exception:
            parsed_dt = datetime.utcnow()
            
    # Update local PostgreSQL database
    current_user.is_tracking_active = payload.is_tracking_enabled
    current_user.last_activity_timestamp = parsed_dt
    db.commit()
    db.refresh(current_user)
    
    # Invalidate cache so GET /users/me gets the fresh value immediately
    from app.security import invalidate_user_cache
    invalidate_user_cache(str(current_user.id))
    
    # Immediately broadcast status change to SSE listeners in memory
    await broadcast_user_status(current_user, db)
    
    return {
        "success": True,
        "is_tracking_enabled": current_user.is_tracking_active,
        "is_tracking_active": current_user.is_tracking_active
    }


@router.put("/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: UUID,
    payload: UserUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Admin or SuperAdmin can update a user's details.
    Allows editing full_name, email, role, manager_id (reassigning group leader), is_active, is_approved, and system_id.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if target.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update a user from another organisation"
        )

    # 1. Update basic details
    if payload.full_name is not None:
        target.full_name = payload.full_name
    if payload.email is not None:
        email_clean = payload.email.strip().lower()
        # Check duplicate email
        dup = db.query(User).filter(User.email == email_clean, User.id != user_id).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use")
        target.email = email_clean

    # 2. Update role
    if payload.role is not None:
        VALID_ROLES = {"super_admin", "admin", "group_leader", "warrior"}
        if payload.role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Choose from: {', '.join(sorted(VALID_ROLES))}"
            )
        if payload.role in ("super_admin", "admin") and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a super_admin can assign 'admin' or 'super_admin' roles"
            )
        target.role = payload.role

    # 3. Update manager relationships (supporting both manager_id and manager_ids)
    role_levels = {
        "super_admin": 4,
        "admin": 3,
        "group_leader": 2,
        "warrior": 1
    }
    
    target_role = payload.role or target.role

    if "manager_ids" in payload.__fields_set__:
        if payload.manager_ids is None:
            target.managers = []
            target.manager_id = None
        else:
            new_managers = []
            for m_id in payload.manager_ids:
                mgr = db.query(User).filter(User.id == m_id).first()
                if not mgr:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Manager {m_id} not found")
                if mgr.organisation_id != current_user.organisation_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Selected manager must belong to your organisation"
                    )
                if role_levels.get(mgr.role, 0) <= role_levels.get(target_role, 0):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Manager role ({mgr.role}) must be higher than user role ({target_role})"
                    )
                new_managers.append(mgr)
            target.managers = new_managers
            target.manager_id = new_managers[0].id if new_managers else None

    elif "manager_id" in payload.__fields_set__:
        if payload.manager_id is None:
            target.managers = []
            target.manager_id = None
        else:
            leader = db.query(User).filter(User.id == payload.manager_id).first()
            if not leader:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group leader not found")
            if leader.organisation_id != current_user.organisation_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Selected group leader must belong to your organisation"
                )
            if role_levels.get(leader.role, 0) <= role_levels.get(target_role, 0):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Manager role ({leader.role}) must be higher than user role ({target_role})"
                )
            target.managers = [leader]
            target.manager_id = leader.id

    # 4. Update status flags
    if payload.is_active is not None:
        target.is_active = payload.is_active
    if payload.is_approved is not None:
        target.is_approved = payload.is_approved

    # 5. Update system_id
    if payload.system_id is not None:
        system_id_clean = payload.system_id.strip() if payload.system_id else None
        if system_id_clean:
            # Check duplicate system_id
            dup_sys = db.query(User).filter(User.system_id == system_id_clean, User.id != user_id).first()
            if dup_sys:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System ID is already in use by another user")
        target.system_id = system_id_clean

    db.commit()
    db.refresh(target)

    return target


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def admin_delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Admin or SuperAdmin can permanently remove/delete a user.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if target.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete a user from another organisation"
        )

    # Prevent deleting oneself
    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    db.delete(target)
    db.commit()
    return {"detail": "User deleted successfully"}


# Keep track of active stream listeners (asyncio.Queue objects)
active_listeners = []

async def broadcast_user_status(user: User, db: Session):
    try:
        from app.models import OrgEmployee
        v_emp_id = ""
        v_needed = True
        if user.system_id:
            emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == user.system_id).first()
            if emp_rec:
                v_emp_id = emp_rec.employee_id
                v_needed = emp_rec.is_tracking_needed if emp_rec.is_tracking_needed is not None else True
                
        formatted_ts = ""
        if user.last_activity_timestamp:
            from datetime import timedelta
            ist_dt = user.last_activity_timestamp + timedelta(hours=5, minutes=30)
            formatted_ts = ist_dt.strftime('%B %d, %Y at %I:%M:%S %p')

        payload = {
            "user_id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "emp_id": v_emp_id,
            "org_id": str(user.organisation_id) if user.organisation_id else "",
            "system_id": user.system_id or "",
            "is_tracking_active": user.is_tracking_active,
            "is_tracking_needed": v_needed,
            "last_activity_timestamp": formatted_ts
        }
        
        # Send Postgres NOTIFY to distribute across all process workers
        from sqlalchemy import text
        db.execute(
            text("NOTIFY user_status_update, :payload;"),
            {"payload": json.dumps(payload)}
        )
        # Commit the notify transaction
        db.commit()
        print(f"INFO [SSE-BROADCASTER]: Cross-process NOTIFY sent for {user.email} (active={user.is_tracking_active})")
    except Exception as e:
        print(f"ERROR [SSE-BROADCASTER]: Cross-process NOTIFY failed: {e}")

async def postgres_event_broadcaster():
    """
    Background loop holding exactly 1 database connection.
    Listens for PostgreSQL notifies and pushes the payload to all active client queues.
    """
    raw_url = db_url.replace("postgresql+psycopg2://", "postgresql://")
    loop = asyncio.get_event_loop()
    
    while True:
        try:
            print("INFO [SSE-BROADCASTER]: Establishing database connection listener...")
            # Run blocking connect in a thread pool executor to prevent startup block
            conn = await loop.run_in_executor(None, lambda: psycopg2.connect(raw_url))
            conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            cursor.execute("LISTEN user_status_update;")
            
            while True:
                # Poll database notifications in executor since select is blocking
                r, _, _ = await loop.run_in_executor(None, lambda: select.select([conn], [], [], 1.0))
                if r == ([], [], []):
                    continue
                
                conn.poll()
                while conn.notifies:
                    notify = conn.notifies.pop(0)
                    try:
                        data = json.loads(notify.payload)
                        # Broadcast notification data to all registered clients on this worker process
                        for queue in active_listeners:
                            await queue.put(data)
                    except Exception as ex:
                        print(f"ERROR [SSE-BROADCASTER]: Failed to broadcast notify payload: {ex}")
                        
        except Exception as e:
            print(f"ERROR [SSE-BROADCASTER]: Database listener failed, retrying in 5 seconds: {e}")
            await asyncio.sleep(5)

async def event_generator(current_user: User) -> AsyncGenerator[dict, None]:
    # Subscribe an individual queue to the broadcaster
    queue = asyncio.Queue()
    active_listeners.append(queue)
    
    # Pre-fetch subordinates once on connection setup to avoid db queries during streaming
    from app.database import SessionLocal
    db = SessionLocal()
    allowed_user_ids = {str(current_user.id)}
    
    try:
        if current_user.role == "group_leader":
            # Find all users who have this manager
            from app.models import User as DBUser
            for u in db.query(DBUser).all():
                if current_user in u.managers:
                    allowed_user_ids.add(str(u.id))
        elif current_user.role == "admin":
            # Admins can see warriors and group leaders, and other admins who are managers
            from app.models import User as DBUser
            for u in db.query(DBUser).all():
                if u.role in ("group_leader", "warrior"):
                    allowed_user_ids.add(str(u.id))
                elif u.role in ("admin", "super_admin"):
                    is_mgr = db.query(DBUser).filter(DBUser.manager_id == u.id).first() is not None
                    if is_mgr or u.id == current_user.id:
                        allowed_user_ids.add(str(u.id))
    except Exception as e:
        print(f"ERROR [SSE-STREAM-INIT]: Failed to pre-fetch allowed list: {e}")
    finally:
        db.close()
        
    # Bootstrap initial states on client connection
    db_init = SessionLocal()
    try:
        from app.models import User as DBUser, OrgEmployee
        for uid in allowed_user_ids:
            u = db_init.query(DBUser).filter(DBUser.id == uid).first()
            if u:
                v_emp_id = ""
                v_needed = True
                if u.system_id:
                    emp_rec = db_init.query(OrgEmployee).filter(OrgEmployee.system_id == u.system_id).first()
                    if emp_rec:
                        v_emp_id = emp_rec.employee_id
                        v_needed = emp_rec.is_tracking_needed if emp_rec.is_tracking_needed is not None else True
                
                formatted_ts = ""
                if u.last_activity_timestamp:
                    from datetime import timedelta
                    ist_dt = u.last_activity_timestamp + timedelta(hours=5, minutes=30)
                    formatted_ts = ist_dt.strftime('%B %d, %Y at %I:%M:%S %p')
                    
                payload = {
                    "user_id": str(u.id),
                    "full_name": u.full_name,
                    "email": u.email,
                    "emp_id": v_emp_id,
                    "org_id": str(u.organisation_id) if u.organisation_id else "",
                    "system_id": u.system_id or "",
                    "is_tracking_active": u.is_tracking_active,
                    "is_tracking_needed": v_needed,
                    "last_activity_timestamp": formatted_ts
                }
                yield {
                    "event": "message",
                    "data": json.dumps(payload)
                }
    except Exception as e:
        print(f"ERROR [SSE-INIT-BOOTSTRAP]: {e}")
    finally:
        db_init.close()

    try:
        while True:
            # Yield periodic keep-alive pings or block waiting for broadcasted data
            try:
                data = await asyncio.wait_for(queue.get(), timeout=10.0)
                
                # Apply pre-fetched hierarchy security rules filtering for this session in memory
                if current_user.role in ("admin", "group_leader"):
                    if str(data.get("user_id")) not in allowed_user_ids:
                        continue

                yield {
                    "event": "message",
                    "data": json.dumps(data)
                }
            except asyncio.TimeoutError:
                # Keep-alive heartbeat
                yield {"event": "ping", "data": "keep-alive"}
                
    except asyncio.CancelledError:
        pass
    finally:
        if queue in active_listeners:
            active_listeners.remove(queue)


# Public unauthenticated stream for org app integration (matching by email)
async def public_event_generator(email: str) -> AsyncGenerator[dict, None]:
    queue = asyncio.Queue()
    active_listeners.append(queue)
    
    # Immediately yield the current status of this user
    from app.database import SessionLocal
    from app.models import User, OrgEmployee
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(email)).first()
        if user:
            v_emp_id = ""
            v_needed = True
            if user.system_id:
                emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == user.system_id).first()
                if emp_rec:
                    v_emp_id = emp_rec.employee_id
                    v_needed = emp_rec.is_tracking_needed if emp_rec.is_tracking_needed is not None else True
            
            formatted_ts = ""
            if user.last_activity_timestamp:
                from datetime import timedelta
                ist_dt = user.last_activity_timestamp + timedelta(hours=5, minutes=30)
                formatted_ts = ist_dt.strftime('%B %d, %Y at %I:%M:%S %p')
                
            payload = {
                "user_id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "emp_id": v_emp_id,
                "org_id": str(user.organisation_id) if user.organisation_id else "",
                "system_id": user.system_id or "",
                "is_tracking_active": user.is_tracking_active,
                "is_tracking_needed": v_needed,
                "last_activity_timestamp": formatted_ts
            }
            yield {
                "event": "message",
                "data": json.dumps(payload)
            }
    except Exception as e:
        print(f"ERROR [SSE-PUBLIC-INIT]: {e}")
    finally:
        db.close()
    
    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=10.0)
                
                # Check email directly from memory payload without querying PostgreSQL
                payload_email = data.get("email", "")
                if payload_email and payload_email.strip().lower() == email.strip().lower():
                    yield {
                        "event": "message",
                        "data": json.dumps(data)
                    }
            except asyncio.TimeoutError:
                yield {"event": "ping", "data": "keep-alive"}
                
    except asyncio.CancelledError:
        pass
    finally:
        if queue in active_listeners:
            active_listeners.remove(queue)


@router.get("/track/stream")
async def track_status_stream(
    current_user: User = Depends(get_current_user)
):
    """
    Subscribes the client to real-time status updates via Server-Sent Events (SSE).
    Uses PostgreSQL LISTEN/NOTIFY triggers for low latency updates.
    """
    if current_user.role == "warrior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Warriors do not have access to real-time tracking streams"
        )
    return EventSourceResponse(event_generator(current_user))


@router.get("/track/stream/public")
async def track_status_stream_public(email: str):
    """
    Public unauthenticated stream endpoint for Org App integration.
    Streams real-time updates filtered specifically for the requested user email.
    """
    if not email:
        raise HTTPException(status_code=400, detail="Email query parameter is required")
    return EventSourceResponse(public_event_generator(email))


# ── Background Worker to Auto-Deactivate Idle Users (> 2 Minutes) ────────────────────

async def auto_deactivate_idle_users_loop():
    """
    Runs in the background every 30 seconds.
    Toggles users from active tracking to inactive if no pings have been received for 120 seconds.
    """
    while True:
        await asyncio.sleep(5)
        from app.database import SessionLocal
        db = SessionLocal()
        try:

            from datetime import timezone
            now = datetime.now(timezone.utc)
            # Fetch all active trackers
            active_trackers = db.query(User).filter(User.is_tracking_active == True).all()
            for u in active_trackers:
                if u.last_activity_timestamp:
                    # Force both datetimes to be timezone-aware UTC objects
                    db_ts = u.last_activity_timestamp
                    if db_ts.tzinfo is None:
                        db_ts = db_ts.replace(tzinfo=timezone.utc)
                    else:
                        db_ts = db_ts.astimezone(timezone.utc)
                        
                    diff_seconds = (now - db_ts).total_seconds()
                    if diff_seconds >= 90:
                        print(f"INFO [AUTO-DEACTIVATE]: User {u.email} is idle ({int(diff_seconds)}s). Disabling active tracking.")
                        u.is_tracking_active = False
                        db.add(u)
                        
                        # Invalidate cache so GET /users/me returns offline immediately
                        try:
                            from app.security import invalidate_user_cache
                            invalidate_user_cache(str(u.id))
                        except Exception:
                            pass
                            
                        # Immediately broadcast status change to SSE listeners in memory
                        try:
                            await broadcast_user_status(u, db)
                        except Exception:
                            pass
            db.commit()
        except Exception as e:
            print(f"ERROR [AUTO-DEACTIVATE]: Worker loop failed: {e}")
        finally:
            db.close()


async def stream_all_users_status_periodically_loop():
    """
    Runs in the background every 10 seconds.
    Streams the status of all approved users to all SSE listeners in real-time.
    """
    while True:
        await asyncio.sleep(10)
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            from app.models import User as DBUser, OrgEmployee
            approved_users = db.query(DBUser).filter(DBUser.is_approved == True).all()
            for u in approved_users:
                v_emp_id = ""
                v_needed = True
                if u.system_id:
                    emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == u.system_id).first()
                    if emp_rec:
                        v_emp_id = emp_rec.employee_id
                        v_needed = emp_rec.is_tracking_needed if emp_rec.is_tracking_needed is not None else True
                
                formatted_ts = ""
                if u.last_activity_timestamp:
                    from datetime import timedelta
                    ist_dt = u.last_activity_timestamp + timedelta(hours=5, minutes=30)
                    formatted_ts = ist_dt.strftime('%B %d, %Y at %I:%M:%S %p')
                    
                payload = {
                    "user_id": str(u.id),
                    "full_name": u.full_name,
                    "email": u.email,
                    "emp_id": v_emp_id,
                    "org_id": str(u.organisation_id) if u.organisation_id else "",
                    "system_id": u.system_id or "",
                    "is_tracking_active": u.is_tracking_active,
                    "is_tracking_needed": v_needed,
                    "last_activity_timestamp": formatted_ts
                }
                await broadcast_user_status(u, db)
        except Exception as e:
            print(f"ERROR [PERIODIC-STREAM]: Periodic status stream failed: {e}")
        finally:
            db.close()


_broadcaster_started = False

@router.on_event("startup")
async def startup_event():
    global _broadcaster_started
    if _broadcaster_started:
        return
    _broadcaster_started = True
    # 1. Start the singleton Postgres LISTEN broadcaster task
    asyncio.create_task(postgres_event_broadcaster())
    # 2. Start background deactivation loop task safely
    asyncio.create_task(auto_deactivate_idle_users_loop())
    # 3. Start periodic status streaming loop task safely
    asyncio.create_task(stream_all_users_status_periodically_loop())