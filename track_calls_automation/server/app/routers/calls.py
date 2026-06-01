from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, CallLog
from app.schemas import CallLogCreate, CallLogOut, LeaderReportResponse, WarriorReport, CallDetail
from app.auth import get_current_user

router = APIRouter(
    prefix="/calls",
    tags=["Call Logs"]
)

@router.post("/", response_model=List[CallLogOut], status_code=status.HTTP_201_CREATED)
def sync_call_logs(logs_in: List[CallLogCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only Warriors (or anyone with a valid login) can upload logs
    # We match it to the current logged in user (current_user.id)
    created_logs = []
    for log_data in logs_in:
        # Check if user + system_call_id combination already exists to prevent duplicate syncs
        exists = db.query(CallLog).filter(
            CallLog.user_id == current_user.id,
            CallLog.system_call_id == log_data.system_call_id
        ).first()
        
        if not exists:
            db_log = CallLog(
                user_id=current_user.id,
                phone_number=log_data.phone_number,
                call_type=log_data.call_type,
                duration_seconds=log_data.duration_seconds,
                timestamp=log_data.timestamp,
                system_call_id=log_data.system_call_id
            )
            db.add(db_log)
            created_logs.append(db_log)
            
    if created_logs:
        db.commit()
        for log in created_logs:
            db.refresh(log)
            
    return created_logs

@router.get("/reports", response_model=LeaderReportResponse)
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Determine which warriors to include based on user role
    if current_user.role == "warrior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Warriors do not have access to overview reports"
        )
        
    elif current_user.role == "group_leader":
        # Get all warriors reporting to this leader
        warriors = db.query(User).filter(User.manager_id == current_user.id, User.role == "warrior").all()
        
    elif current_user.role in ["admin", "super_admin"]:
        # Admins and Super Admins get all warriors in the database
        warriors = db.query(User).filter(User.role == "warrior").all()
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown user role"
        )

    warrior_reports = []
    overall_total_calls = 0
    overall_incoming_count = 0
    overall_outgoing_count = 0
    overall_total_seconds = 0

    for warrior in warriors:
        logs = db.query(CallLog).filter(CallLog.user_id == warrior.id).all()
        
        total_calls = len(logs)
        incoming_count = sum(1 for l in logs if l.call_type.lower() == "incoming")
        outgoing_count = sum(1 for l in logs if l.call_type.lower() == "outgoing")
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
                duration_seconds=l.duration_seconds,
                timestamp=l.timestamp
            ) for l in logs
        ]

        warrior_reports.append(
            WarriorReport(
                warrior_id=warrior.id,
                full_name=warrior.full_name,
                total_calls=total_calls,
                incoming_calls_count=incoming_count,
                outgoing_calls_count=outgoing_count,
                total_calling_seconds=total_seconds,
                total_calling_hours=round(total_hours, 2),
                average_call_seconds=round(avg_seconds, 2),
                calls=calls_details
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
        warriors=warrior_reports
    )
