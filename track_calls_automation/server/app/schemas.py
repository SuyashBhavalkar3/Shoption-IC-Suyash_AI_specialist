from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Union
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
    super_admin  = "super_admin"

# ── Organisation Schemas ──────────────────────────────────────────────────────

class OrganisationBase(BaseModel):
    name: str

class OrganisationCreate(OrganisationBase):
    pass

class OrganisationOut(OrganisationBase):
    id: UUID
    invite_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProvisionOrganisationRequest(BaseModel):
    passcode: str
    organisation_name: str
    super_admin_email: EmailStr

class ProvisionOrganisationResponse(BaseModel):
    organisation_id: UUID
    organisation_name: str
    invite_code: str
    super_admin: "UserOut"


class SendOtpRequest(BaseModel):
    passcode: str


class VerifyOtpRequest(BaseModel):
    passcode: str
    otp: str



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
    organisation_id: Optional[UUID] = None
    organisation_invite_code: Optional[str] = None
    # Optional: employee enters their company-issued employee_id at registration.
    # If provided + org found, system auto-links their system_id from org_employees.
    employee_id: Optional[str] = None

class UserOut(UserBase):
    id: UUID
    role: str
    manager_id: Optional[UUID] = None
    manager_ids: List[UUID] = []
    organisation_id: Optional[UUID] = None
    system_id: Optional[str] = None
    is_approved: bool
    is_active: bool
    is_tracking_active: bool
    created_at: datetime
    employee_id: Optional[str] = None
    department: Optional[str] = None

    @property
    def is_tracking_enabled(self) -> bool:
        return self.is_tracking_active

    class Config:
        from_attributes = True

class UserOutBasic(BaseModel):
    """Lightweight view used inside reports (no sensitive fields)."""
    id: UUID
    full_name: str
    email: EmailStr
    role: str
    is_approved: bool
    is_tracking_active: bool
    organisation_id: Optional[UUID] = None
    system_id: Optional[str] = None

    @property
    def is_tracking_enabled(self) -> bool:
        return self.is_tracking_active

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
    call_status: Optional[str] = None
    duration_seconds: int
    timestamp: Union[str, datetime]
    system_call_id: str

class CallLogCreate(CallLogBase):
    pass

class CallLogOut(CallLogBase):
    id: int
    user_id: UUID
    system_id: Optional[str] = None
    employee_id: Optional[str] = None
    org_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ── Analytics / Report Schemas ────────────────────────────────────────────────

class CallDetail(BaseModel):
    phone_number: str
    call_type: str
    call_status: Optional[str] = None
    duration_seconds: int
    timestamp: Union[str, datetime]

class WarriorReport(BaseModel):
    warrior_id: UUID
    full_name: str
    department: Optional[str] = None
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
    warriors: List[WarriorReport] = []


# ── Org Employee Schemas ──────────────────────────────────────────────────────

class OrgEmployeeCreate(BaseModel):
    """Single manual entry — org_id is taken from the authenticated super_admin's session."""
    employee_id: str
    email: Optional[EmailStr] = None

class OrgEmployeeOut(BaseModel):
    id: UUID
    system_id: str
    employee_id: str
    email: Optional[str] = None
    department: Optional[str] = None
    is_tracking_needed: bool
    org_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class OrgEmployeeSkippedRow(BaseModel):
    """Details about a row that was skipped during bulk upload."""
    employee_id: str
    reason: str

class OrgEmployeeBulkUploadResult(BaseModel):
    """Response returned after a CSV/bulk upload."""
    total_rows: int
    created: int
    skipped: int
    skipped_details: List[OrgEmployeeSkippedRow]


# ── Web User & Webhook Schemas ─────────────────────────────────────────────

class WebUserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class WebUserLogin(BaseModel):
    email: EmailStr
    password: str

class WebUserOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    organisation_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WebhookSubscriptionCreate(BaseModel):
    target_url: str
    verification_secret: Optional[str] = None
    is_active: Optional[bool] = True

class WebhookSubscriptionOut(BaseModel):
    id: UUID
    web_user_id: UUID
    target_url: str
    secret_token: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserTrackStatusPayload(BaseModel):
    emp_id: str
    organisation_id: str
    last_activity_timestamp: str
    is_tracking_enabled: bool
    system_id: str
    is_on_call: Optional[bool] = None

class UserCallStatePayload(BaseModel):
    is_on_call: bool

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    manager_id: Optional[UUID] = None
    manager_ids: Optional[List[UUID]] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None
    system_id: Optional[str] = None


class DemoBookingCreate(BaseModel):
    fullName: str = Field(..., min_length=1)
    email: EmailStr
    phone: str
    orgName: str = Field(..., min_length=1)
    painPlan: str = Field(..., min_length=1)
    description: str = Field(..., min_length=10)

    @field_validator("email")
    @classmethod
    def validate_work_email(cls, v: EmailStr) -> EmailStr:
        email_lower = str(v).strip().lower()
        blocked_domains = {
            "gmail.com", "yahoo.com", "ymail.com", "outlook.com", "hotmail.com",
            "live.com", "msn.com", "aol.com", "icloud.com", "mail.com",
            "zoho.com", "protonmail.com", "proton.me", "gmx.com"
        }
        parts = email_lower.split("@")
        if len(parts) == 2:
            domain = parts[1]
            if domain in blocked_domains:
                raise ValueError("Only company email is required (free email providers are not allowed)")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        import re
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10:
            raise ValueError("Phone number must contain at least 10 digits")
        if len(digits) not in [10, 11, 12]:
            raise ValueError("Phone number must be a 10-digit number (excluding country code)")
        return v


class DemoBookingOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: str
    org_name: str
    pain_plan: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Analytics Schemas ───────────────────────────────────────────────

class DashboardUserCounts(BaseModel):
    total_users: int = 0
    admins: int = 0
    leaders: int = 0
    warriors: int = 0
    super_admins: int = 0
    approved: int = 0
    active: int = 0
    tracking_on: int = 0
    employees: int = 0
    employees_tracking_needed: int = 0
    employees_tracking_active: int = 0


class DashboardCallMetrics(BaseModel):
    total_calls_done: int = 0
    total_success_calls: int = 0
    total_talk_seconds: int = 0
    total_talk_time_formatted: str = "00:00"
    avg_tt_call_formatted: str = "00:00"

    incoming_calls: int = 0
    incoming_success_calls: int = 0
    incoming_talk_seconds: int = 0
    incoming_talk_time_formatted: str = "00:00"
    avg_tt_incoming_formatted: str = "00:00"

    outgoing_calls: int = 0
    outgoing_success_calls: int = 0
    outgoing_talk_seconds: int = 0
    outgoing_talk_time_formatted: str = "00:00"
    avg_tt_outgoing_formatted: str = "00:00"

    total_missed: int = 0
    missed_not_responded: int = 0
    avg_response_time_seconds: float = 0.0
    avg_response_time_formatted: str = "-"

    dropped_calls: int = 0
    incoming_dropped_calls: int = 0
    outgoing_dropped_calls: int = 0


class WarriorDashboardSummary(BaseModel):
    warrior_id: UUID
    full_name: str
    email: str
    department: Optional[str] = None
    role: str
    manager_id: Optional[UUID] = None
    is_tracking_enabled: bool = False
    is_tracking_active: bool = False

    total_calls: int = 0
    success_calls: int = 0
    total_calling_seconds: int = 0
    total_calling_hours: float = 0.0
    average_call_seconds: float = 0.0

    incoming_calls_count: int = 0
    incoming_success_calls_count: int = 0
    outgoing_calls_count: int = 0
    outgoing_success_calls_count: int = 0

    total_missed_calls: int = 0
    missed_not_responded: int = 0
    dropped_calls_count: int = 0

    avg_response_time_seconds: float = 0.0


class TimeDistributionBucket(BaseModel):
    time_label: str
    time_val: float
    total: int = 0
    incoming: int = 0
    outgoing: int = 0
    missed: int = 0
    dropped: int = 0


class DashboardMetricsResponse(BaseModel):
    user_counts: DashboardUserCounts
    totals: DashboardCallMetrics
    warrior_summaries: List[WarriorDashboardSummary] = []
    hourly_distribution: List[TimeDistributionBucket] = []
    filter_start_date: Optional[str] = None
    filter_end_date: Optional[str] = None


