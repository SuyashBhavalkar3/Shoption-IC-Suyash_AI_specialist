from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import WebUser
from app.schemas import WebUserCreate, WebUserOut, WebUserLogin, Token
from app.security import get_password_hash, verify_password, create_access_token, get_current_web_user

router = APIRouter(
    prefix="/web-auth",
    tags=["Web Authentication"]
)

@router.post("/register", response_model=WebUserOut, status_code=status.HTTP_201_CREATED)
def register_web_user(user_in: WebUserCreate, db: Session = Depends(get_db)):
    """Self-register a website developer user."""
    # Check if email is already taken
    existing_user = db.query(WebUser).filter(WebUser.email == user_in.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Auto-link organisation: check if an app user already exists with this email and has super_admin role
    from app.models import User
    app_user = db.query(User).filter(
        User.email == user_in.email.strip().lower(),
        User.role == "super_admin"
    ).first()
    org_id = app_user.organisation_id if app_user else None

    hashed_password = get_password_hash(user_in.password)
    db_user = WebUser(
        email=user_in.email.strip().lower(),
        full_name=user_in.full_name.strip(),
        password_hash=hashed_password,
        organisation_id=org_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"INFO: Successfully registered WebUser '{db_user.email}' linked to organisation '{db_user.organisation_id}'")
    return db_user

@router.post("/login", response_model=Token)
def login_web_user(credentials: WebUserLogin, db: Session = Depends(get_db)):
    """Login a web developer user. Returns a JWT token."""
    user = db.query(WebUser).filter(WebUser.email == credentials.email.strip().lower()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    access_token = create_access_token(
        data={"sub": str(user.id), "role": "web_developer"}
    )
    print(f"INFO: Login successful for WebUser '{user.email}'")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=WebUserOut)
def get_web_me(current_user: WebUser = Depends(get_current_web_user)):
    """Fetch profile of current authenticated web developer."""
    return current_user
