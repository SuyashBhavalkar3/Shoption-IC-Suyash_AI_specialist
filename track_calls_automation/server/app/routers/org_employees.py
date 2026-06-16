"""
Router: /org-employees

Handles employee ID mapping for organisations.
- system_id  : Auto-generated 6-digit unique code (our internal identifier, used in webhook payloads)
- employee_id : Provided by the client (any format — numeric / alpha / alphanumeric / special chars)
- org_id      : Taken automatically from the logged-in super_admin's JWT session (never from request body)

Upload access: super_admin only
List access  : super_admin, admin
"""

import csv
import io
import random
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import OrgEmployee
from app.schemas import (
    OrgEmployeeCreate,
    OrgEmployeeOut,
    OrgEmployeeBulkUploadResult,
    OrgEmployeeSkippedRow,
)
from app.security import get_current_user, RoleChecker
from app.models import User

router = APIRouter(
    prefix="/org-employees",
    tags=["Org Employees"],
)

# ── Role Guards ───────────────────────────────────────────────────────────────
require_super_admin = RoleChecker(["super_admin"])
require_admin_or_above = RoleChecker(["super_admin", "admin"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_unique_system_id(db: Session) -> str:
    """
    Generate a globally unique 6-digit numeric system_id (100000–999999).
    Retries until a non-colliding value is found.
    """
    for _ in range(20):  # max 20 attempts — practically never needed
        candidate = str(random.randint(100000, 999999))
        exists = db.query(OrgEmployee).filter(OrgEmployee.system_id == candidate).first()
        if not exists:
            return candidate
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to generate a unique system_id. Please try again.",
    )


def _detect_employee_id_column(headers: List[str]) -> str | None:
    """
    Detect the employee_id column from a CSV header row.
    Accepted variants (case-insensitive, ignoring hyphens/underscores/spaces):
        employee_id, employeeid, emp_id, empid, emp-id
    Returns the original header string if matched, else None.
    """
    accepted_normalised = {"employeeid", "empid"}
    for h in headers:
        normalised = h.strip().lower().replace("-", "").replace("_", "").replace(" ", "")
        if normalised in accepted_normalised:
            return h
    return None


def _detect_email_column(headers: List[str]) -> str | None:
    """
    Detect the email column from a CSV header row.
    Accepted variants (case-insensitive):
        email, mail, email_id, emailid, email-id
    Returns the original header string if matched, else None.
    """
    accepted_normalised = {"email", "mail", "emailid"}
    for h in headers:
        normalised = h.strip().lower().replace("-", "").replace("_", "").replace(" ", "")
        if normalised in accepted_normalised:
            return h
    return None


def _get_org_id(current_user: User):
    """Guard: ensure the current user has an organisation configured."""
    if current_user.organisation_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is not associated with an organisation. "
                   "Please contact your administrator.",
        )
    return current_user.organisation_id


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=OrgEmployeeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a single employee manually (super_admin only)",
)
def add_single_employee(
    payload: OrgEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Manually add one employee ID and optional email.
    - org_id is taken from the authenticated super_admin's session automatically.
    - system_id is auto-generated as a unique 6-digit number.
    """
    org_id = _get_org_id(current_user)
    clean_email = payload.email.strip().lower() if payload.email else None

    # Check for duplicate (org_id + employee_id)
    existing = db.query(OrgEmployee).filter(
        OrgEmployee.org_id == org_id,
        OrgEmployee.employee_id == payload.employee_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee ID '{payload.employee_id}' already exists in your organisation.",
        )

    # Check for duplicate email in organisation
    if clean_email:
        existing_email = db.query(OrgEmployee).filter(
            OrgEmployee.org_id == org_id,
            OrgEmployee.email == clean_email,
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{payload.email}' already exists in your organisation mapped to employee '{existing_email.employee_id}'.",
            )

    system_id = _generate_unique_system_id(db)
    record = OrgEmployee(
        system_id=system_id,
        employee_id=payload.employee_id,
        email=clean_email,
        org_id=org_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post(
    "/bulk-upload",
    response_model=OrgEmployeeBulkUploadResult,
    status_code=status.HTTP_200_OK,
    summary="Bulk upload employees from a CSV file (super_admin only)",
)
def bulk_upload_employees(
    file: UploadFile = File(..., description="CSV file with columns employee_id and email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Upload a CSV file containing employee IDs and optional emails.

    **CSV format rules:**
    - Must have a header row.
    - The employee ID column: `employee_id`, `emp_id`, `empId`, `emp-id` (case-insensitive).
    - The email column: `email`, `mail`, `email_id`, `emailid` (case-insensitive, optional).
    - Duplicate rows (same employee_id or email in the same org) are **skipped** — not treated as errors.
    """
    org_id = _get_org_id(current_user)

    # Validate file type
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported. Please upload a .csv file.",
        )

    content = file.file.read().decode("utf-8-sig")  # utf-8-sig strips BOM if present
    reader = csv.DictReader(io.StringIO(content))

    headers = reader.fieldnames or []
    emp_col = _detect_employee_id_column(list(headers))
    email_col = _detect_email_column(list(headers))

    if emp_col is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not find an employee ID column in the CSV. "
                "Expected one of: employee_id, emp_id, empId, emp-id (case-insensitive). "
                f"Found columns: {list(headers)}"
            ),
        )

    created = 0
    skipped_details: List[OrgEmployeeSkippedRow] = []

    for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is the header
        raw_value = row.get(emp_col, "")
        employee_id = raw_value.strip() if raw_value else ""
        raw_email = row.get(email_col, "") if email_col else ""
        email_val = raw_email.strip().lower() if raw_email else None

        # Skip blank rows
        if not employee_id:
            skipped_details.append(OrgEmployeeSkippedRow(
                employee_id=f"(row {row_num} — empty)",
                reason="Empty employee_id value, row skipped.",
            ))
            continue

        # Check for duplicate employee ID
        existing = db.query(OrgEmployee).filter(
            OrgEmployee.org_id == org_id,
            OrgEmployee.employee_id == employee_id,
        ).first()
        if existing:
            skipped_details.append(OrgEmployeeSkippedRow(
                employee_id=employee_id,
                reason=f"Employee ID already exists in your organisation with system_id '{existing.system_id}'.",
            ))
            continue

        # Check for duplicate email
        if email_val:
            existing_email = db.query(OrgEmployee).filter(
                OrgEmployee.org_id == org_id,
                OrgEmployee.email == email_val,
            ).first()
            if existing_email:
                skipped_details.append(OrgEmployeeSkippedRow(
                    employee_id=employee_id,
                    reason=f"Email '{email_val}' already exists in your organisation mapped to employee '{existing_email.employee_id}'.",
                ))
                continue

        # Create the record
        system_id = _generate_unique_system_id(db)
        record = OrgEmployee(
            system_id=system_id,
            employee_id=employee_id,
            email=email_val,
            org_id=org_id,
        )
        db.add(record)
        try:
            db.flush()  # flush within loop to catch constraint errors early
            created += 1
        except IntegrityError:
            db.rollback()
            skipped_details.append(OrgEmployeeSkippedRow(
                employee_id=employee_id,
                reason="Duplicate detected during insert (concurrent upload), row skipped.",
            ))
            continue

    db.commit()

    return OrgEmployeeBulkUploadResult(
        total_rows=created + len(skipped_details),
        created=created,
        skipped=len(skipped_details),
        skipped_details=skipped_details,
    )



@router.get(
    "/",
    response_model=List[OrgEmployeeOut],
    summary="List all employees in your organisation (super_admin / admin)",
)
def list_org_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above),
):
    """
    Returns all employee mappings for the logged-in user's organisation.
    Accessible by super_admin and admin.
    """
    org_id = _get_org_id(current_user)
    return db.query(OrgEmployee).filter(OrgEmployee.org_id == org_id).all()
