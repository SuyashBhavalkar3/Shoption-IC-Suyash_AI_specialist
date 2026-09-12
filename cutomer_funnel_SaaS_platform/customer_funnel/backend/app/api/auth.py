from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import require_role

from app.models.auth_user import AuthUser
from app.models.registration_code import RegistrationCode

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RegistrationCodeCreateResponse,
)

from app.services.audit_service import log_action
from app.services.jwt_service import create_access_token
from app.services.registration_code_service import (
    generate_registration_code,
)
from app.services.security import (
    hash_password,
    verify_password,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"]
)


@router.post(
    "/create-registration-code",
    response_model=RegistrationCodeCreateResponse,
)
def create_registration_code(
    current_user: AuthUser = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db),
):
    code = generate_registration_code()

    expires_at = datetime.now(UTC) + timedelta(days=7)

    registration_code = RegistrationCode(
        id=str(uuid4()),
        code=code,
        created_by=current_user.id,
        expires_at=expires_at,
        used=False,
        used_by=None,
        created_at=datetime.now(UTC),
    )

    db.add(registration_code)
    db.commit()

    log_action(
        db=db,
        user_id=current_user.id,
        action="CREATE_REGISTRATION_CODE",
        endpoint="/api/auth/create-registration-code",
    )

    return RegistrationCodeCreateResponse(
        id=registration_code.id,
        code=registration_code.code,
        expires_at=registration_code.expires_at,
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    registration_code = (
        db.query(RegistrationCode)
        .filter(
            RegistrationCode.code == payload.registration_code
        )
        .first()
    )

    if not registration_code:
        raise HTTPException(
            status_code=400,
            detail="Invalid registration code"
        )

    if registration_code.used:
        raise HTTPException(
            status_code=400,
            detail="Registration code already used"
        )

    if registration_code.expires_at:
        if (
            registration_code.expires_at.replace(tzinfo=None)
            < datetime.now()
        ):
            raise HTTPException(
                status_code=400,
                detail="Registration code expired"
            )

    existing_user = (
        db.query(AuthUser)
        .filter(AuthUser.email == payload.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user = AuthUser(
        id=str(uuid4()),
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="analyst",
        is_active=True,
        created_at=datetime.now(UTC),
    )

    db.add(user)

    registration_code.used = True
    registration_code.used_by = user.id

    db.commit()

    return RegisterResponse(
        message="User registered successfully"
    )


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(AuthUser)
        .filter(AuthUser.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account disabled"
        )

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
    )

    log_action(
        db=db,
        user_id=user.id,
        action="LOGIN",
        endpoint="/api/auth/login",
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
    )


@router.get("/me")
def me(
    current_user: AuthUser = Depends(get_current_user),
):
    return {
        "id": str(current_user.id),
        "name": str(current_user.name),
        "email": str(current_user.email),
        "role": str(current_user.role),
        "is_active": bool(current_user.is_active),
    }

# @router.get("/debug-users")
# def debug_users(db: Session = Depends(get_db)):
#     users = db.query(AuthUser).all()

#     return [
#         {
#             "email": user.email,
#             "role": user.role,
#             "active": user.is_active,
#         }
#         for user in users
#     ]


@router.get("/create-admin")
def create_admin(
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(AuthUser)
        .filter(AuthUser.email == "ayush@test.com")
        .first()
    )

    if existing_user:
        return {
            "message": "Admin already exists"
        }

    user = AuthUser(
        id=str(uuid4()),
        name="Ayush",
        email="ayush@test.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
        is_active=True,
        created_at=datetime.now(UTC),
    )

    db.add(user)
    db.commit()

    return {
        "message": "Admin created successfully"
    }