from sqlmodel import Session, create_engine, select
from app.models.justification import Justification, JustificationProfessor
from app.models.user import User
import os

DATABASE_URL = "sqlite:///./tickets.db" # Default for local dev usually
engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    print("--- Users ---")
    users = session.exec(select(User)).all()
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Name: {u.name}, Modality: {u.modality}, Role: {u.role}")
        
    print("\n--- Justifications ---")
    justs = session.exec(select(Justification)).all()
    print(f"Total justifications: {len(justs)}")
    for j in justs:
        student = session.get(User, j.student_id)
        print(f"ID: {j.id}, Student: {student.name if student else 'Unknown'}, Status: {j.status}, Courses: {j.affected_courses}")
        
    print("\n--- Justification-Professor Links ---")
    links = session.exec(select(JustificationProfessor)).all()
    for l in links:
        print(f"JustID: {l.justification_id}, ProfID: {l.professor_id}")
