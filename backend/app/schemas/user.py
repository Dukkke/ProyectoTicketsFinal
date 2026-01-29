from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel
from app.models.user import UserBase, UserRole

class UserCreate(SQLModel):
    """Schema for user registration"""
    email: str
    password: str
    name: str
    role: str  # Use str for compatibility
    year: Optional[str] = None  # For students: "1", "2", "3", "4"
    rut: Optional[str] = None  # Chilean RUT e.g., "12.345.678-9"
    # Optional initial data
    paternal_surname: Optional[str] = None
    maternal_surname: Optional[str] = None
    modality: Optional[str] = None

class UserLogin(SQLModel):
    """Schema for user login"""
    email: str
    password: str

class UserResponse(UserBase):
    """Schema for user response (no password)"""
    id: int
    created_at: datetime
    must_change_password: bool = False # Exposed to frontend
    year: Optional[str] = None
    rut: Optional[str] = None
    profile_photo: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    bio: Optional[str] = None
    # Extended fields
    paternal_surname: Optional[str] = None
    maternal_surname: Optional[str] = None
    personal_email: Optional[str] = None
    emergency_phone: Optional[str] = None
    admission_year: Optional[int] = None
    program: Optional[str] = None
    modality: Optional[str] = None

class UserUpdate(SQLModel):
    """Schema for updating user (all fields optional)"""
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None
    year: Optional[str] = None
    rut: Optional[str] = None
    profile_photo: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    bio: Optional[str] = None
    # Extended fields
    paternal_surname: Optional[str] = None
    maternal_surname: Optional[str] = None
    personal_email: Optional[str] = None
    emergency_phone: Optional[str] = None
    admission_year: Optional[int] = None
    program: Optional[str] = None
    modality: Optional[str] = None
