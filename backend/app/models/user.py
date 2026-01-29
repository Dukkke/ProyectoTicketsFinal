from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class UserRole(str, Enum):
    """User role types - MUST match PostgreSQL enum values exactly"""
    ESTUDIANTE = "ESTUDIANTE"
    ACADEMICO = "ACADEMICO"
    COORDINADOR = "coordinador"  # lowercase in DB
    ADMIN = "ADMIN"

# Coordinator email for remota modality (exclusive access)
REMOTA_COORDINATOR_EMAIL = "rradziev@uahurtado.cl"

class UserBase(SQLModel):
    """Base user fields"""
    email: str = Field(unique=True, index=True)
    name: str
    role: str  # Use str instead of enum for compatibility with mixed-case DB values

class User(UserBase, table=True):
    """User database model"""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Student specific fields
    year: Optional[str] = None  # "1", "2", "3", "4" for students
    rut: Optional[str] = None  # Chilean RUT, e.g., "12.345.678-9"
    
    # Coordinator profile fields
    profile_photo: Optional[str] = None  # URL to photo
    phone: Optional[str] = None
    office: Optional[str] = None
    bio: Optional[str] = None
    must_change_password: bool = Field(default=False)
    
    # Extended Profile Fields (Student/Academic)
    paternal_surname: Optional[str] = None
    maternal_surname: Optional[str] = None
    personal_email: Optional[str] = None
    emergency_phone: Optional[str] = None
    admission_year: Optional[int] = None
    program: Optional[str] = None # e.g. 'Plan Común', 'Industrial'
    modality: Optional[str] = None # 'Diurna', 'Vespertina'
