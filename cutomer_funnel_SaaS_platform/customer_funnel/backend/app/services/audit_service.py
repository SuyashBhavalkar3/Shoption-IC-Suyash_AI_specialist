from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    user_id: str,
    action: str,
    endpoint: str,
    ip_address: str | None = None,
):
    log = AuditLog(
        user_id=user_id,
        action=action,
        endpoint=endpoint,
        ip_address=ip_address,
        created_at=datetime.now(UTC),
    )

    db.add(log)
    db.commit()