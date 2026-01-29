from sqlmodel import Session, select
from app.core.database import engine
from app.models.ticket import Ticket

with Session(engine) as session:
    # Find deleted tickets for student 18
    deleted_tickets = session.exec(
        select(Ticket)
        .where(Ticket.student_id == 18)
        .where(Ticket.is_deleted == True)
    ).all()
    
    print(f"Found {len(deleted_tickets)} deleted tickets.")
    
    for t in deleted_tickets:
        print(f"Restoring ticket {t.id} (Resolved at: {t.resolved_at})")
        t.is_deleted = False
        session.add(t)
    
    session.commit()
    print("Tickets restored.")
