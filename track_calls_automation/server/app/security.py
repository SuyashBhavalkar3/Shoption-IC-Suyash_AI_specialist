from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import User
from app.schemas import TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTPBearer: Swagger shows a simple "Value" box — paste the access_token from /auth/login
bearer_scheme = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

import time

# Simple in-memory cache for authenticated users to reduce database read load.
# Keys are user_id string, values are (user_object, expiry_timestamp)
_USER_CACHE = {}
_CACHE_TTL_SECONDS = 30

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials  # the raw JWT string
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, role=role)
    except JWTError:
        raise credentials_exception
        
    now = time.time()
    cached_entry = _USER_CACHE.get(token_data.user_id)
    
    if cached_entry:
        cached_user, expiry = cached_entry
        if now < expiry:
            # Re-associate the cached user object with the current session
            return db.merge(cached_user, load=False)
            
    # Cache miss or expired
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    # Pre-fetch employee_id to store in cache alongside User to save DB hits in GET /users/me
    user.cached_employee_id = None
    if user.system_id:
        from app.models import OrgEmployee
        emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == user.system_id).first()
        if emp_rec:
            user.cached_employee_id = emp_rec.employee_id
        
    # Expunge the user from current session so it can be cached and shared safely
    db.expunge(user)
    _USER_CACHE[token_data.user_id] = (user, now + _CACHE_TTL_SECONDS)
    
    # Re-merge to attach back to the active request session for caller use
    return db.merge(user, load=False)

def invalidate_user_cache(user_id: str):
    _USER_CACHE.pop(str(user_id), None)

_WEB_USER_CACHE = {}

def get_current_web_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    from app.models import WebUser
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    now = time.time()
    cached_entry = _WEB_USER_CACHE.get(user_id)
    if cached_entry:
        cached_user, expiry = cached_entry
        if now < expiry:
            return db.merge(cached_user, load=False)

    web_user = db.query(WebUser).filter(WebUser.id == user_id).first()
    if web_user is None:
        raise credentials_exception
        
    db.expunge(web_user)
    _WEB_USER_CACHE[user_id] = (web_user, now + _CACHE_TTL_SECONDS)
    return db.merge(web_user, load=False)

# Role enforcement checks
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
