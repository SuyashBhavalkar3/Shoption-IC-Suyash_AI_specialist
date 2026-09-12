from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RegistrationCode(Base):
    __tablename__ = "registration_codes"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    created_by: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    used_by: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )