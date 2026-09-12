from app.core.config import settings

print("JWT_SECRET:", settings.jwt_secret[:10] + "...")
print("JWT_ALGORITHM:", settings.jwt_algorithm)
print("ACCESS_TOKEN_EXPIRE_MINUTES:", settings.access_token_expire_minutes)