
import sys
import os
from sqlmodel import select, Session, create_engine
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.user import User

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Testing connection to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with Session(engine) as session:
        print("Connection successful.")
        email = "variquep@alumnos.uahurtado.cl"
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            print(f"User found: {user.email}, Role: {user.role}, ID: {user.id}")
            print(f"Password hash length: {len(user.password_hash)}")
        else:
            print(f"User {email} NOT found.")

except Exception as e:
    print(f"Error connecting to DB: {e}")
