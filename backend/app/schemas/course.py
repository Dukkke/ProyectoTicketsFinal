from sqlmodel import SQLModel

class CourseCreate(SQLModel):
    """Schema for creating a course"""
    name: str
    code: str
    semester: str

class CourseResponse(SQLModel):
    """Schema for course response"""
    id: int
    name: str
    code: str
    academic_id: int
    semester: str
    student_count: int = 0

class AssignStudentRequest(SQLModel):
    """Schema for assigning a student to a course"""
    student_email: str
