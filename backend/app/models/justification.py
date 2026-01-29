"""
Justification models for Absence/Medical Justification system.
Beta feature for presencial students only.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class JustificationStatus(str, Enum):
    """Status of a justification request"""
    PENDIENTE = "pendiente"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"


class Justification(SQLModel, table=True):
    """Absence Justification request from a student"""
    __tablename__ = "justifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Student info (foreign key to users)
    student_id: int = Field(foreign_key="users.id", index=True)
    
    # Justification details
    absence_reason: str  # Motivo de inasistencia
    absence_start_date: datetime  # Fecha inicio
    absence_end_date: datetime  # Fecha fin
    affected_courses: str  # JSON string of course names/IDs
    
    # Document upload
    document_filename: Optional[str] = None  # Original filename
    document_path: Optional[str] = None  # Server path to uploaded file
    
    # Status workflow
    status: JustificationStatus = Field(default=JustificationStatus.PENDIENTE)
    
    # Coordinator review
    coordinator_id: Optional[int] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class JustificationProfessor(SQLModel, table=True):
    """Many-to-many relationship between Justification and Professors"""
    __tablename__ = "justification_professors"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    justification_id: int = Field(foreign_key="justifications.id", index=True)
    professor_id: int = Field(foreign_key="users.id", index=True)
    
    # Notification tracking
    notified_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
