from app.services.security import (
    hash_password,
    verify_password
)

password = "Admin@123"

hashed = hash_password(password)

print("HASH:")
print(hashed)

print("VERIFY:")
print(
    verify_password(
        "Admin@123",
        hashed
    )
)