from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    endpoint: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )