
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/audit-logs", response_model=list[AuditLog])
def get_audit_logs(session: Session = Depends(get_session)):
    """Get all audit logs (Superadmin only)"""
    # In a real app we'd verify superadmin role here
    logs = session.exec(select(AuditLog).order_by(AuditLog.timestamp.desc())).all()
    return logs
