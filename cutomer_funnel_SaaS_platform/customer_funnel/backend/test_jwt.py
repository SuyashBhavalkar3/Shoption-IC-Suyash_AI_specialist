from app.services.jwt_service import (
    create_access_token,
    verify_token,
)

token = create_access_token(
    user_id="123",
    email="admin@gbru.com",
    role="admin",
)

print("TOKEN:")
print(token)

print("\nPAYLOAD:")
print(verify_token(token))