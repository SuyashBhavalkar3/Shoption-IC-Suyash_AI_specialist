from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.event import Event
from app.models.user import User
from app.models.project import Project
from app.schemas.event import EventListResponse, EventTrackRequest


class EventService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _ensure_user_record(self, external_user_id: str) -> User:
        user = (
            self.db.query(User)
            .filter(User.external_user_id == external_user_id)
            .one_or_none()
        )

        if user is None:
            user = User(external_user_id=external_user_id)
            self.db.add(user)
            self.db.flush()

        return user

    def track_event(self, payload: EventTrackRequest) -> Event:
        print("EVENT RECEIVED", payload.model_dump())

        project = (
            self.db.query(Project)
            .filter(Project.api_key == payload.api_key)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Invalid API Key"
            )

        if payload.user_id:
            self._ensure_user_record(payload.user_id)

        print(
            "TRACKED EVENT:",
            payload.user_id,
            payload.event_name,
            payload.timestamp,
        )

        event = Event(
            project_id=project.id,
            user_id=payload.user_id,
            anonymous_id=payload.anonymous_id,
            event_name=payload.event_name,
            properties=payload.properties or {},
            created_at=payload.timestamp,
        )

        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        print(
            "CREATED_AT_DEBUG",
            event.created_at,
            "TZINFO:",
            event.created_at.tzinfo,
            "TYPE:",
            type(event.created_at),
        )

        print(
            "EVENT STORED",
            {
                "id": event.id,
                "event_name": event.event_name,
                "project_id": event.project_id,
            },
        )

        return event

    def list_events(
        self,
        project_id: int,
        page: int = 1,
        page_size: int = 20,
        user_id: str | None = None,
        event_name: str | None = None,
    ) -> EventListResponse:

        query = self.db.query(Event).filter(Event.project_id == project_id)

        if user_id:
            query = query.filter(Event.user_id == user_id)

        if event_name:
            query = query.filter(Event.event_name == event_name)

        total = query.count()

        offset = (page - 1) * page_size

        events = (
            query.order_by(Event.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        total_pages = max(
            (total + page_size - 1) // page_size,
            1 if total else 0
        )

        return EventListResponse(
            data=events,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )