
import sys
import os
from datetime import datetime, timedelta
from sqlmodel import select, Session, create_engine, func
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate
from app.models.audit import AuditLog
from app.api.v1.endpoints.tickets import create_ticket_logic, delete_ticket

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_verification():
    print("--- Starting Verification ---")
    with Session(engine) as session:
        # 1. Get a student
        student = session.exec(select(User).where(User.role == UserRole.ESTUDIANTE)).first()
        if not student:
            print("ERROR: No student found")
            return
        
        print(f"Using student: {student.email} (ID: {student.id})")

        # 2. Test Rate Limiting
        print("\n[Test 1] Rate Limiting (Max 3 tickets)")
        # Clean previous tickets for this student to ensure a clean slate
        # (Optional: Only if debugging locally, but safer to just try creating 4)
        
        success_count = 0
        try:
            for i in range(4):
                print(f"Creating ticket #{i+1}...")
                ticket_data = TicketCreate(
                    title=f"Rate Limit Test {i}",
                    description="Testing rate limit",
                    ticket_type="📚 Dudas Académicas",
                    academic_id=0
                )
                create_ticket_logic(session, ticket_data, student.id)
                success_count += 1
                try:
                    print(f"✓ Created ticket #{i+1}")
                except UnicodeEncodeError:
                    print(f"OK Created ticket #{i+1}")
        except Exception as e:
            try:
                print(f"Expected Error on #{success_count+1}: {e}")
            except UnicodeEncodeError:
                print(f"Expected Error on #{success_count+1}: (encoding error)")
                
            if "limit" in str(e) or "límite" in str(e):
                print("PASS: Rate limit caught correctly.")
            else:
                try:
                    print(f"FAIL: Unexpected error: {e}")
                except UnicodeEncodeError:
                    print("FAIL: Unexpected error (encoding error)")

        # 3. Test Audit Logic (Delete)
        print("\n[Test 2] Audit Logging on Delete")
        # Create a disposable ticket
        t_data = TicketCreate(title="To Delete", description="Will be audited", ticket_type="📚 Dudas Académicas", academic_id=0)
        # We might be rate limited now, so let's find an existing one or try create
        # Get an academic
        academic = session.exec(select(User).where(User.role == UserRole.ACADEMICO)).first()
        academic_id = academic.id if academic else None
        
        try:
            # Bypass logic helper to avoid rate limit for this test setup? 
            # Or manually insert. Let's manually insert to be safe.
            ticket = Ticket(
                ticket_code="TKT-TEST-DELETE",
                student_id=student.id,
                academic_id=academic_id,
                ticket_type="test", 
                title="Audit Test",
                description="Audit Test",
                proposed_date=datetime.now()
            )
            session.add(ticket)
            session.commit()
            session.refresh(ticket)
            ticket_id = ticket.id
            print(f"Created temp ticket ID {ticket_id} for deletion test")
            
            # Now delete it
            delete_ticket(ticket_id, session)
            print("OK Ticket deleted via API function")
            
            # Check Audit Log
            log = session.exec(select(AuditLog).where(AuditLog.target_id == ticket_id)).first()
            if log:
                print(f"PASS: Audit log found! Action: {log.action}, Target: {log.target_id}")
                print(f"Details: {log.details}")
            else:
                print("FAIL: No audit log found for deleted ticket.")
                
        except Exception as e:
            print(f"FAIL: Error during audit test: {e}")

if __name__ == "__main__":
    run_verification()
