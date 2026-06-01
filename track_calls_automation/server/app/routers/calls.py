from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from datetime import datetime
from jose import jwt, JWTError
from app.config import settings
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
        elif exists.user_id is None:
            # If log exists but user_id is None, link it to the syncing user
            exists.user_id = current_user.id
            db.add(exists)
            created_logs.append(exists)
            
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
        warriors=warrior_reports
    )

def get_user_from_query_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = db.query(User).filter(User.id == user_id).first()
        if user is None or user.role == "warrior":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.get("/reports/export/csv")
def export_reports_csv(
    token: str,
    leader_id: str = "all",
    warrior_id: str = "all",
    db: Session = Depends(get_db)
):
    current_user = get_user_from_query_token(token, db)
    
    query = db.query(User).filter(User.role == "warrior")
    if current_user.role == "group_leader":
        query = query.filter(User.manager_id == current_user.id)
    elif current_user.role in ["admin", "super_admin"]:
        if leader_id and leader_id != "all":
            query = query.filter(User.manager_id == leader_id)
            
    if warrior_id and warrior_id != "all":
        query = query.filter(User.id == warrior_id)
        
    warriors = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Warrior Name", "Warrior Email", "Group Leader Name",
        "Phone Number", "Call Type", "Duration (seconds)", "Timestamp"
    ])
    
    for warrior in warriors:
        manager_name = warrior.manager.full_name if warrior.manager else "Unassigned"
        logs = db.query(CallLog).filter(CallLog.user_id == warrior.id).order_by(CallLog.timestamp.desc()).all()
        
        if not logs:
            writer.writerow([
                warrior.full_name, warrior.email, manager_name,
                "", "", "", ""
            ])
        else:
            for log in logs:
                writer.writerow([
                    warrior.full_name, warrior.email, manager_name,
                    log.phone_number, log.call_type, log.duration_seconds, log.timestamp
                ])
                
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=team_reports.csv"}
    )

@router.get("/reports/export/pdf", response_class=HTMLResponse)
def export_reports_pdf(
    token: str,
    leader_id: str = "all",
    warrior_id: str = "all",
    db: Session = Depends(get_db)
):
    current_user = get_user_from_query_token(token, db)
    
    query = db.query(User).filter(User.role == "warrior")
    if current_user.role == "group_leader":
        query = query.filter(User.manager_id == current_user.id)
    elif current_user.role in ["admin", "super_admin"]:
        if leader_id and leader_id != "all":
            query = query.filter(User.manager_id == leader_id)
            
    if warrior_id and warrior_id != "all":
        query = query.filter(User.id == warrior_id)
        
    warriors = query.all()
    
    total_calls = 0
    total_seconds = 0
    incoming_count = 0
    outgoing_count = 0
    
    warrior_rows = []
    detailed_logs = []
    
    for warrior in warriors:
        logs = db.query(CallLog).filter(CallLog.user_id == warrior.id).order_by(CallLog.timestamp.desc()).all()
        w_calls = len(logs)
        w_incoming = sum(1 for l in logs if l.call_type.lower() == "incoming")
        w_outgoing = sum(1 for l in logs if l.call_type.lower() == "outgoing")
        w_seconds = sum(l.duration_seconds for l in logs)
        w_hours = round(w_seconds / 3600.0, 2)
        w_avg = round(w_seconds / w_calls, 1) if w_calls > 0 else 0.0
        
        total_calls += w_calls
        total_seconds += w_seconds
        incoming_count += w_incoming
        outgoing_count += w_outgoing
        
        manager_name = warrior.manager.full_name if warrior.manager else "Unassigned"
        
        warrior_rows.append({
            "name": warrior.full_name,
            "email": warrior.email,
            "leader": manager_name,
            "calls": w_calls,
            "hours": w_hours,
            "incoming": w_incoming,
            "outgoing": w_outgoing,
            "avg": w_avg
        })
        
        for l in logs:
            detailed_logs.append({
                "warrior": warrior.full_name,
                "leader": manager_name,
                "phone": l.phone_number,
                "type": l.call_type,
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
            </div>
            <div class="kpi-card">
                <div class="kpi-title">OUTGOING CALLS</div>
                <div class="kpi-value">{outgoing_count}</div>
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
                    <th>Duration</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
    """
    
    for l in detailed_logs:
        badge_class = "badge-incoming" if l['type'].lower() == "incoming" else "badge-outgoing"
        html_content += f"""
                <tr>
                    <td>{l['warrior']}</td>
                    <td>{l['leader']}</td>
                    <td><b>{l['phone']}</b></td>
                    <td><span class="badge {badge_class}">{l['type']}</span></td>
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
