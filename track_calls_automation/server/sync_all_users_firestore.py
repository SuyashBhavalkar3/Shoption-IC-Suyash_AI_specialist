import os
import sys
from datetime import datetime

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, OrgEmployee
from app.firebase_service import update_tracking_status_in_firestore

def sync_all_users():
    db: Session = SessionLocal()
    try:
        print("Fetching all warriors from PostgreSQL database...")
        warriors = db.query(User).filter(User.role == "warrior").all()
        print(f"Found {len(warriors)} warriors to sync.")

        success_count = 0
        for warrior in warriors:
            # Try to find employee_id using system_id
            emp_id = None
            if warrior.system_id:
                emp_record = db.query(OrgEmployee).filter(OrgEmployee.system_id == warrior.system_id).first()
                if emp_record:
                    emp_id = emp_record.employee_id
            
            # Use last_activity_timestamp or default to current time
            last_activity = warrior.last_activity_timestamp or datetime.utcnow()
            org_id_str = str(warrior.organisation_id) if warrior.organisation_id else ""
            system_id_str = warrior.system_id or ""
            emp_id_str = emp_id or ""

            print(f"Syncing user: system_id='{system_id_str}', email='{warrior.email}', employee_id='{emp_id_str}'")
            
            success = update_tracking_status_in_firestore(
                emp_id=emp_id_str,
                organisation_id=org_id_str,
                system_id=system_id_str,
                is_tracking_enabled=warrior.is_tracking_enabled,
                last_activity_timestamp=last_activity
            )
            if success:
                success_count += 1

        print(f"Sync complete. Successfully synced {success_count} / {len(warriors)} users to Firestore.")
    except Exception as e:
        print(f"Error during synchronization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_all_users()
