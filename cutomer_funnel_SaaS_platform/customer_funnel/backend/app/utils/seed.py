from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.event import Event
from app.models.project import Project
from app.models.user import User

LIVE_PROJECT_API_KEY = "pk_live_bcd39b8924457c7be39983e0117dd57f"
SAMPLE_USERS = [
    "user-1001",
    "user-1002",
]

SAMPLE_EVENTS = [
    {"user_id": "user-1001", "event_name": "login", "properties": {}},
    {"user_id": "user-1001", "event_name": "product_view", "properties": {"product_id": "P001"}},
    {"user_id": "user-1001", "event_name": "add_to_cart", "properties": {"product_id": "P001"}},
    {"user_id": "user-1001", "event_name": "checkout_started", "properties": {"cart_value": 49.99}},
    {"user_id": "user-1001", "event_name": "purchase", "properties": {"order_id": "O1001"}},
    {"user_id": "user-1002", "event_name": "login", "properties": {}},
    {"user_id": "user-1002", "event_name": "product_view", "properties": {"product_id": "P002"}},
    {"anonymous_id": "anon-abc-001", "event_name": "product_view", "properties": {"product_id": "P003"}},
]


def ensure_live_project(db: Session) -> Project:
    project = db.query(Project).filter(Project.api_key == LIVE_PROJECT_API_KEY).one_or_none()
    if project is None:
        project = Project(name="GBRU Website", api_key=LIVE_PROJECT_API_KEY)
        db.add(project)
        db.flush()
        print("Created GBRU Website project for API key:", LIVE_PROJECT_API_KEY)
    else:
        print("GBRU Website project already exists for API key:", LIVE_PROJECT_API_KEY)
    return project


def seed_live_project_data(db: Session) -> None:
    project = ensure_live_project(db)

    for external_user_id in SAMPLE_USERS:
        existing = db.query(User).filter(User.external_user_id == external_user_id).one_or_none()
        if existing is None:
            db.add(User(external_user_id=external_user_id))

    db.flush()

    project_event_count = db.query(Event).filter(Event.project_id == project.id).count()
    if project_event_count == 0:
        for item in SAMPLE_EVENTS:
            event_data = dict(item)
            event_data.setdefault("created_at", datetime.now(timezone.utc))
            db.add(Event(project_id=project.id, **event_data))
        print("Seeded sample events for live project", project.id)

    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_live_project_data(db)
        print("Seed live project data created successfully.")
    finally:
        db.close()
