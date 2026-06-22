from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import User
from app.schemas import UserOut, ApproveWarrior, RoleUpdate, UserOutBasic, UserTrackStatusPayload, UserUpdateAdmin
from app.security import get_current_user, RoleChecker
from app.firebase_service import update_tracking_status_in_firestore
from datetime import datetime

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
    print(f"INFO: GET /users/me requested by user {current_user.email} (Role: {current_user.role}, Tracking Enabled: {current_user.is_tracking_enabled})")
    
    emp_id = None
    if current_user.system_id:
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
        
    for u in users_list:
        if u.is_tracking_enabled:
            if u.last_activity_timestamp:
                diff = (datetime.utcnow() - u.last_activity_timestamp).total_seconds()
                if diff >= 120:
                    u.is_tracking_enabled = False
                    u.is_tracking_active = False
                    db.add(u)
                    db.commit()
            else:
                u.is_tracking_enabled = False
                u.is_tracking_active = False
                db.add(u)
                db.commit()
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
        users_list = db.query(User).filter(User.manager_id == current_user.id).all()
    elif current_user.role == "admin":
        org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
        users_list = db.query(User).filter(User.role.in_(["warrior", "group_leader"]), org_filter).all()
    elif current_user.role == "super_admin":
        org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
        users_list = db.query(User).filter(org_filter).all()
    else:
        users_list = [current_user]

    for u in users_list:
        if u.is_tracking_enabled:
            if u.last_activity_timestamp:
                diff = (datetime.utcnow() - u.last_activity_timestamp).total_seconds()
                if diff >= 120:
                    u.is_tracking_enabled = False
                    u.is_tracking_active = False
                    db.add(u)
                    db.commit()
            else:
                u.is_tracking_enabled = False
                u.is_tracking_active = False
                db.add(u)
                db.commit()
                
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
        
        # Sync to Firestore if the approved user is a warrior
        from app.models import OrgEmployee
        emp_id = ""
        if target.system_id:
            emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == target.system_id).first()
            if emp_rec:
                emp_id = emp_rec.employee_id
        
        update_tracking_status_in_firestore(
            emp_id=emp_id,
            organisation_id=str(target.organisation_id) if target.organisation_id else "",
            system_id=target.system_id or "",
            is_tracking_enabled=target.is_tracking_enabled,
            last_activity_timestamp=target.last_activity_timestamp or datetime.utcnow()
        )
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
        
    target.is_tracking_enabled = enabled
    db.commit()
    db.refresh(target)
    return target


@router.put("/me/tracking-active", response_model=UserOut)
def update_my_tracking_active(
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows the logged-in user (e.g. warrior) to toggle their active tracking status on the database.
    """
    print(f"INFO: PUT /users/me/tracking-active (active={active}) requested by {current_user.email}")
    current_user.is_tracking_active = active
    current_user.is_tracking_enabled = active
    current_user.last_activity_timestamp = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    # Sync to Firestore
    from app.models import OrgEmployee
    emp_id = ""
    if current_user.system_id:
        emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == current_user.system_id).first()
        if emp_rec:
            emp_id = emp_rec.employee_id
            
    update_tracking_status_in_firestore(
        emp_id=emp_id,
        organisation_id=str(current_user.organisation_id) if current_user.organisation_id else "",
        system_id=current_user.system_id or "",
        is_tracking_enabled=active,
        last_activity_timestamp=current_user.last_activity_timestamp
    )
    
    return current_user


@router.post("/track/status")
def post_track_status(
    payload: UserTrackStatusPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Receives periodic status pings/heartbeats from the mobile app.
    Updates PostgreSQL databases and Firestore collection.
    """
    # Parse last_activity_timestamp
    timestamp_val = payload.last_activity_timestamp
    try:
        val = float(timestamp_val)
        if val > 1e11:  # Milliseconds timestamp
            val = val / 1000.0
        parsed_dt = datetime.fromtimestamp(val)
    except ValueError:
        try:
            parsed_dt = datetime.fromisoformat(timestamp_val.replace("Z", "+00:00"))
        except Exception:
            parsed_dt = datetime.utcnow()
            
    # Update local PostgreSQL database
    current_user.is_tracking_enabled = payload.is_tracking_enabled
    current_user.is_tracking_active = payload.is_tracking_enabled
    current_user.last_activity_timestamp = parsed_dt
    db.commit()
    db.refresh(current_user)
    
    # Update Firestore
    update_tracking_status_in_firestore(
        emp_id=payload.emp_id,
        organisation_id=payload.organisation_id,
        system_id=payload.system_id,
        is_tracking_enabled=payload.is_tracking_enabled,
        last_activity_timestamp=parsed_dt
    )
    
    return {
        "success": True,
        "is_tracking_enabled": current_user.is_tracking_enabled,
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

    # 3. Update manager_id (reassign group leader)
    if payload.manager_id is not None:
        # Check if the manager_id points to a group_leader in the same org
        leader = db.query(User).filter(User.id == payload.manager_id).first()
        if not leader:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group leader not found")
        if leader.organisation_id != current_user.organisation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Selected group leader must belong to your organisation"
            )
        if leader.role != "group_leader":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manager must be a group_leader"
            )
        target.manager_id = payload.manager_id

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

    # 6. Sync to Firestore if target is a warrior
    if target.role == "warrior":
        try:
            from app.models import OrgEmployee
            emp_id = ""
            if target.system_id:
                emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == target.system_id).first()
                if emp_rec:
                    emp_id = emp_rec.employee_id
            
            update_tracking_status_in_firestore(
                emp_id=emp_id,
                organisation_id=str(target.organisation_id) if target.organisation_id else "",
                system_id=target.system_id or "",
                is_tracking_enabled=target.is_tracking_enabled,
                last_activity_timestamp=target.last_activity_timestamp or datetime.utcnow()
            )
        except Exception as e:
            print(f"ERROR: Failed to sync warrior update to Firestore: {e}")

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

    # If the user is a warrior, disable tracking in Firestore or delete document
    if target.role == "warrior":
        try:
            from app.models import OrgEmployee
            emp_id = ""
            if target.system_id:
                emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == target.system_id).first()
                if emp_rec:
                    emp_id = emp_rec.employee_id
            
            if emp_id:
                # Update tracking enabled to False in Firestore to disable it immediately
                update_tracking_status_in_firestore(
                    emp_id=emp_id,
                    organisation_id=str(target.organisation_id) if target.organisation_id else "",
                    system_id=target.system_id or "",
                    is_tracking_enabled=False,
                    last_activity_timestamp=datetime.utcnow()
                )
        except Exception as e:
            print(f"WARNING: Failed to update Firestore on user deletion: {e}")

    db.delete(target)
    db.commit()
    return {"detail": "User deleted successfully"}