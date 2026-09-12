from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import secrets

from app.schemas.project import ProjectCreate
from app.models.project import Project
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.auth_user import AuthUser
from app.services.audit_service import log_action

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)


@router.post("")
def create_project(
    project: ProjectCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    api_key = f"pk_live_{secrets.token_hex(16)}"

    new_project = Project(
        name=project.name,
        api_key=api_key
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    log_action(
        db=db,
        user_id=current_user.id,
        action="CREATE_PROJECT",
        endpoint="/api/projects",
    )

    return {
        "id": new_project.id,
        "name": new_project.name,
        "api_key": new_project.api_key,
        "created_at": new_project.created_at
    }


@router.get("")
def get_projects(
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("Projects endpoint called:", request.method, request.url)
    projects = db.query(Project).all()
    print("Projects count:", len(projects))

    return [
        {
            "id": project.id,
            "name": project.name,
            "api_key": project.api_key,
            "created_at": project.created_at
        }
        for project in projects
    ]
