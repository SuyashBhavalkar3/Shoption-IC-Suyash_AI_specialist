from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import User
from app.schemas import UserOut, ApproveWarrior, RoleUpdate, UserOutBasic
from app.auth import get_current_user, RoleChecker

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ── Role guards ───────────────────────────────────────────────────────────────
admin_or_super   = RoleChecker(["admin", "super_admin"])
super_admin_only = RoleChecker(["super_admin"])


# ── List / Read endpoints ─────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Any logged-in user can fetch their own profile."""
    return current_user


@router.get("/", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """Admin / Super-admin: see every user."""
    return db.query(User).all()


@router.get("/pending", response_model=List[UserOut])
def get_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Returns all users awaiting approval, filtered by what the caller can approve:
    - admin      → sees pending warriors and group_leaders
    - super_admin → sees pending admins (and warriors/group_leaders too)
    """
    query = db.query(User).filter(User.is_approved == False)

    if current_user.role == "admin":
        # Admins can only see & approve warriors and group_leaders
        query = query.filter(User.role.in_(["warrior", "group_leader"]))

    return query.all()


@router.get("/my-team", response_model=List[UserOutBasic])
def get_my_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Role-scoped team view:
    - group_leader  → their directly assigned warriors
    - admin         → all warriors and group_leaders
    - super_admin   → everyone
    - warrior       → only themselves
    """
    if current_user.role == "group_leader":
        return db.query(User).filter(User.manager_id == current_user.id).all()

    if current_user.role == "admin":
        return db.query(User).filter(User.role.in_(["warrior", "group_leader"])).all()

    if current_user.role == "super_admin":
        return db.query(User).all()

    # warrior: only self
    return [current_user]


# ── Approval endpoints (hierarchy-aware) ──────────────────────────────────────

@router.post("/approve", response_model=UserOut)
def approve_user(
    payload: ApproveWarrior,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_super)
):
    """
    Unified approval endpoint. Rules:
    ┌────────────────┬──────────────────────────────────────────────────────┐
    │ Pending role   │ Who can approve        │ leader_id needed?           │
    ├────────────────┼──────────────────────────────────────────────────────┤
    │ warrior        │ admin / super_admin     │ YES — assigns to group_leader│
    │ group_leader   │ admin / super_admin     │ NO                          │
    │ admin          │ super_admin ONLY        │ NO                          │
    └────────────────┴──────────────────────────────────────────────────────┘
    After approval, is_approved = True and the user can log in.
    """
    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

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
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
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
