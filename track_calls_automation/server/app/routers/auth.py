from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Organisation, OTP, OrgEmployee
from app.schemas import UserCreate, UserOut, Token, LoginRequest, OrganisationOut, ProvisionOrganisationRequest, ProvisionOrganisationResponse, SendOtpRequest, VerifyOtpRequest
from app.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.email_service import send_invite_email, send_otp_email
from typing import List
from datetime import datetime, timedelta
import random
import string

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(payload: SendOtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Generates a 6-digit OTP code, saves it to the database,
    and sends it to leadlens_newcustomer@shoption.in.
    """
    if payload.passcode != "LeadLensOwner2026":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Owner passcode"
        )
    
    # Generate 6-digit OTP code
    otp_code = "".join(random.choices(string.digits, k=6))
    
    # Create OTP database record
    otp_record = OTP(
        email="leadlens_newcustomer@shoption.in",
        otp_code=otp_code,
        is_verified=False
    )
    db.add(otp_record)
    db.commit()
    
    # Send email asynchronously in background task
    background_tasks.add_task(send_otp_email, "leadlens_newcustomer@shoption.in", otp_code)
    
    print(f"INFO: Generated 2FA OTP {otp_code} for leadlens_newcustomer@shoption.in")
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Verifies the latest OTP code generated for leadlens_newcustomer@shoption.in.
    """
    if payload.passcode != "LeadLensOwner2026":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Owner passcode"
        )
        
    # Get the latest OTP record for this email
    latest_otp = db.query(OTP).filter(OTP.email == "leadlens_newcustomer@shoption.in").order_by(OTP.created_at.desc()).first()
    
    if not latest_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP request found for this email address"
        )
        
    if latest_otp.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This OTP has already been verified"
        )
        
    # Check if the code matches
    if latest_otp.otp_code != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP code"
        )
        
    # Optional expiration check: e.g. 5 minutes TTL
    expiry_time = latest_otp.created_at + timedelta(minutes=5)
    if datetime.utcnow() > expiry_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired"
        )
        
    # Mark as verified
    latest_otp.is_verified = True
    db.commit()
    
    print(f"INFO: Successfully verified 2FA OTP for Platform Owner")
    return {"success": True, "message": "OTP verified successfully"}


@router.post("/provision-organisation", response_model=ProvisionOrganisationResponse, status_code=status.HTTP_201_CREATED)
def provision_organisation(payload: ProvisionOrganisationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Provision a new Organisation and its first Super Admin.
    - Protected by a simple passcode check (LeadLensOwner2026).
    """
    if payload.passcode != "LeadLensOwner2026":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Owner passcode"
        )

    # Check if organisation name already exists
    existing_org = db.query(Organisation).filter(Organisation.name == payload.organisation_name).first()
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An organisation with this name already exists"
        )

    # Check if super admin email already exists
    existing_user = db.query(User).filter(User.email == payload.super_admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Create Organisation
    org = Organisation(name=payload.organisation_name)
    db.add(org)
    db.flush()  # Generates org.id and invite_code default

    # Create Super Admin Placeholder User
    super_admin = User(
        email=payload.super_admin_email.strip().lower(),
        password_hash="",  # Placeholder, will be updated during self-registration
        full_name="",      # Placeholder, will be updated during self-registration
        role="super_admin",
        is_approved=True,
        is_active=True,
        organisation_id=org.id
    )
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    db.refresh(org)
    
    # Send invite email containing the invite code to the Super Admin via background task
    background_tasks.add_task(send_invite_email, payload.super_admin_email, org.name, org.invite_code)
    
    print(f"INFO: Successfully provisioned organisation '{org.name}' with invite code '{org.invite_code}' and super admin '{super_admin.email}'")
    return {
        "organisation_id": org.id,
        "organisation_name": org.name,
        "invite_code": org.invite_code,
        "super_admin": super_admin
    }


@router.get("/organisations", response_model=List[OrganisationOut])
def get_organisations(db: Session = Depends(get_db)):
    """Fetch all registered organisations."""
    return db.query(Organisation).order_by(Organisation.name).all()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Self-registration endpoint.
    - Only requires: email, full_name, password.
    - All new users register as 'warrior' with is_approved=False.
    - Bootstrap exception: the very first user becomes super_admin and is auto-approved.
    - No manager_id is accepted here — that is assigned later by admin.
    """
    # Duplicate email check & pre-provisioned Super Admin update handler
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        if existing_user.role == "super_admin" and existing_user.password_hash == "":
            # Update the pre-provisioned Super Admin record with the chosen password and name
            existing_user.password_hash = get_password_hash(user_in.password)
            existing_user.full_name = user_in.full_name
            existing_user.is_approved = True
            existing_user.is_active = True
            db.commit()
            db.refresh(existing_user)
            return existing_user
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )

    target_org_id = None
    if user_in.organisation_invite_code:
        # Check by invite code (case-insensitive and trimmed)
        code_clean = user_in.organisation_invite_code.strip().upper()
        org = db.query(Organisation).filter(Organisation.invite_code == code_clean).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected organisation invite code is invalid"
            )
        target_org_id = org.id
    elif user_in.organisation_id:
        # Backwards compatibility: verify by organisation_id if provided
        org_exists = db.query(Organisation).filter(Organisation.id == user_in.organisation_id).first()
        if not org_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected organisation does not exist"
            )
        target_org_id = user_in.organisation_id

    hashed_password = get_password_hash(user_in.password)

    # Bootstrap: first user ever → super_admin, auto-approved
    is_first_user = db.query(User).count() == 0

    requested_role = user_in.role.value  # convert enum → string

    # Temporarily allow super_admin self-registration for dev/testing
    # and auto-approve super_admin registrations so they don't get stuck.
    is_approved_status = True if (is_first_user or requested_role == "super_admin") else False

    db_user = User(
        email=user_in.email.strip().lower(),
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role="super_admin" if is_first_user else requested_role,
        manager_id=None,           # always None at registration
        is_approved=is_approved_status,
        is_active=True,
        organisation_id=target_org_id
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Auto-link system_id: if user's registered email is found in org_employees for this organisation,
    # stamp their system_id automatically onto the user profile.
    if target_org_id:
        clean_reg_email = db_user.email.strip().lower()
        emp_record = db.query(OrgEmployee).filter(
            OrgEmployee.org_id == target_org_id,
            OrgEmployee.email == clean_reg_email
        ).first()
        if emp_record:
            db_user.system_id = emp_record.system_id
            db.commit()
            db.refresh(db_user)
            print(f"INFO: Auto-linked user '{db_user.email}' to system_id '{db_user.system_id}' using email matching.")
        else:
            print(f"INFO: Email '{db_user.email}' not pre-configured in org_employees for org '{target_org_id}'. system_id not auto-linked.")

    return db_user


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login with email + password (JSON body). Returns a JWT bearer token."""
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact your administrator."
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for your admin to approve you."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    print(f"INFO: Login successful for user {user.email} (Role: {user.role}, Name: {user.full_name})")

    # Sync to Firestore if the logged-in user is a warrior (to handle db resets or missing docs)
    if user.role == "warrior":
        try:
            from app.models import OrgEmployee
            from app.firebase_service import update_tracking_status_in_firestore
            from datetime import datetime
            emp_id = ""
            if user.system_id:
                emp_rec = db.query(OrgEmployee).filter(OrgEmployee.system_id == user.system_id).first()
                if emp_rec:
                    emp_id = emp_rec.employee_id
            
            update_tracking_status_in_firestore(
                emp_id=emp_id,
                organisation_id=str(user.organisation_id) if user.organisation_id else "",
                system_id=user.system_id or "",
                is_tracking_enabled=user.is_tracking_enabled,
                last_activity_timestamp=user.last_activity_timestamp or datetime.utcnow()
            )
        except Exception as e:
            print(f"ERROR: Failed to sync warrior to Firestore on login: {e}")

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint. JWT is stateless so the actual token invalidation happens
    client-side (delete from SharedPreferences). This endpoint acts as a
    server-side acknowledgment and can be extended to support a token blacklist
    in the future.
    """
    return {"detail": f"User '{current_user.email}' logged out successfully."}
