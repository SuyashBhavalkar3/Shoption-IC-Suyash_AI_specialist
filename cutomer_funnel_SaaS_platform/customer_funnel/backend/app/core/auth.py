from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.auth_user import AuthUser
from app.services.jwt_service import verify_token

security = HTTPBearer()


# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     db: Session = Depends(get_db),
# ) -> AuthUser:

#     try:
#         print("TOKEN:", credentials.credentials)

#         payload = verify_token(credentials.credentials)
#         print("PAYLOAD:", payload)

#         user = (
#             db.query(AuthUser)
#             .filter(AuthUser.id == payload["user_id"])
#             .first()
#         )

#         print("USER:", user)

#         if not user:
#             raise HTTPException(
#                 status_code=401,
#                 detail="User not found"
#             )

#         if not user.is_active:
#             raise HTTPException(
#                 status_code=403,
#                 detail="User disabled"
#             )



    # except Exception as e:
    #     print("AUTH ERROR:", repr(e))
    #     raise 

# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     db: Session = Depends(get_db),
# ) -> AuthUser:

#     try:
#         payload = verify_token(credentials.credentials)

#         user_id = payload.get("user_id")

#         if not user_id:
#             raise HTTPException(
#                 status_code=401,
#                 detail="Invalid token payload"
#             )

#         user = (
#             db.query(AuthUser)
#             .filter(AuthUser.id == user_id)
#             .first()
#         )

#         if user is None:
#             raise HTTPException(
#                 status_code=401,
#                 detail="User not found"
#             )

#         return user

#     except HTTPException:
#         raise

#     except Exception as e:
#         print("AUTH ERROR:", repr(e))

#         raise HTTPException(
#             status_code=401,
#             detail="Authentication failed"
#         )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AuthUser:

    print("STEP 1")

    payload = verify_token(credentials.credentials)

    print("STEP 2")

    user = (
        db.query(AuthUser)
        .filter(AuthUser.id == payload["user_id"])
        .first()
    )

    print("STEP 3", user)

    return user