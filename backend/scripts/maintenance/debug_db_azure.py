import os
from dotenv import load_dotenv
from sqlmodel import Session, create_engine, select
from app.models.justification import Justification, JustificationStatus
from app.models.user import User

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
USE_AZURE = os.getenv("USE_AZURE", "false").lower() == "true"

connect_args = {}
if USE_AZURE:
    connect_args = {"sslmode": "require"}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

try:
    with Session(engine) as session:
        print("--- Testing Connection ---")
        # Simple query to test
        count = session.exec(select(User)).first()
        print(f"Connection OK. Found user: {count.name if count else 'None'}")
        
        print("\n--- Justifications ---")
        statement = select(Justification)
        justs = session.exec(statement).all()
        print(f"Total justifications: {len(justs)}")
        for j in justs:
            print(f"ID: {j.id}, StudentID: {j.student_id}, Status: {j.status}")
except Exception as e:
    print(f"ERROR: {e}")
