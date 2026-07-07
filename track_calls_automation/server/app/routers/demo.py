from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DemoBooking
from app.schemas import DemoBookingCreate, DemoBookingOut
from app.email_service import send_demo_booking_admin_email, send_demo_booking_user_email

router = APIRouter(
    prefix="/demo",
    tags=["Demo Bookings"]
)

@router.post("/book", response_model=DemoBookingOut, status_code=status.HTTP_201_CREATED)
def book_demo(demo_in: DemoBookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Submits a demo request, stores the user details in the database,
    and sends background email notifications to both the admin and the customer.
    """
    try:
        db_demo = DemoBooking(
            full_name=demo_in.fullName.strip(),
            email=demo_in.email.strip().lower(),
            phone=demo_in.phone.strip(),
            org_name=demo_in.orgName.strip(),
            pain_plan=demo_in.painPlan.strip(),
            description=demo_in.description.strip()
        )
        db.add(db_demo)
        db.commit()
        db.refresh(db_demo)
        
        print(f"INFO: Successfully created DemoBooking for email '{db_demo.email}' under organization '{db_demo.org_name}'")
        
        # Dispatch background email notifications
        background_tasks.add_task(
            send_demo_booking_admin_email,
            full_name=db_demo.full_name,
            email=db_demo.email,
            phone=db_demo.phone,
            org_name=db_demo.org_name,
            pain_plan=db_demo.pain_plan,
            description=db_demo.description
        )
        background_tasks.add_task(
            send_demo_booking_user_email,
            to_email=db_demo.email,
            full_name=db_demo.full_name,
            org_name=db_demo.org_name,
            pain_plan=db_demo.pain_plan,
            description=db_demo.description
        )

        return db_demo
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to save DemoBooking or dispatch emails: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register demo booking request due to a database error."
        )

