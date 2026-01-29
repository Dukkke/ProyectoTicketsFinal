from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

# ========== TICKET ENUMS ==========

class TicketType(str, Enum):
    """Types of tickets/consultations"""
    ACADEMICA = "academica"
    VOCACIONAL = "vocacional"
    ADMINISTRATIVA = "administrativa"
    HORARIO = "horario"
    COORDINACION = "coordinacion"
    INSCRIPCION = "inscripcion"
    DIFICULTADES = "dificultades"
    OTRO = "otro"
    OTRA = "otra"

class TicketStatus(str, Enum):
    """Status of a ticket"""
    pendiente = "pendiente"
    respondido = "respondido"  # Coordinator responded
    solucionado = "solucionado"  # Student confirmed it helped
    derivado = "derivado"  # Escalated to professor
    aceptado = "aceptado"  # Legacy: kept for compatibility
    rechazado = "rechazado"
    completado = "completado"

class MessageSenderRole(str, Enum):
    """Who sent the message"""
    ESTUDIANTE = "estudiante"
    COORDINADOR = "coordinador"
    ACADEMICO = "academico"

# ========== TICKET MODEL ==========

class Ticket(SQLModel, table=True):
    """Ticket/Meeting request model"""
    __tablename__ = "tickets"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_code: str = Field(unique=True, index=True)  # TKT-2026-0001
    
    # Relations
    student_id: int = Field(foreign_key="users.id")
    academic_id: int = Field(foreign_key="users.id")
    
    # Ticket info
    ticket_type: str
    status: TicketStatus = Field(default=TicketStatus.pendiente)
    title: str
    description: str
    
    # Dates
    proposed_date: datetime
    confirmed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Coordinator response workflow
    coordinator_response: Optional[str] = None  # Response from coordinator
    coordinator_id: Optional[int] = Field(default=None, foreign_key="users.id") # Who responded
    responded_at: Optional[datetime] = None  # When coordinator responded
    
    # Student satisfaction
    satisfaction_rating: Optional[int] = None  # 1-5 stars
    satisfaction_comment: Optional[str] = None  # Student feedback comment
    resolved_at: Optional[datetime] = None  # When student marked as solved
    
    # Escalation to professor
    escalated_to_academic: bool = Field(default=False)
    escalation_note: Optional[str] = None  # Note for the professor
    
    # Reopen count limit
    reopen_count: int = Field(default=0)
    
    # Soft Delete (Archiving)
    is_archived: bool = Field(default=False)  # Hidden from student inbox (0-7 days)
    is_deleted: bool = Field(default=False)   # System soft delete (>7 days)
    deleted_at: Optional[datetime] = None
    
    # Optional rejection reason (legacy)
    rejection_reason: Optional[str] = None

# ========== MESSAGE MODEL ==========

class TicketMessage(SQLModel, table=True):
    """Message in a ticket conversation"""
    __tablename__ = "ticket_messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="tickets.id", index=True)
    sender_id: int = Field(foreign_key="users.id")
    sender_role: MessageSenderRole
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # For system messages (e.g., "Ticket derivado a profesor")
    is_system_message: bool = Field(default=False)
