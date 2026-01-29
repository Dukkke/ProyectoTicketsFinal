
from sqlmodel import Session, select, create_engine
from app.models.user import User
from app.models.justification import Justification
from app.core.database import DATABASE_URL

# Adjust DATABASE_URL if needed for local script execution
# Typically DATABASE_URL is in environment variables or hardcoded in core/database.py
# I'll rely on app.core.database to import the engine or create one.
from app.core.database import engine

def check_data():
    with Session(engine) as session:
        # Find user
        statement = select(User).where(User.name.like("%Valentina%"))
        users = session.exec(statement).all()
        
        print(f"Found {len(users)} users matching 'Valentina'")
        
        for user in users:
            print(f"User ID: {user.id}, Name: {user.name} {user.paternal_surname}, Email: {user.email}")
            
            # Check justifications
            j_stmt = select(Justification).where(Justification.student_id == user.id)
            justifications = session.exec(j_stmt).all()
            
            print(f"  Justifications found: {len(justifications)}")
            for j in justifications:
                print(f"    - ID: {j.id}, Status: {j.status}, Created: {j.created_at}")

if __name__ == "__main__":
    check_data()
