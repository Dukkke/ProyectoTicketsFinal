from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Course(SQLModel, table=True):
    """Course model for academics"""
    __tablename__ = "courses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str = Field(unique=True)
    academic_id: int = Field(foreign_key="users.id")
    semester: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentCourse(SQLModel, table=True):
    """Link table between Students and Courses"""
    __tablename__ = "student_courses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id")
    course_id: int = Field(foreign_key="courses.id")
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
