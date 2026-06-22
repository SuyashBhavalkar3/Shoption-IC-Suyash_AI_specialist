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
    Detect the employee_id column strictly matching 'emp_id' case-sensitively.
    """
    if "emp_id" in headers:
        return "emp_id"
    return None


def _detect_email_column(headers: List[str]) -> str | None:
    """
    Detect the email column strictly matching 'email_id' case-sensitively.
    """
    if "email_id" in headers:
        return "email_id"
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

    # Sync to Firestore
    from app.firebase_service import update_tracking_status_in_firestore
    from datetime import datetime
    update_tracking_status_in_firestore(
        emp_id=record.employee_id,
        organisation_id=str(record.org_id),
        system_id=record.system_id,
        is_tracking_enabled=False,
        last_activity_timestamp=datetime.utcnow(),
        is_tracking_needed=True
    )

    return record

def _parse_uploaded_file(file: UploadFile) -> tuple[List[str], List[dict]]:
    filename = (file.filename or "").lower()
    
    def _format_cell(val) -> str:
        if isinstance(val, float) and val.is_integer():
            return str(int(val))
        return str(val).strip() if val is not None else ""

    if filename.endswith(".csv"):
        content = file.file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(content))
        headers = reader.fieldnames or []
        rows = []
        for r in reader:
            rows.append({k: (v.strip() if v else "") for k, v in r.items()})
        return list(headers), rows
    elif filename.endswith(".tsv") or filename.endswith(".txt"):
        content = file.file.read().decode("utf-8-sig")
        delimiter = "\t" if filename.endswith(".tsv") else None
        if not delimiter:
            first_line = content.splitlines()[0] if content.splitlines() else ""
            if first_line.count("\t") > first_line.count(","):
                delimiter = "\t"
            else:
                delimiter = ","
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        headers = reader.fieldnames or []
        rows = []
        for r in reader:
            rows.append({k: (v.strip() if v else "") for k, v in r.items()})
        return list(headers), rows
    elif filename.endswith(".json"):
        import json
        content = file.file.read().decode("utf-8")
        try:
            data = json.loads(content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON file format: {str(e)}"
            )
        if isinstance(data, dict):
            data = [data]
        elif not isinstance(data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON file must contain an object or a list of objects."
            )
        headers_set = set()
        for item in data:
            if isinstance(item, dict):
                headers_set.update(item.keys())
        headers = list(headers_set)
        rows = []
        for item in data:
            if isinstance(item, dict):
                row_dict = {}
                for h in headers:
                    val = item.get(h, "")
                    row_dict[h] = _format_cell(val)
                rows.append(row_dict)
        return headers, rows
    elif filename.endswith(".xlsx"):
        import openpyxl
        wb = openpyxl.load_workbook(file.file, read_only=True, data_only=True)
        sheet = wb.active
        rows_gen = sheet.iter_rows(values_only=True)
        try:
            headers_row = next(rows_gen)
        except StopIteration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file is empty."
            )
        if not headers_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file is empty."
            )
        headers = [str(h).strip() for h in headers_row if h is not None]
        rows = []
        for r in rows_gen:
            if not any(cell is not None for cell in r):
                continue
            row_dict = {}
            for idx, h in enumerate(headers):
                if idx < len(r):
                    val = r[idx]
                    row_dict[h] = _format_cell(val)
                else:
                    row_dict[h] = ""
            rows.append(row_dict)
        return headers, rows
    elif filename.endswith(".xls"):
        import xlrd
        try:
            book = xlrd.open_workbook(file_contents=file.file.read())
            sheet = book.sheet_by_index(0)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not read XLS file: {str(e)}"
            )
        if sheet.nrows == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file is empty."
            )
        headers_row = sheet.row_values(0)
        headers = [str(h).strip() for h in headers_row if h != ""]
        rows = []
        for row_idx in range(1, sheet.nrows):
            r = sheet.row_values(row_idx)
            if not any(cell not in (None, "") for cell in r):
                continue
            row_dict = {}
            for idx, h in enumerate(headers):
                if idx < len(r):
                    val = r[idx]
                    row_dict[h] = _format_cell(val)
                else:
                    row_dict[h] = ""
            rows.append(row_dict)
        return headers, rows
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Supported formats: .csv, .tsv, .txt, .json, .xlsx, .xls"
        )


@router.post(
    "/bulk-upload",
    response_model=OrgEmployeeBulkUploadResult,
    status_code=status.HTTP_200_OK,
    summary="Bulk upload employees from a CSV or Excel file (super_admin only)",
)
def bulk_upload_employees(
    file: UploadFile = File(..., description="CSV or Excel (.xlsx) file with columns employee_id and email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Upload a CSV or Excel (.xlsx) file containing employee IDs and emails.

    **File format rules:**
    - Must have a header row.
    - Must strictly contain case-sensitive columns: `emp_id` and `email_id`.
    - Duplicate rows (same employee_id or email in the same org) are **skipped** — not treated as errors.
    """
    org_id = _get_org_id(current_user)

    headers, data_rows = _parse_uploaded_file(file)
    emp_col = _detect_employee_id_column(headers)
    email_col = _detect_email_column(headers)

    if emp_col is None or email_col is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Uploaded file must strictly contain 'emp_id' and 'email_id' columns (case-sensitive). "
                f"Found columns: {headers}"
            ),
        )

    created = 0
    skipped_details: List[OrgEmployeeSkippedRow] = []
    records_to_sync = []

    for row_num, row in enumerate(data_rows, start=2):  # start=2 because row 1 is the header
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
            records_to_sync.append(record)
        except IntegrityError:
            db.rollback()
            skipped_details.append(OrgEmployeeSkippedRow(
                employee_id=employee_id,
                reason="Duplicate detected during insert (concurrent upload), row skipped.",
            ))
            continue

    db.commit()

    # Sync successfully committed employees to Firestore
    from app.firebase_service import update_tracking_status_in_firestore
    from datetime import datetime
    for record in records_to_sync:
        update_tracking_status_in_firestore(
            emp_id=record.employee_id,
            organisation_id=str(record.org_id),
            system_id=record.system_id,
            is_tracking_enabled=False,
            last_activity_timestamp=datetime.utcnow(),
            is_tracking_needed=True
        )

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


@router.put(
    "/{employee_id}/tracking-needed",
    response_model=OrgEmployeeOut,
    summary="Update the is_tracking_needed status of an employee (super_admin / admin only)",
)
def update_employee_tracking_needed(
    employee_id: str,
    needed: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above),
):
    org_id = _get_org_id(current_user)
    
    # Find employee
    record = db.query(OrgEmployee).filter(
        OrgEmployee.org_id == org_id,
        OrgEmployee.employee_id == employee_id,
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee '{employee_id}' not found in your organisation.",
        )
        
    record.is_tracking_needed = needed
    db.commit()
    db.refresh(record)
    
    # Sync update to Firestore
    from app.firebase_service import update_tracking_status_in_firestore
    from datetime import datetime
    update_tracking_status_in_firestore(
        emp_id=record.employee_id,
        organisation_id=str(record.org_id),
        system_id=record.system_id,
        is_tracking_enabled=False,
        last_activity_timestamp=datetime.utcnow(),
        is_tracking_needed=needed
    )
    
    return record
