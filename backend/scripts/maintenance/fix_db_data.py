from app.core.database import engine
from sqlmodel import Session, select, text
from app.models.ticket import Ticket
from app.models.user import User

def fix_data():
    with Session(engine) as session:
        # 1. Check User Count
        user_count = session.exec(select(User)).all()
        print(f"Total Users in DB: {len(user_count)}")
        
        # 2. Check Ticket Count
        tickets = session.exec(select(Ticket)).all()
        print(f"Total Tickets in DB: {len(tickets)}")
        
        # 3. Check for NULLs in is_deleted
        # raw SQL check
        try:
            null_deleted = session.exec(text("SELECT count(*) FROM tickets WHERE is_deleted IS NULL")).one()
            print(f"Tickets with NULL is_deleted: {null_deleted}")
        except Exception as e:
            print(f"Error checking nulls: {e}")

        # 4. Fix NULLs
        print("Fixing NULL values...")
        try:
            session.exec(text("UPDATE tickets SET is_deleted = 0 WHERE is_deleted IS NULL"))
            session.exec(text("UPDATE tickets SET is_archived = 0 WHERE is_archived IS NULL"))
            session.commit()
            print("NULLs fixed.")
        except Exception as e:
            print(f"Error fixing NULLs: {e}")

        # 5. Verify Ticket Visibility (Simulate API query)
        visible = session.exec(select(Ticket).where(Ticket.is_deleted == False)).all()
        print(f"Visible Tickets (is_deleted=False): {len(visible)}")

if __name__ == "__main__":
    fix_data()
