from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.auth_user import AuthUser
from app.schemas.event import EventListResponse, EventRead, EventTrackRequest
from app.services.event_service import EventService

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("/track", response_model=EventRead, status_code=201)
def track_event(
    payload: EventTrackRequest,
    db: Session = Depends(get_db),
) -> EventRead:
    service = EventService(db)
    return service.track_event(payload)


@router.get("", response_model=EventListResponse)
def get_events(
    project_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str | None = None,
    event_name: str | None = None,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventListResponse:
    service = EventService(db)
    return service.list_events(
        project_id=project_id,
        page=page,
        page_size=page_size,
        user_id=user_id,
        event_name=event_name,
    )