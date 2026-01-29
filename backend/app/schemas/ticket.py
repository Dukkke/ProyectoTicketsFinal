from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel
from app.models.ticket import TicketType, TicketStatus, MessageSenderRole

# ========== TICKET SCHEMAS ==========

class TicketCreate(SQLModel):
    """Schema for creating a ticket"""
    academic_id: Optional[int] = None
    ticket_type: str
    title: str
    description: str
    proposed_date: Optional[datetime] = None

class TicketUpdate(SQLModel):
    """Schema for updating a ticket"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    academic_id: Optional[int] = None
    ticket_type: Optional[str] = None
    proposed_date: Optional[datetime] = None


class TicketResponse(SQLModel):
    """Schema for ticket response"""
    id: int
    ticket_code: str
    student_id: int
    academic_id: int
    ticket_type: str
    status: TicketStatus
    title: str
    description: str
    proposed_date: datetime
    confirmed_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    rejection_reason: Optional[str]
    # Coordinator workflow
    coordinator_response: Optional[str] = None
    coordinator_id: Optional[int] = None
    responded_at: Optional[datetime] = None
    satisfaction_rating: Optional[int] = None
    satisfaction_comment: Optional[str] = None
    resolved_at: Optional[datetime] = None
    escalated_to_academic: bool = False
    escalation_note: Optional[str] = None
    # Include user names for display
    student_name: Optional[str] = None
    academic_name: Optional[str] = None
    coordinator_name: Optional[str] = None # Added field
    student_year: Optional[str] = None
    student_rut: Optional[str] = None
    student_profile_photo: Optional[str] = None
    student_email: Optional[str] = None
    student_modality: Optional[str] = None
    student_modality: Optional[str] = None
    student_admission_year: Optional[int] = None
    reopen_count: int = 0

class TicketAccept(SQLModel):
    """Schema for accepting a ticket"""
    confirmed_date: datetime

class TicketReject(SQLModel):
    """Schema for rejecting a ticket"""
    rejection_reason: str

class RespondRequest(SQLModel):
    """Request body for responding to a ticket"""
    response: str
    coordinator_id: int

class EscalateRequest(SQLModel):
    """Request body for escalating a ticket"""
    academic_id: int
    note: str
    coordinator_id: int

class ReopenRequest(SQLModel):
    """Request body for reopening a ticket"""
    reason: str

# ========== MESSAGE SCHEMAS ==========

class TicketMessageCreate(SQLModel):
    """Schema for creating a message"""
    content: str

class TicketMessageResponse(SQLModel):
    """Schema for message response"""
    id: int
    ticket_id: int
    sender_id: int
    sender_role: MessageSenderRole
    sender_name: Optional[str] = None
    sender_photo: Optional[str] = None
    content: str
    created_at: datetime
    is_system_message: bool = False
