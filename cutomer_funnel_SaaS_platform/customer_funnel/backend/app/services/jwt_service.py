from datetime import datetime, timedelta, UTC

from jose import JWTError, jwt

from app.core.config import settings


def create_access_token(
    user_id: str,
    email: str,
    role: str,
) -> str:
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


# def verify_token(token: str) -> dict:
#     try:
#         payload = jwt.decode(
#             token,
#             settings.jwt_secret,
#             algorithms=[settings.jwt_algorithm],
#         )

#         return payload

def verify_token(token: str) -> dict:
    print("VERIFYING TOKEN")

    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )

    print("PAYLOAD =", payload)

    return payload

    # except JWTError:
    #     raise ValueError("Invalid or expired token")