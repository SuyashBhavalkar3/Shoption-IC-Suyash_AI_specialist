from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import csv
import io
import os
import time
import uuid
from datetime import datetime, timezone as py_timezone, timedelta as py_timedelta
from jose import jwt, JWTError
from app.config import JWT_SECRET_KEY, JWT_ALGORITHM
from app.database import get_db
import hashlib
from app.models import User, CallLog, OrgEmployee
from app.schemas import (
    CallLogCreate, CallLogOut, LeaderReportResponse, WarriorReport, CallDetail,
    DashboardMetricsResponse, DashboardUserCounts, DashboardCallMetrics,
    WarriorDashboardSummary, TimeDistributionBucket
)
from app.security import get_current_user
from app.webhooks_dispatcher import dispatch_webhook

def clean_timestamp(ts) -> datetime:
    if isinstance(ts, datetime):
        return ts
    try:
        from dateutil import parser
        return parser.parse(ts)
    except Exception:
        return datetime.utcnow()

def generate_deterministic_uuid7(user_id: str, client_id: str, timestamp_str: str) -> str:
    """Generates a strictly unique, time-ordered, deterministic UUIDv7 based on user_id, client_id, and timestamp."""
    try:
        from dateutil import parser
        dt = parser.parse(timestamp_str)
        ms = int(dt.timestamp() * 1000)
    except Exception:
        ms = int(time.time() * 1000)
        
    ms = ms & 0xffffffffffff
    
    # Hash of user_id + client_id
    hasher = hashlib.sha256(f"{user_id}:{client_id}".encode('utf-8'))
    hash_bytes = bytearray(hasher.digest())
    
    # Construct UUID bytes
    uuid_bytes = bytearray(16)
    
    # Set timestamp (first 6 bytes)
    uuid_bytes[0] = (ms >> 40) & 0xff
    uuid_bytes[1] = (ms >> 32) & 0xff
    uuid_bytes[2] = (ms >> 24) & 0xff
    uuid_bytes[3] = (ms >> 16) & 0xff
    uuid_bytes[4] = (ms >> 8) & 0xff
    uuid_bytes[5] = ms & 0xff
    
    # Copy hash bytes to the rest
    uuid_bytes[6:] = hash_bytes[:10]
    
    # Set version to 7 (bits 48-51 to 0111)
    uuid_bytes[6] = (uuid_bytes[6] & 0x0f) | 0x70
    
    # Set variant to RFC 4122 (bits 64-65 to 10)
    uuid_bytes[8] = (uuid_bytes[8] & 0x3f) | 0x80
    
    return str(uuid.UUID(bytes=bytes(uuid_bytes)))

def generate_uuid7() -> uuid.UUID:
    """Generates a time-ordered sequential UUIDv7 (RFC 4122 compliant)"""
    ms = int(time.time() * 1000)
    rand_bytes = bytearray(os.urandom(16))
    
    # Fill in the timestamp (first 48 bits / 6 bytes)
    rand_bytes[0] = (ms >> 40) & 0xff
    rand_bytes[1] = (ms >> 32) & 0xff
    rand_bytes[2] = (ms >> 24) & 0xff
    rand_bytes[3] = (ms >> 16) & 0xff
    rand_bytes[4] = (ms >> 8) & 0xff
    rand_bytes[5] = ms & 0xff
    
    # Set version to 7 (bits 48-51 to 0111)
    rand_bytes[6] = (rand_bytes[6] & 0x0f) | 0x70
    
    # Set variant to RFC 4122 (bits 64-65 to 10)
    rand_bytes[8] = (rand_bytes[8] & 0x3f) | 0x80
    
    return uuid.UUID(bytes=bytes(rand_bytes))


router = APIRouter(
    prefix="/calls",
    tags=["Call Logs"]
)


def _normalize_call_type(raw_call_type: str, duration_seconds: int) -> tuple[str, str]:
    raw = (raw_call_type or "").strip().lower()
    is_incoming = raw in ["incoming", "missed", "rejected", "blocked"]
    direction = "Incoming" if is_incoming else "Outgoing"

    if 1 <= duration_seconds <= 10:
        return direction, "Dropped Call"

    if is_incoming:
        return direction, "Answered" if duration_seconds > 0 else "Missed Call"

    return direction, "Answered" if duration_seconds > 0 else "Dialed"


def _format_created_at_to_ist_str(created_at: Optional[datetime]) -> str:
    dt = created_at or datetime.utcnow()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=py_timezone.utc)
    ist_tz = py_timezone(py_timedelta(hours=5, minutes=30))
    ist_dt = dt.astimezone(ist_tz)
    return ist_dt.strftime('%d%m%Y%H%M%S%f')[:-4]

@router.post("/", response_model=List[CallLogOut], status_code=status.HTTP_201_CREATED)
def sync_call_logs(
    logs_in: List[CallLogCreate], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    print(f"INFO: Received POST /calls/ request from {current_user.email} with {len(logs_in)} logs.")
    
    # Pre-fetch matching employee_id
    emp_id = None
    if current_user.system_id:
        emp_record = db.query(OrgEmployee).filter(OrgEmployee.system_id == current_user.system_id).first()
        if emp_record:
            emp_id = emp_record.employee_id

    # Clean and pre-process timestamps, then generate strictly unique, time-ordered, deterministic UUIDv7 for each incoming call log.
    # This prevents cross-user collisions (e.g. simple numeric IDs like '5246') and preserves idempotency on retries.
    cleaned_timestamps = []
    resolved_ids = {}
    for log_data in logs_in:
        cleaned_ts = clean_timestamp(log_data.timestamp)
        cleaned_timestamps.append(cleaned_ts)
        if log_data.system_call_id:
            resolved_ids[log_data.system_call_id] = generate_deterministic_uuid7(
                str(current_user.id), log_data.system_call_id, cleaned_ts.isoformat()
            )
            
    existing_logs = []
    if resolved_ids:
        existing_logs = db.query(CallLog).filter(
            CallLog.system_call_id.in_(list(resolved_ids.values())),
            CallLog.user_id == current_user.id
        ).all()
    
    # Map existing logs by system_call_id for O(1) lookups
    existing_map = {log.system_call_id: log for log in existing_logs if log.system_call_id}

    to_insert_logs = []
    to_return_logs = []
    webhook_payloads = []  # Collect all new log payloads to batch into a single background task

    for idx, log_data in enumerate(logs_in):
        resolved_id = resolved_ids.get(log_data.system_call_id)
        exists = existing_map.get(resolved_id) if resolved_id else None
        call_type, call_status = _normalize_call_type(log_data.call_type, log_data.duration_seconds)
        cleaned_ts = cleaned_timestamps[idx]
        
        if not exists:
            db_log = CallLog(
                user_id=current_user.id,
                phone_number=log_data.phone_number,
                call_type=call_type,
                call_status=call_status,
                duration_seconds=log_data.duration_seconds,
                timestamp=cleaned_ts,
                system_call_id=resolved_id,
                created_at=datetime.utcnow(),
                system_id=current_user.system_id,
                employee_id=emp_id,
                org_id=current_user.organisation_id
            )
            to_insert_logs.append(db_log)
            to_return_logs.append(db_log)
            webhook_payloads.append({
                "phone_number": db_log.phone_number,
                "call_type": db_log.call_type,
                "call_status": db_log.call_status,
                "duration_seconds": db_log.duration_seconds,
                "timestamp": cleaned_ts.isoformat(),
                "system_call_id": db_log.system_call_id,
                "employee_id": db_log.employee_id,
                "system_id": db_log.system_id
            })
            
        elif exists.user_id is None:
            # If log exists but user_id is None, link it to the syncing user
            exists.user_id = current_user.id
            exists.system_id = current_user.system_id
            exists.employee_id = emp_id
            exists.org_id = current_user.organisation_id
            exists.call_type = call_type
            exists.call_status = call_status
            to_return_logs.append(exists)
            
            ts_str = exists.timestamp.isoformat() if isinstance(exists.timestamp, datetime) else exists.timestamp
            webhook_payloads.append({
                "phone_number": exists.phone_number,
                "call_type": exists.call_type,
                "call_status": exists.call_status,
                "duration_seconds": exists.duration_seconds,
                "timestamp": ts_str,
                "system_call_id": exists.system_call_id,
                "employee_id": exists.employee_id,
                "system_id": exists.system_id
            })

    try:
        if to_insert_logs:
            # bulk_save_objects handles batch inserts and populates database defaults
            db.bulk_save_objects(to_insert_logs, return_defaults=True)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to save call logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save synced call logs"
        )

    # Fire a SINGLE background task for the entire batch of new logs, BUT only if
    # active subscriptions actually exist. This avoids scheduling background tasks
    # and spawning DB connection sessions in the background when no webhooks are configured.
    if webhook_payloads:
        from app.webhooks_dispatcher import _get_active_subscriptions
        # Reuse current_user's organisation_id to check for subscriptions using the active DB session
        has_active_subs = False
        if current_user.organisation_id:
            try:
                subs = _get_active_subscriptions(db, current_user.organisation_id)
                has_active_subs = len(subs) > 0
            except Exception as e:
                print(f"ERROR: Failed to check active webhook subscriptions: {e}")
        
        if has_active_subs:
            background_tasks.add_task(
                dispatch_webhook,
                current_user.organisation_id,
                "call.synced",
                webhook_payloads
            )
        else:
            print(f"INFO: No active webhook subscriptions for org {current_user.organisation_id}. Webhook dispatch skipped.")

    print(f"INFO: Post calls successful. {len(to_return_logs)} calls synced to database for user {current_user.email}.")
    return to_return_logs

@router.get("/", response_model=List[CallLogOut])
def get_my_call_logs(
    limit: int = 100,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch call logs belonging to the current logged-in user with pagination and optional date filters."""
    print(f"INFO: GET /calls/ requested by user {current_user.email} (limit={limit}, offset={offset}, start={start_date}, end={end_date})")
    
    query = db.query(CallLog).filter(CallLog.user_id == current_user.id)
    
    if start_date:
        try:
            start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), datetime.min.time())
            query = query.filter(func.parse_my_timestamp(CallLog.timestamp) >= start_dt)
        except Exception:
            pass
    if end_date:
        try:
            end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), datetime.max.time())
            query = query.filter(func.parse_my_timestamp(CallLog.timestamp) <= end_dt)
        except Exception:
            pass
            
    return query.order_by(CallLog.timestamp.desc()).offset(offset).limit(limit).all()
@router.get("/reports", response_model=LeaderReportResponse)
def get_reports(
    leader_id: Optional[str] = None,
    warrior_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    print(f"INFO: GET /calls/reports requested by user {current_user.email} (Role: {current_user.role}) Filter: leader={leader_id}, warrior={warrior_id}, start={start_date}, end={end_date}")
    # Determine which warriors to include based on user role
    if current_user.role == "warrior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Warriors do not have access to overview reports"
        )
        
    elif current_user.role == "group_leader":
        # Get all warriors reporting to this leader, plus the leader themselves
        warriors = db.query(User).filter(User.manager_id == current_user.id, User.role == "warrior").all()
        warriors = list(warriors) + [current_user]
        
    elif current_user.role == "super_admin":
        # Super Admins get all users in the organisation (all roles)
        org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
        warriors = db.query(User).filter(org_filter).all()
    elif current_user.role == "admin":
        # Admins get all users in their organisation EXCEPT super_admin users
        org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
        warriors = db.query(User).filter(org_filter, User.role != "super_admin").all()
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown user role"
        )

    # Apply selected leader / warrior filters on the list of users
    if warrior_id and warrior_id != "all":
        warriors = [w for w in warriors if str(w.id) == warrior_id]
    elif leader_id and leader_id != "all":
        # Filter list to only users reporting to this leader, plus the leader themselves
        warriors = [w for w in warriors if str(w.manager_id) == leader_id or str(w.id) == leader_id]

    warrior_reports = []
    overall_total_calls = 0
    overall_incoming_count = 0
    overall_outgoing_count = 0
    overall_total_seconds = 0

    for warrior in warriors:
        query = db.query(CallLog).filter(CallLog.user_id == warrior.id)
        
        # Apply start and end date filters on the query
        if start_date:
            try:
                start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), datetime.min.time())
                query = query.filter(func.parse_my_timestamp(CallLog.timestamp) >= start_dt)
            except Exception:
                pass
        if end_date:
            try:
                end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), datetime.max.time())
                query = query.filter(func.parse_my_timestamp(CallLog.timestamp) <= end_dt)
            except Exception:
                pass
                
        # Fetch all call logs
        logs = query.order_by(CallLog.timestamp.desc(), CallLog.id.desc()).all()
        
        total_calls = len(logs)
        incoming_count = sum(1 for l in logs if (l.call_type or "").lower() in ["incoming", "missed", "rejected", "blocked"])
        outgoing_count = sum(1 for l in logs if (l.call_type or "").lower() == "outgoing")
        total_seconds = sum(l.duration_seconds for l in logs)
        
        avg_seconds = total_seconds / total_calls if total_calls > 0 else 0.0
        total_hours = total_seconds / 3600.0

        overall_total_calls += total_calls
        overall_incoming_count += incoming_count
        overall_outgoing_count += outgoing_count
        overall_total_seconds += total_seconds

        calls_details = [
            CallDetail(
                phone_number=l.phone_number,
                call_type=l.call_type,
                call_status=l.call_status,
                duration_seconds=l.duration_seconds,
                timestamp=l.timestamp
            ) for l in logs
        ]

        # Resolve dynamic tracking status
        is_tracking_enabled_dynamic = False
        if warrior.is_tracking_active:
            should_deactivate = False
            if warrior.last_activity_timestamp:
                diff = (datetime.utcnow() - warrior.last_activity_timestamp).total_seconds()
                if diff < 120:
                    is_tracking_enabled_dynamic = True
                else:
                    should_deactivate = True
            else:
                should_deactivate = True

            if should_deactivate:
                warrior.is_tracking_active = False
                db.commit()

        warrior_reports.append(
            WarriorReport(
                warrior_id=warrior.id,
                full_name=warrior.full_name,
                department=warrior.department,
                is_tracking_enabled=is_tracking_enabled_dynamic,
                total_calls=total_calls,
                incoming_calls_count=incoming_count,
                outgoing_calls_count=outgoing_count,
                total_calling_seconds=total_seconds,
                total_calling_hours=round(total_hours, 2),
                average_call_seconds=round(avg_seconds, 2),
                calls=calls_details,
                manager_id=warrior.manager_id,
                manager_name=warrior.manager.full_name if warrior.manager else None
            )
        )

    overall_avg_seconds = overall_total_seconds / overall_total_calls if overall_total_calls > 0 else 0.0
    overall_hours = overall_total_seconds / 3600.0

    return LeaderReportResponse(
        leader_id=current_user.id,
        leader_name=current_user.full_name,
        overall_total_calls=overall_total_calls,
        overall_incoming_calls_count=overall_incoming_count,
        overall_outgoing_calls_count=overall_outgoing_count,
        overall_total_calling_hours=round(overall_hours, 2),
        overall_average_call_seconds=round(overall_avg_seconds, 2),
        warriors=warrior_reports,
    )


from fastapi import Request

def get_user_from_query_token(token: Optional[str], db: Session, request: Request = None):
    # Fallback to Authorization header if token query param is missing
    if not token and request:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing")
        
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_recursive_subordinate_ids(user_id, db) -> list:
    from uuid import UUID
    uid = user_id if isinstance(user_id, UUID) else UUID(user_id)
    descendants = [uid]
    from app.models import User
    direct_reports = db.query(User.id).filter(User.manager_id == uid).all()
    for report in direct_reports:
        descendants.extend(get_recursive_subordinate_ids(report[0], db))
    return descendants


@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard_summary(
    leader_id: Optional[str] = None,
    warrior_id: Optional[str] = None,
    subordinate_id: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    High-performance pre-aggregated dashboard data endpoint.
    Computes all metrics, totals, warrior summaries, and time distributions on the backend database level.
    """
    if current_user.role == "warrior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Warriors do not have access to dashboard overview"
        )

    org_id = current_user.organisation_id

    # 1. Determine scoped users based on user role and organisation
    org_filter = User.organisation_id == org_id if org_id is not None else User.organisation_id.is_(None)

    if current_user.role == "super_admin":
        users_query = db.query(User).filter(org_filter)
    elif current_user.role == "admin":
        users_query = db.query(User).filter(org_filter, User.role != "super_admin")
    elif current_user.role == "group_leader":
        sub_ids = get_recursive_subordinate_ids(current_user.id, db)
        users_query = db.query(User).filter(User.id.in_(sub_ids))
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown role")

    all_scoped_users = users_query.all()
    user_map = {str(u.id): u for u in all_scoped_users}
    all_scoped_user_ids = [u.id for u in all_scoped_users]

    # Calculate overall User Counts
    total_users = len(all_scoped_users)
    admins_count = sum(1 for u in all_scoped_users if u.role == "admin")
    leaders_count = sum(1 for u in all_scoped_users if u.role == "group_leader")
    warriors_count = sum(1 for u in all_scoped_users if u.role == "warrior")
    super_admins_count = sum(1 for u in all_scoped_users if u.role == "super_admin")
    approved_count = sum(1 for u in all_scoped_users if u.is_approved)
    active_count = sum(1 for u in all_scoped_users if u.is_active)

    # Resolve active tracking status (auto-deactivate stale tracking > 120s)
    now_utc = datetime.utcnow()
    tracking_on_count = 0
    employees_tracking_active_count = 0

    for u in all_scoped_users:
        is_active_tr = False
        if u.is_tracking_active:
            if u.last_activity_timestamp and (now_utc - u.last_activity_timestamp).total_seconds() < 120:
                is_active_tr = True
            else:
                u.is_tracking_active = False
        if is_active_tr:
            tracking_on_count += 1
            employees_tracking_active_count += 1

    db.commit()

    # Employee counts
    emp_query = db.query(OrgEmployee)
    if org_id is not None:
        emp_query = emp_query.filter(OrgEmployee.org_id == org_id)
    all_employees = emp_query.all()
    employees_count = len(all_employees)
    employees_tracking_needed_count = sum(1 for e in all_employees if e.is_tracking_needed)

    user_counts = DashboardUserCounts(
        total_users=total_users,
        admins=admins_count,
        leaders=leaders_count,
        warriors=warriors_count,
        super_admins=super_admins_count,
        approved=approved_count,
        active=active_count,
        tracking_on=tracking_on_count,
        employees=employees_count,
        employees_tracking_needed=employees_tracking_needed_count,
        employees_tracking_active=employees_tracking_active_count,
    )

    # 2. Filter target warriors/users by requested filters (search, leader_id, warrior_id, subordinate_id)
    target_user_ids = list(all_scoped_user_ids)

    # Text search by name or email
    if search and search.strip():
        search_q = search.lower().strip()
        matched_user_ids = set()
        for u in all_scoped_users:
            if search_q in (u.full_name or "").lower() or search_q in (u.email or "").lower():
                desc_ids = get_recursive_subordinate_ids(u.id, db)
                matched_user_ids.update(desc_ids)
        target_user_ids = [uid for uid in target_user_ids if uid in matched_user_ids]

    # Specific dropdown selection filter
    selected_sub_id = subordinate_id or (warrior_id if warrior_id and warrior_id != "all" else None)
    if not selected_sub_id and leader_id and leader_id != "all":
        selected_sub_id = leader_id

    if selected_sub_id and selected_sub_id != "all":
        try:
            sub_uuid = UUID(selected_sub_id)
            sub_descendant_ids = set(get_recursive_subordinate_ids(sub_uuid, db))
            target_user_ids = [uid for uid in target_user_ids if uid in sub_descendant_ids]
        except ValueError:
            pass


    # 3. Date range filters
    start_dt = None
    end_dt = None
    if start_date:
        try:
            start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), datetime.min.time())
        except Exception:
            pass
    if end_date:
        try:
            end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), datetime.max.time())
        except Exception:
            pass

    # 4. Fetch call logs for targeted users using indexed created_at column & lightweight tuples
    if target_user_ids:
        logs_query = db.query(
            CallLog.user_id,
            CallLog.phone_number,
            CallLog.call_type,
            CallLog.call_status,
            CallLog.duration_seconds,
            CallLog.created_at,
            CallLog.timestamp
        ).filter(CallLog.user_id.in_(target_user_ids))

        if start_dt:
            logs_query = logs_query.filter(CallLog.created_at >= start_dt)
        if end_dt:
            logs_query = logs_query.filter(CallLog.created_at <= end_dt)

        raw_logs = logs_query.all()
    else:
        raw_logs = []

    # 5. Fast memory calculation of call metrics matching DashboardScreen.tsx logic
    warrior_logs = {str(uid): [] for uid in target_user_ids}
    for log in raw_logs:
        uid_str = str(log.user_id)
        if uid_str in warrior_logs:
            warrior_logs[uid_str].append(log)

    def parse_log_dt(log):
        if hasattr(log, "created_at") and log.created_at:
            return log.created_at
        ts_str = getattr(log, "timestamp", None)
        if not ts_str:
            return None
        try:
            if "T" in ts_str or "Z" in ts_str:
                return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            parts = ts_str.strip().split()
            if len(parts) >= 2:
                dp = parts[0].split("-")
                tp = parts[1].split(":")
                if len(dp) >= 3 and len(tp) >= 2:
                    month_map = {"jan":1, "feb":2, "mar":3, "apr":4, "may":5, "jun":6, "jul":7, "aug":8, "sep":9, "oct":10, "nov":11, "dec":12}
                    m = month_map.get(dp[1].lower(), 1)
                    return datetime(int(dp[2]), m, int(dp[0]), int(tp[0]), int(tp[1]))
        except Exception:
            pass
        return None


    def process_logs_set(logs):
        incoming_calls = 0
        incoming_success_calls = 0
        incoming_talk_seconds = 0

        outgoing_calls = 0
        outgoing_success_calls = 0
        outgoing_talk_seconds = 0

        dropped_calls = 0
        incoming_dropped_calls = 0
        outgoing_dropped_calls = 0

        total_talk_seconds = 0
        total_success_calls = 0

        missed_calls_list = []
        outgoing_by_phone = {}

        for c in logs:
            type_lower = (c.call_type or "").strip().lower()
            status_lower = (c.call_status or "").strip().lower()
            duration = c.duration_seconds or 0

            is_incoming = type_lower in ["incoming", "missed", "rejected", "blocked"]
            is_outgoing = type_lower == "outgoing"

            is_dropped = (status_lower in ["dropped", "rejected", "failed"]) or (0 <= duration <= 10)
            is_missed = is_incoming and (status_lower in ["missed", "missed call"] or "missed" in status_lower or status_lower in ["rejected", "failed"] or duration == 0)
            is_dialed = is_outgoing and (status_lower in ["missed", "missed call", "dialed", "dropped", "rejected", "failed"] or "missed" in status_lower or "dialed" in status_lower or duration == 0 or is_dropped)

            is_success = (duration > 10) or (not is_dialed and not is_missed and not is_dropped and duration > 0)

            if is_success:
                total_success_calls += 1
            if is_dropped:
                dropped_calls += 1

            if is_incoming:
                incoming_calls += 1
                incoming_talk_seconds += duration
                if is_success:
                    incoming_success_calls += 1
                    if c.phone_number:
                        outgoing_by_phone.setdefault(c.phone_number, []).append(c)
                if is_dropped:
                    incoming_dropped_calls += 1
                if is_missed:
                    missed_calls_list.append(c)
            elif is_outgoing:
                outgoing_calls += 1
                outgoing_talk_seconds += duration
                if is_success:
                    outgoing_success_calls += 1
                if is_dropped:
                    outgoing_dropped_calls += 1
                if c.phone_number:
                    outgoing_by_phone.setdefault(c.phone_number, []).append(c)

            if duration > 0 and not is_missed and status_lower != "failed":
                total_talk_seconds += duration

        total_missed = max(0, incoming_calls - incoming_success_calls)
        total_calls_done = incoming_calls + outgoing_calls

        # Sort outgoing calls per phone
        for ph, plist in outgoing_by_phone.items():
            plist.sort(key=lambda x: parse_log_dt(x) or datetime.min)

        # De-duplicate missed calls by phone number (keeping the latest, which is first in descending order)
        unique_missed_calls = []
        seen_phones = set()
        for mc in missed_calls_list:
            phone = mc.phone_number
            if not phone:
                unique_missed_calls.append(mc)
            else:
                if phone not in seen_phones:
                    seen_phones.add(phone)
                    unique_missed_calls.append(mc)

        total_resp_seconds = 0
        responded_missed_count = 0
        for mc in unique_missed_calls:
            mc_dt = parse_log_dt(mc)
            if not mc_dt:
                continue
            candidates = outgoing_by_phone.get(mc.phone_number, [])
            for fc in candidates:
                fc_dt = parse_log_dt(fc)
                if fc_dt and fc_dt > mc_dt:
                    total_resp_seconds += (fc_dt - mc_dt).total_seconds()
                    responded_missed_count += 1
                    break


        missed_not_responded = max(0, len(unique_missed_calls) - responded_missed_count)
        avg_resp_seconds = total_resp_seconds / responded_missed_count if responded_missed_count > 0 else 0.0

        return {
            "total_calls_done": total_calls_done,
            "total_success_calls": total_success_calls,
            "total_talk_seconds": total_talk_seconds,
            "incoming_calls": incoming_calls,
            "incoming_success_calls": incoming_success_calls,
            "incoming_talk_seconds": incoming_talk_seconds,
            "outgoing_calls": outgoing_calls,
            "outgoing_success_calls": outgoing_success_calls,
            "outgoing_talk_seconds": outgoing_talk_seconds,
            "total_missed": total_missed,
            "missed_not_responded": missed_not_responded,
            "avg_response_time_seconds": avg_resp_seconds,
            "dropped_calls": dropped_calls,
            "incoming_dropped_calls": incoming_dropped_calls,
            "outgoing_dropped_calls": outgoing_dropped_calls,
        }

    overall_stats = process_logs_set(raw_logs)

    def format_hhmm(sec):
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        return f"{h:02d}:{m:02d}"

    def format_mmss(sec):
        m = int(sec // 60)
        s = int(sec % 60)
        return f"{m:02d}:{s:02d}"

    def format_resp_time(sec):
        if sec == 0:
            return "-"
        m = round(sec / 60)
        if m < 60:
            return f"{m}m"
        h = m // 60
        rem = m % 60
        return f"{h}h {rem}m"

    avg_tt_overall = overall_stats["total_talk_seconds"] / overall_stats["total_calls_done"] if overall_stats["total_calls_done"] > 0 else 0
    avg_tt_in = overall_stats["incoming_talk_seconds"] / overall_stats["incoming_calls"] if overall_stats["incoming_calls"] > 0 else 0
    avg_tt_out = overall_stats["outgoing_talk_seconds"] / overall_stats["outgoing_calls"] if overall_stats["outgoing_calls"] > 0 else 0

    totals = DashboardCallMetrics(
        total_calls_done=overall_stats["total_calls_done"],
        total_success_calls=overall_stats["total_success_calls"],
        total_talk_seconds=overall_stats["total_talk_seconds"],
        total_talk_time_formatted=format_hhmm(overall_stats["total_talk_seconds"]),
        avg_tt_call_formatted=format_mmss(avg_tt_overall),
        incoming_calls=overall_stats["incoming_calls"],
        incoming_success_calls=overall_stats["incoming_success_calls"],
        incoming_talk_seconds=overall_stats["incoming_talk_seconds"],
        incoming_talk_time_formatted=format_hhmm(overall_stats["incoming_talk_seconds"]),
        avg_tt_incoming_formatted=format_mmss(avg_tt_in),
        outgoing_calls=overall_stats["outgoing_calls"],
        outgoing_success_calls=overall_stats["outgoing_success_calls"],
        outgoing_talk_seconds=overall_stats["outgoing_talk_seconds"],
        outgoing_talk_time_formatted=format_hhmm(overall_stats["outgoing_talk_seconds"]),
        avg_tt_outgoing_formatted=format_mmss(avg_tt_out),
        total_missed=overall_stats["total_missed"],
        missed_not_responded=overall_stats["missed_not_responded"],
        avg_response_time_seconds=round(overall_stats["avg_response_time_seconds"], 2),
        avg_response_time_formatted=format_resp_time(overall_stats["avg_response_time_seconds"]),
        dropped_calls=overall_stats["dropped_calls"],
        incoming_dropped_calls=overall_stats["incoming_dropped_calls"],
        outgoing_dropped_calls=overall_stats["outgoing_dropped_calls"],
    )

    # 6. Build Warrior Dashboard Summaries
    warrior_summaries = []
    for uid_str, u_logs in warrior_logs.items():
        u = user_map.get(uid_str)
        if not u:
            continue
        w_stats = process_logs_set(u_logs)
        tot_calls = w_stats["total_calls_done"]
        tot_secs = w_stats["total_talk_seconds"]
        avg_secs = tot_secs / tot_calls if tot_calls > 0 else 0.0
        tot_hours = round(tot_secs / 3600.0, 2)

        warrior_summaries.append(
            WarriorDashboardSummary(
                warrior_id=u.id,
                full_name=u.full_name,
                email=u.email,
                department=u.department,
                role=u.role,
                manager_id=u.manager_id,
                is_tracking_enabled=u.is_tracking_active,
                is_tracking_active=u.is_tracking_active,
                total_calls=tot_calls,
                success_calls=w_stats["total_success_calls"],
                total_calling_seconds=tot_secs,
                total_calling_hours=tot_hours,
                average_call_seconds=round(avg_secs, 2),
                incoming_calls_count=w_stats["incoming_calls"],
                incoming_success_calls_count=w_stats["incoming_success_calls"],
                outgoing_calls_count=w_stats["outgoing_calls"],
                outgoing_success_calls_count=w_stats["outgoing_success_calls"],
                total_missed_calls=w_stats["total_missed"],
                missed_not_responded=w_stats["missed_not_responded"],
                dropped_calls_count=w_stats["dropped_calls"],
                avg_response_time_seconds=round(w_stats["avg_response_time_seconds"], 2),
            )
        )

    # 7. Time Distribution Buckets (15-minute interval distribution for selected date scope)
    interval_counts = {}
    for h in range(24):
        ampm = "PM" if h >= 12 else "AM"
        dh = 12 if h % 12 == 0 else h % 12
        for m in range(0, 60, 15):
            t_key = f"{h}:{m}"
            label = f"{dh}:{m:02d} {ampm}"
            interval_counts[t_key] = {
                "time_label": label,
                "time_val": h + m / 60.0,
                "total": 0,
                "incoming": 0,
                "outgoing": 0,
                "missed": 0,
                "dropped": 0
            }

    for log in raw_logs:
        dt = parse_log_dt(log)
        if not dt:
            continue

        h = dt.hour
        m = (dt.minute // 15) * 15
        t_key = f"{h}:{m}"

        type_l = (log.call_type or "").strip().lower()
        status_l = (log.call_status or "").strip().lower()
        dur = log.duration_seconds or 0

        is_inc = type_l in ["incoming", "missed", "rejected", "blocked"]
        is_out = type_l == "outgoing"
        is_drp = (status_l in ["dropped", "rejected", "failed"]) or (0 <= dur <= 10)
        is_mis = is_inc and (status_l in ["missed", "missed call"] or "missed" in status_l or status_l in ["rejected", "failed"] or dur == 0)

        if t_key in interval_counts:
            interval_counts[t_key]["total"] += 1
            if is_inc:
                interval_counts[t_key]["incoming"] += 1
            if is_out:
                interval_counts[t_key]["outgoing"] += 1
            if is_mis:
                interval_counts[t_key]["missed"] += 1
            if is_drp:
                interval_counts[t_key]["dropped"] += 1

    hourly_distribution = [
        TimeDistributionBucket(**item) for item in sorted(interval_counts.values(), key=lambda x: x["time_val"])
    ]

    return DashboardMetricsResponse(
        user_counts=user_counts,
        totals=totals,
        warrior_summaries=warrior_summaries,
        hourly_distribution=hourly_distribution,
        filter_start_date=start_date,
        filter_end_date=end_date,
    )


@router.get("/reports/export/csv")
def export_reports_csv(
    request: Request,
    token: Optional[str] = None,
    leader_id: str = "all",
    warrior_id: str = "all",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    current_user = get_user_from_query_token(token, db, request)
    print(f"INFO: Export reports to CSV requested by {current_user.email} (Leader ID: {leader_id}, Warrior ID: {warrior_id}, start={start_date}, end={end_date})")
    
    org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
    if current_user.role == "warrior":
        query = db.query(User).filter(User.id == current_user.id)
    elif current_user.role == "group_leader":
        from sqlalchemy import or_
        query = db.query(User).filter(
            org_filter,
            or_(
                (User.manager_id == current_user.id) & (User.role == "warrior"),
                User.id == current_user.id
            )
        )
    elif current_user.role == "super_admin" or current_user.role == "admin":
        query = db.query(User).filter(org_filter)
        if current_user.role == "admin":
            query = query.filter(User.role != "super_admin")
            
        if warrior_id and warrior_id != "all":
            query = query.filter(User.id == warrior_id)
        elif leader_id and leader_id != "all":
            descendant_ids = get_recursive_subordinate_ids(leader_id, db)
            query = query.filter(User.id.in_(descendant_ids))
        
    warriors = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Warrior Name", "Warrior Email", "Group Leader Name",
        "Phone Number", "Call Type", "Sub-Category", "Duration (seconds)", "Timestamp"
    ])
    
    for warrior in warriors:
        manager_name = warrior.manager.full_name if warrior.manager else "Unassigned"
        
        q = db.query(CallLog).filter(CallLog.user_id == warrior.id)
        if start_date:
            try:
                start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), datetime.min.time())
                q = q.filter(func.parse_my_timestamp(CallLog.timestamp) >= start_dt)
            except Exception:
                pass
        if end_date:
            try:
                end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), datetime.max.time())
                q = q.filter(func.parse_my_timestamp(CallLog.timestamp) <= end_dt)
            except Exception:
                pass
        logs = q.order_by(CallLog.timestamp.desc()).all()
        
        if not logs:
            writer.writerow([
                warrior.full_name, warrior.email, manager_name,
                "", "", "", "", ""
            ])
        else:
            for log in logs:
                sub_cat = log.call_status or "Answered"
                
                writer.writerow([
                    warrior.full_name, warrior.email, manager_name,
                    log.phone_number, log.call_type, sub_cat, log.duration_seconds, log.timestamp
                ])
                
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=team_reports.csv"}
    )

@router.get("/reports/export/pdf", response_class=HTMLResponse)
def export_reports_pdf(
    request: Request,
    token: Optional[str] = None,
    leader_id: str = "all",
    warrior_id: str = "all",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    current_user = get_user_from_query_token(token, db, request)
    print(f"INFO: Export reports to PDF requested by {current_user.email} (Leader ID: {leader_id}, Warrior ID: {warrior_id}, start={start_date}, end={end_date})")
    
    org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
    if current_user.role == "warrior":
        query = db.query(User).filter(User.id == current_user.id)
    elif current_user.role == "group_leader":
        from sqlalchemy import or_
        query = db.query(User).filter(
            org_filter,
            or_(
                (User.manager_id == current_user.id) & (User.role == "warrior"),
                User.id == current_user.id
            )
        )
    elif current_user.role == "super_admin" or current_user.role == "admin":
        query = db.query(User).filter(org_filter)
        if current_user.role == "admin":
            query = query.filter(User.role != "super_admin")
            
        if warrior_id and warrior_id != "all":
            query = query.filter(User.id == warrior_id)
        elif leader_id and leader_id != "all":
            descendant_ids = get_recursive_subordinate_ids(leader_id, db)
            query = query.filter(User.id.in_(descendant_ids))
        
    warriors = query.all()
    
    total_calls = 0
    total_seconds = 0
    incoming_count = 0
    outgoing_count = 0
    global_incoming_attended = 0
    global_incoming_missed = 0
    global_outgoing_connected = 0
    global_outgoing_dialed = 0
    
    warrior_rows = []
    detailed_logs = []
    
    for warrior in warriors:
        q = db.query(CallLog).filter(CallLog.user_id == warrior.id)
        if start_date:
            try:
                start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), datetime.min.time())
                q = q.filter(func.parse_my_timestamp(CallLog.timestamp) >= start_dt)
            except Exception:
                pass
        if end_date:
            try:
                end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), datetime.max.time())
                q = q.filter(func.parse_my_timestamp(CallLog.timestamp) <= end_dt)
            except Exception:
                pass
        logs = q.order_by(CallLog.timestamp.desc()).all()
        w_calls = len(logs)
        w_incoming = sum(1 for l in logs if (l.call_type or "").lower() in ["incoming", "missed", "rejected", "blocked"])
        w_incoming_attended = sum(1 for l in logs if (l.call_type or "").lower() == "incoming" and (l.call_status or "").lower() == "answered")
        w_incoming_missed = w_incoming - w_incoming_attended
        
        w_outgoing = sum(1 for l in logs if (l.call_type or "").lower() == "outgoing")
        w_outgoing_connected = sum(1 for l in logs if (l.call_type or "").lower() == "outgoing" and (l.call_status or "").lower() == "answered")
        w_outgoing_dialed = w_outgoing - w_outgoing_connected
        
        w_seconds = sum(l.duration_seconds for l in logs)
        w_hours = round(w_seconds / 3600.0, 2)
        w_avg = round(w_seconds / w_calls, 1) if w_calls > 0 else 0.0
        
        total_calls += w_calls
        total_seconds += w_seconds
        incoming_count += w_incoming
        outgoing_count += w_outgoing
        
        global_incoming_attended += w_incoming_attended
        global_incoming_missed += w_incoming_missed
        global_outgoing_connected += w_outgoing_connected
        global_outgoing_dialed += w_outgoing_dialed
        
        manager_name = warrior.manager.full_name if warrior.manager else "Unassigned"
        
        warrior_rows.append({
            "name": warrior.full_name,
            "email": warrior.email,
            "leader": manager_name,
            "calls": w_calls,
            "hours": w_hours,
            "incoming": f"{w_incoming} (Att: {w_incoming_attended}, Missed: {w_incoming_missed})",
            "outgoing": f"{w_outgoing} (Conn: {w_outgoing_connected}, Dialed: {w_outgoing_dialed})",
            "avg": w_avg
        })
        
        for l in logs:
            detailed_logs.append({
                "warrior": warrior.full_name,
                "leader": manager_name,
                "phone": l.phone_number,
                "type": l.call_type,
                "status": l.call_status,
                "duration": l.duration_seconds,
                "timestamp": l.timestamp
            })
            
    total_hours = round(total_seconds / 3600.0, 2)
    avg_duration = round(total_seconds / total_calls, 1) if total_calls > 0 else 0.0
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Shoption Call Analytics Report</title>
        <style>
            body {{
                font-family: system-ui, -apple-system, sans-serif;
                color: #111111;
                margin: 0;
                padding: 40px;
                background-color: #ffffff;
            }}
            .header {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #EEEEEE;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                color: #2F5C36;
            }}
            .header p {{
                margin: 5px 0 0 0;
                font-size: 12px;
                color: #666666;
            }}
            .kpi-row {{
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
            }}
            .kpi-card {{
                flex: 1;
                background-color: #F9F9F9;
                border: 1px solid #EEEEEE;
                border-radius: 12px;
                padding: 20px;
            }}
            .kpi-title {{
                font-size: 12px;
                color: #666666;
                font-weight: 600;
                margin-bottom: 8px;
            }}
            .kpi-value {{
                font-size: 28px;
                font-weight: 900;
                color: #111111;
            }}
            .kpi-subtitle {{
                font-size: 11px;
                color: #666666;
                margin-top: 4px;
                font-weight: 500;
            }}
            h2 {{
                font-size: 18px;
                font-weight: 700;
                color: #111111;
                margin-top: 40px;
                margin-bottom: 15px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }}
            th, td {{
                padding: 12px 15px;
                text-align: left;
                font-size: 13px;
                border-bottom: 1px solid #EEEEEE;
            }}
            th {{
                background-color: #F9F9F9;
                font-weight: 700;
                color: #2F5C36;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
            }}
            .badge-incoming {{
                background-color: #EBF2EC;
                color: #2F5C36;
            }}
            .badge-outgoing {{
                background-color: #E6F2FF;
                color: #0066CC;
            }}
            .btn-print {{
                background-color: #2F5C36;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }}
            @media print {{
                .no-print {{
                    display: none !important;
                }}
                body {{
                    padding: 0;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1>SHOPTION ANALYTICS REPORT</h1>
                <p>Generated on {datetime.now().strftime("%d-%b-%Y %H:%M")} • User: {current_user.full_name}</p>
            </div>
            <div class="no-print">
                <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
            </div>
        </div>

        <div class="kpi-row">
            <div class="kpi-card">
                <div class="kpi-title">TOTAL CALLS</div>
                <div class="kpi-value">{total_calls}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">TOTAL HOURS</div>
                <div class="kpi-value">{total_hours}h</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">INCOMING CALLS</div>
                <div class="kpi-value">{incoming_count}</div>
                <div class="kpi-subtitle">Attended: {global_incoming_attended} • Missed: {global_incoming_missed}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">OUTGOING CALLS</div>
                <div class="kpi-value">{outgoing_count}</div>
                <div class="kpi-subtitle">Connected: {global_outgoing_connected} • Dialed: {global_outgoing_dialed}</div>
            </div>
        </div>

        <h2>Warrior Summary</h2>
        <table>
            <thead>
                <tr>
                    <th>Warrior Name</th>
                    <th>Email</th>
                    <th>Group Leader</th>
                    <th>Calls</th>
                    <th>Hours</th>
                    <th>Incoming</th>
                    <th>Outgoing</th>
                    <th>Avg Duration</th>
                </tr>
            </thead>
            <tbody>
    """
    for r in warrior_rows:
        html_content += f"""
                <tr>
                    <td><b>{r['name']}</b></td>
                    <td>{r['email']}</td>
                    <td>{r['leader']}</td>
                    <td>{r['calls']}</td>
                    <td>{r['hours']}h</td>
                    <td>{r['incoming']}</td>
                    <td>{r['outgoing']}</td>
                    <td>{r['avg']}s</td>
                </tr>
        """
        
    html_content += """
            </tbody>
        </table>

        <h2>Detailed Call Log History</h2>
        <table>
            <thead>
                <tr>
                    <th>Warrior Name</th>
                    <th>Group Leader</th>
                    <th>Phone Number</th>
                    <th>Call Type</th>
                    <th>Sub-Category</th>
                    <th>Duration</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
    """
    
    for l in detailed_logs:
        badge_class = "badge-incoming" if l['type'].lower() in ["incoming", "missed", "rejected", "blocked"] else "badge-outgoing"
        raw_type = l['type'].lower()
        is_incoming = raw_type in ["incoming", "missed", "rejected", "blocked"]
        if is_incoming:
            sub_cat = "Attended" if (raw_type == "incoming" and l['duration'] > 0) else "Missed"
        else:
            sub_cat = "Connected" if (raw_type == "outgoing" and l['duration'] > 0) else "Dialed"
            
        html_content += f"""
                <tr>
                    <td>{l['warrior']}</td>
                    <td>{l['leader']}</td>
                    <td><b>{l['phone']}</b></td>
                    <td><span class="badge {badge_class}">{l['type']}</span></td>
                    <td>{sub_cat}</td>
                    <td>{l['duration']}s</td>
                    <td>{l['timestamp']}</td>
                </tr>
        """
        
    html_content += f"""
            </tbody>
        </table>
        
        <script>
            window.onload = function() {{
                setTimeout(function() {{
                    window.print();
                }}, 500);
            }}
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content, status_code=200)


from sqlalchemy import func

@router.get("/stats/me")
def get_my_call_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregate stats and historical chart data for the current user.
    """
    # 1. Fetch total counts grouped by call_type (optimized single query)
    type_counts = db.query(CallLog.call_type, func.count(CallLog.id)).filter(
        CallLog.user_id == current_user.id
    ).group_by(CallLog.call_type).all()
    
    incoming_count = 0
    outgoing_count = 0
    for c_type, count in type_counts:
        if c_type and c_type.lower() in ["incoming", "missed", "rejected", "blocked"]:
            incoming_count += count
        elif c_type and c_type.lower() == "outgoing":
            outgoing_count += count
            
    total_calls = incoming_count + outgoing_count
    
    total_duration = db.query(func.sum(CallLog.duration_seconds)).filter(
        CallLog.user_id == current_user.id
    ).scalar() or 0
    
    # 2. Fetch advanced statistics
    avg_dur = db.query(func.avg(CallLog.duration_seconds)).filter(
        CallLog.user_id == current_user.id,
        CallLog.duration_seconds > 0
    ).scalar() or 0
    
    answered_calls = db.query(CallLog).filter(
        CallLog.user_id == current_user.id,
        CallLog.duration_seconds > 0
    ).count()
    
    success_rate = (answered_calls / total_calls * 100) if total_calls > 0 else 0.0

    # 3. Peak Hour Query
    from sqlalchemy import text
    peak_hour_res = db.execute(text("""
        SELECT EXTRACT(HOUR FROM CAST(timestamp AS timestamp)) as hr, COUNT(*) as cnt 
        FROM call_logs 
        WHERE user_id = :uid 
        GROUP BY hr 
        ORDER BY cnt DESC 
        LIMIT 1;
    """), {"uid": current_user.id}).fetchone()
    
    peak_hour_str = "N/A"
    if peak_hour_res:
        hr = int(peak_hour_res[0])
        am_pm = "PM" if hr >= 12 else "AM"
        display_hr = hr % 12
        if display_hr == 0:
            display_hr = 12
        peak_hour_str = f"{display_hr}:00 {am_pm}"

    # 4. Fetch daily call duration (last 7 days)
    from datetime import timedelta, date
    daily_stats = []
    for i in range(6, -1, -1):
        target_date = date.today() - timedelta(days=i)
        # Get start and end of this date
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())
        day_duration = db.query(func.sum(CallLog.duration_seconds)).filter(
            CallLog.user_id == current_user.id,
            func.parse_my_timestamp(CallLog.timestamp) >= start_dt,
            func.parse_my_timestamp(CallLog.timestamp) <= end_dt
        ).scalar() or 0
        
        daily_stats.append({
            "day": target_date.strftime("%a"),
            "date": target_date.isoformat(),
            "duration_seconds": int(day_duration)
        })

    return {
        "incoming_count": incoming_count,
        "outgoing_count": outgoing_count,
        "total_calls": total_calls,
        "total_duration_seconds": int(total_duration),
        "avg_duration_seconds": round(float(avg_dur), 1),
        "success_rate": round(float(success_rate), 1),
        "peak_hour": peak_hour_str,
        "daily_trends": daily_stats
    }



@router.get("/reports/export/excel")
def export_reports_excel(
    request: Request,
    token: Optional[str] = None,
    leader_id: str = "all",
    warrior_id: str = "all",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    response = export_reports_csv(request, token, leader_id, warrior_id, start_date, end_date, db)
    response.headers["Content-Disposition"] = "attachment; filename=team_reports.csv"
    return response


@router.get("/team-logs")
def get_team_logs(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"INFO: GET /calls/team-logs requested by user {current_user.email} (Role: {current_user.role})")
    
    # 1. Access check: strictly restricted to super admins
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only super admins can access team logs"
        )

    # 2. Build the query joining User
    from app.models import CallLog, User
    from sqlalchemy import or_, func
    
    query = db.query(CallLog).join(User, CallLog.user_id == User.id)

    # 3. Filter by organisation to isolate tenants
    org_filter = User.organisation_id == current_user.organisation_id if current_user.organisation_id is not None else User.organisation_id.is_(None)
    query = query.filter(org_filter)

    # 4. Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                CallLog.phone_number.ilike(search_pattern),
                CallLog.call_status.ilike(search_pattern),
                CallLog.call_type.ilike(search_pattern)
            )
        )

    # 5. Apply start_date and end_date filters
    if start_date:
        try:
            start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), datetime.min.time())
            query = query.filter(func.parse_my_timestamp(CallLog.timestamp) >= start_dt)
        except Exception:
            pass
    if end_date:
        try:
            end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), datetime.max.time())
            query = query.filter(func.parse_my_timestamp(CallLog.timestamp) <= end_dt)
        except Exception:
            pass

    # 6. Get total count for pagination metadata
    total_count = query.count()

    # 7. Execute paginated query (ordered by latest call log first)
    offset = max(0, (page - 1) * limit)
    logs = query.order_by(func.parse_my_timestamp(CallLog.timestamp).desc(), CallLog.id.desc()).offset(offset).limit(limit).all()

    # Helper function to parse timestamp to datetime and calculate start/end time
    def get_start_end_time(timestamp_str: str, duration_sec: int):
        from datetime import datetime, timedelta
        try:
            parsed_dt = None
            if "-" in timestamp_str and not "T" in timestamp_str:
                parts = timestamp_str.strip().split()
                if len(parts) >= 2:
                    date_part, time_part = parts[0], parts[1]
                    date_parts = date_part.split("-")
                    time_parts = time_part.split(":")
                    if len(date_parts) == 3 and len(time_parts) >= 2:
                        day = int(date_parts[0])
                        month_str = date_parts[1].lower()
                        year = int(date_parts[2])
                        hour = int(time_parts[0])
                        minute = int(time_parts[1])
                        
                        months_map = {
                            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
                            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
                        }
                        month = months_map.get(month_str[:3])
                        if month:
                            parsed_dt = datetime(year, month, day, hour, minute)
            if not parsed_dt:
                clean_ts = timestamp_str.replace("Z", "").split(".")[0]
                if "T" in clean_ts:
                    parsed_dt = datetime.strptime(clean_ts, "%Y-%m-%dT%H:%M:%S")
                else:
                    parsed_dt = datetime.strptime(clean_ts, "%Y-%m-%d %H:%M:%S")
            
            start_time_str = parsed_dt.strftime("%d-%b-%Y %I:%M %p")
            end_dt = parsed_dt + timedelta(seconds=duration_sec)
            end_time_str = end_dt.strftime("%d-%b-%Y %I:%M %p")
            
            return start_time_str, end_time_str
        except Exception:
            return timestamp_str, timestamp_str

    result_data = []
    for l in logs:
        start_time, end_time = get_start_end_time(l.timestamp, l.duration_seconds)
        
        result_data.append({
            "id": l.id,
            "caller_name": l.user.full_name if l.user else "Unknown",
            "contact_number": l.phone_number,
            "direction": l.call_type,
            "status": l.call_status,
            "start_time": start_time,
            "end_time": end_time,
            "duration": l.duration_seconds
        })

    import math
    return {
        "data": result_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "totalPages": math.ceil(total_count / limit) if limit > 0 else 0
        }
    }
