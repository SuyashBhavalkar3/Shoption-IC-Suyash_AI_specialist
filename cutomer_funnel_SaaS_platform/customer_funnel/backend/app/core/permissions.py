from fastapi import Depends, HTTPException

from app.core.auth import get_current_user
from app.models.auth_user import AuthUser


def require_role(*roles):
    def role_checker(
        current_user: AuthUser = Depends(get_current_user),
    ):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )

        return current_user

    return role_checker