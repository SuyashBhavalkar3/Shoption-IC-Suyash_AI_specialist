import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email        = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name    = Column(String, nullable=False)
    # Roles: super_admin | admin | group_leader | warrior
    role         = Column(String, nullable=False, server_default="warrior")
    # manager_id is NULL until admin assigns the warrior to a group_leader
    manager_id   = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # Approval flow: warrior registers → is_approved=False → admin approves + assigns → True
    is_approved  = Column(Boolean, nullable=False, server_default=text("false"))
    is_active    = Column(Boolean, nullable=False, server_default=text("true"))
    created_at   = Column(DateTime, server_default=text("now()"), nullable=False)

    # Self-referencing relationship
    manager      = relationship("User", remote_side=[id], backref="subordinates")
    call_logs    = relationship("CallLog", back_populates="user", cascade="all, delete-orphan")


class CallLog(Base):
    __tablename__ = "call_logs"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone_number     = Column(String, nullable=False)
    call_type        = Column(String, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    timestamp        = Column(String, nullable=False)
    system_call_id   = Column(String, nullable=False)
    created_at       = Column(DateTime, server_default=text("now()"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="call_logs")
