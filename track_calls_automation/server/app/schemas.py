from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

# ── Role Enums ────────────────────────────────────────────────────────────────

class RegistrationRole(str, Enum):
    """
    Roles a user can SELECT during self-registration.
    super_admin is intentionally excluded — it is created manually by the
    software owner directly in the database.
    """
    warrior      = "warrior"
    group_leader = "group_leader"
    admin        = "admin"

# ── User Schemas ─────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    """
    Self-registration form.
    - role: choose warrior / group_leader / admin from the dropdown.
    - super_admin cannot be self-registered (blocked at server level too).
    - NO manager_id — assigned later by admin.
    """
    password: str
    role: RegistrationRole = RegistrationRole.warrior

class UserOut(UserBase):
    id: UUID
    role: str
    manager_id: Optional[UUID] = None
    is_approved: bool
    is_active: bool
    is_tracking_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserOutBasic(BaseModel):
    """Lightweight view used inside reports (no sensitive fields)."""
    id: UUID
    full_name: str
    email: EmailStr
    role: str
    is_approved: bool
    is_tracking_enabled: bool

    class Config:
        from_attributes = True

# ── Admin action schemas ──────────────────────────────────────────────────────

class ApproveWarrior(BaseModel):
    """
    Admin approves a pending warrior/group_leader AND assigns warrior to
    a group_leader in one atomic action.
    - For warriors:      warrior_id + leader_id (required)
    - For group_leaders: warrior_id only (leader_id is ignored / optional)
    """
    user_id: UUID    # the pending warrior or group_leader to approve
    leader_id: Optional[UUID] = None  # required only when approving a warrior

class RoleUpdate(BaseModel):
    user_id: UUID
    role: str  # super_admin | admin | group_leader | warrior

# ── Token Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

# ── Call Log Schemas ──────────────────────────────────────────────────────────

class CallLogBase(BaseModel):
    phone_number: str
    call_type: str
    duration_seconds: int
    timestamp: str
    system_call_id: str

class CallLogCreate(CallLogBase):
    pass

class CallLogOut(CallLogBase):
    id: int
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ── Analytics / Report Schemas ────────────────────────────────────────────────

class CallDetail(BaseModel):
    phone_number: str
    call_type: str
    duration_seconds: int
    timestamp: str

class WarriorReport(BaseModel):
    warrior_id: UUID
    full_name: str
    is_tracking_enabled: bool
    total_calls: int
    incoming_calls_count: int
    outgoing_calls_count: int
    total_calling_seconds: int
    total_calling_hours: float
    average_call_seconds: float
    calls: List[CallDetail]
    manager_id: Optional[UUID] = None
    manager_name: Optional[str] = None

class LeaderReportResponse(BaseModel):
    leader_id: UUID
    leader_name: str
    overall_total_calls: int
    overall_incoming_calls_count: int
    overall_outgoing_calls_count: int
    overall_total_calling_hours: float
    overall_average_call_seconds: float
    warriors: List[WarriorReport]
