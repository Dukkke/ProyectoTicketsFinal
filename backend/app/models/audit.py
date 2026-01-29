from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class AuditLog(SQLModel, table=True):
    """Audit log for sensitive actions like deletion"""
    __tablename__ = "audit_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True) # Who performed the action
    action: str = Field(index=True) # e.g. "DELETE_TICKET"
    target_id: int = Field(index=True) # ID of the object affected
    target_type: str = Field(default="ticket") # e.g. "ticket"
    details: Optional[str] = None # JSON dump or text summary of deleted data
    timestamp: datetime = Field(default_factory=datetime.utcnow)
