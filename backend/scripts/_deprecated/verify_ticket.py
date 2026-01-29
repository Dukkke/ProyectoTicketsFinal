
import sys
import os
from sqlmodel import select, Session, create_engine
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.user import User, UserRole
from app.api.v1.endpoints.tickets import create_ticket_logic
from app.schemas.ticket import TicketCreate

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def verify_flow():
    with Session(engine) as session:
        # 1. Get a student
        student = session.exec(select(User).where(User.role == UserRole.ESTUDIANTE)).first()
        if not student:
            print("ERROR: No student found in DB")
            return
        print(f"Using student: {student.email} (ID: {student.id})")

        # 2. Get an academic (for the random assignment)
        academic = session.exec(select(User).where(User.role == UserRole.ACADEMICO)).first()
        if not academic:
            print("WARNING: No academic found in DB")
        else:
            print(f"Found academic: {academic.email} (ID: {academic.id})")

        # 3. Simulate Ticket Creation payload from Frontend
        # Frontend sends 'inscripcion' which is NOT in TicketType ENUM
        ticket_data = TicketCreate(
            title="Test Ticket Emoji",
            description="Testing flow with emojis",
            ticket_type="📚 Dudas Académicas", # Frontend style validation
            academic_id=0 # Frontend sends 0 or undefined. Pydantic Optional[int] = None default.
        )
        
        # Adjust academic_id logic to match frontend sending 0/None
        # But wait, create_ticket_logic expects TicketCreate object.
        # TicketCreate.academic_id is Optional[int].
        # If I pass 0, it is 0.
        
        print("Attempting to create ticket...")
        try:
            response = create_ticket_logic(session, ticket_data, student.id)
            print("SUCCESS: Ticket created!")
            print(response)
        except Exception as e:
            print(f"FAILED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    verify_flow()
