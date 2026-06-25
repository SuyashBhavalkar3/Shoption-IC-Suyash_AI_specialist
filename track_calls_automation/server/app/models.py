import uuid
import secrets
import string
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

def generate_invite_code(length=8):
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))

class Organisation(Base):
    __tablename__ = "organisations"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String, unique=True, index=True, nullable=False)
    invite_code = Column(String, unique=True, index=True, nullable=True, default=generate_invite_code)
    created_at = Column(DateTime, server_default=text("now()"), nullable=False)

    users         = relationship("User", back_populates="organisation")
    org_employees = relationship("OrgEmployee", back_populates="organisation", cascade="all, delete-orphan")


from sqlalchemy import Table

user_managers = Table(
    "user_managers",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("manager_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
)


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
    is_tracking_enabled = Column(Boolean, nullable=False, server_default=text("true"), default=True)
    is_tracking_active  = Column(Boolean, nullable=False, server_default=text("false"), default=False)
    created_at   = Column(DateTime, server_default=text("now()"), nullable=False)
    # system_id links this user to their org_employees record (set at registration if employee_id is provided)
    system_id    = Column(String(6), unique=True, nullable=True, index=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)
    last_activity_timestamp = Column(DateTime, nullable=True)
    department   = Column(String, nullable=True)

    # Self-referencing relationship
    manager      = relationship("User", remote_side=[id], backref="subordinates")
    managers     = relationship(
        "User",
        secondary=user_managers,
        primaryjoin="User.id==user_managers.c.user_id",
        secondaryjoin="User.id==user_managers.c.manager_id",
        backref="subordinates_multi"
    )
    call_logs    = relationship("CallLog", back_populates="user", cascade="all, delete-orphan")
    organisation = relationship("Organisation", back_populates="users")

    @property
    def manager_ids(self):
        return [m.id for m in self.managers]


class CallLog(Base):
    __tablename__ = "call_logs"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone_number     = Column(String, nullable=False)
    call_type        = Column(String, nullable=False)
    call_status      = Column(String, nullable=False, server_default="Answered")
    duration_seconds = Column(Integer, nullable=False)
    timestamp        = Column(String, nullable=False)
    system_call_id   = Column(String, nullable=False)
    created_at       = Column(DateTime, server_default=text("now()"), nullable=False)
    # system_id is copied from user.system_id at call-log creation time for cross-table access
    system_id        = Column(String(6), nullable=True, index=True)
    employee_id      = Column(String, nullable=True)
    org_id           = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="call_logs")


class OTP(Base):
    __tablename__ = "otps"

    id          = Column(Integer, primary_key=True, index=True)
    email       = Column(String, index=True, nullable=False)
    otp_code    = Column(String, nullable=False)
    is_verified = Column(Boolean, nullable=False, server_default=text("false"), default=False)
    created_at  = Column(DateTime, server_default=text("now()"), nullable=False)


class OrgEmployee(Base):
    """
    Maps a client-provided employee_id to our internally generated 6-digit system_id.
    Scoped to an organisation — same employee_id can exist in two different orgs.
    system_id is the primary identifier used in webhook payloads.
    """
    __tablename__ = "org_employees"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    system_id   = Column(String(6), unique=True, nullable=False, index=True)
    employee_id = Column(String, nullable=False)
    email       = Column(String, nullable=True, index=True)
    department  = Column(String, nullable=True)
    is_tracking_needed = Column(Boolean, nullable=False, server_default=text("true"), default=True)
    org_id      = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    created_at  = Column(DateTime, server_default=text("now()"), nullable=False)

    organisation = relationship("Organisation", back_populates="org_employees")

    __table_args__ = (
        UniqueConstraint("org_id", "employee_id", name="uq_org_employee"),
    )


class WebUser(Base):
    __tablename__ = "web_users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name     = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)
    created_at    = Column(DateTime, server_default=text("now()"), nullable=False)

    subscription  = relationship("WebhookSubscription", back_populates="web_user", cascade="all, delete-orphan", uselist=False)
    organisation  = relationship("Organisation")


class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    web_user_id = Column(UUID(as_uuid=True), ForeignKey("web_users.id", ondelete="CASCADE"), nullable=False, unique=True)
    target_url  = Column(String(2048), nullable=False)
    secret_token = Column(String(255), nullable=False)
    is_active   = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime, server_default=text("now()"), nullable=False)

    web_user    = relationship("WebUser", back_populates="subscription")
    logs        = relationship("WebhookLog", back_populates="subscription", cascade="all, delete-orphan")


class WebhookLog(Base):
    __tablename__ = "webhook_logs"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("webhook_subscriptions.id", ondelete="CASCADE"), nullable=False)
    event_type      = Column(String(50), nullable=False)
    payload         = Column(String, nullable=False)  # We will store JSON stringified payloads
    response_status = Column(Integer, nullable=True)
    response_body   = Column(String, nullable=True)
    attempt_number  = Column(Integer, nullable=False, default=1)
    status          = Column(String(20), nullable=False, default="pending")  # 'success', 'failed', 'retrying'
    created_at      = Column(DateTime, server_default=text("now()"), nullable=False)

    subscription    = relationship("WebhookSubscription", back_populates="logs")
