"""
Pydantic schemas for Justification API requests and responses.
"""
from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, field_validator
import json

from app.models.justification import JustificationStatus


# ========== REQUEST SCHEMAS ==========

class JustificationCreate(BaseModel):
    """Schema for creating a new justification"""
    absence_reason: str
    absence_start_date: datetime
    absence_end_date: datetime
    affected_courses: str  # Comma-separated or JSON
    professor_ids: List[int]  # IDs of professors to notify


class JustificationReject(BaseModel):
    """Schema for rejecting a justification"""
    rejection_reason: str


# ========== RESPONSE SCHEMAS ==========

class StudentInfo(BaseModel):
    """Nested student info for coordinator view"""
    id: int
    name: str
    email: str
    paternal_surname: Optional[str] = None
    maternal_surname: Optional[str] = None
    rut: Optional[str] = None
    phone: Optional[str] = None
    admission_year: Optional[int] = None
    program: Optional[str] = None


class JustificationResponse(BaseModel):
    """Full justification response"""
    id: int
    student_id: int
    absence_reason: str
    absence_start_date: datetime
    absence_end_date: datetime
    affected_courses: str
    document_filename: Optional[List[str]] = []
    document_path: Optional[List[str]] = []
    status: JustificationStatus
    coordinator_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Populated by API
    student: Optional[StudentInfo] = None
    professor_ids: Optional[List[int]] = None

    @field_validator('document_filename', 'document_path', mode='before')
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v] if v else []
        return v or []

    class Config:
        from_attributes = True


class JustificationListResponse(BaseModel):
    """Paginated list of justifications"""
    items: List[JustificationResponse]
    total: int
