from datetime import datetime

from sqlalchemy import DateTime, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        nullable=False,
        index=True
    )

    user_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)

    anonymous_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)

    event_name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    
    properties: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )