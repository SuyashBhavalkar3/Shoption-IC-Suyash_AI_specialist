from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, Token, LoginRequest
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Self-registration endpoint.
    - Only requires: email, full_name, password.
    - All new users register as 'warrior' with is_approved=False.
    - Bootstrap exception: the very first user becomes super_admin and is auto-approved.
    - No manager_id is accepted here — that is assigned later by admin.
    """
    # Duplicate email check
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    hashed_password = get_password_hash(user_in.password)

    # Bootstrap: first user ever → super_admin, auto-approved
    is_first_user = db.query(User).count() == 0

    # Server-side guard: super_admin can NEVER be self-registered
    requested_role = user_in.role.value  # convert enum → string
    if requested_role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="super_admin cannot be self-registered"
        )

    db_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role="super_admin" if is_first_user else requested_role,
        manager_id=None,           # always None at registration
        is_approved=is_first_user, # first user auto-approved; others wait for admin
        is_active=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login with email + password (JSON body). Returns a JWT bearer token."""
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact your administrator."
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for your admin to approve you."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint. JWT is stateless so the actual token invalidation happens
    client-side (delete from SharedPreferences). This endpoint acts as a
    server-side acknowledgment and can be extended to support a token blacklist
    in the future.
    """
    return {"detail": f"User '{current_user.email}' logged out successfully."}
