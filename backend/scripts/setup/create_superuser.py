"""
Script to create a Superuser (Admin) by code configuration.
Usage: python create_superuser.py
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from database import engine
from models import User, UserRole
from routers.auth import hash_password

# ==========================================
# CONFIGURACIÓN - EDITA TU SUPERUSUARIO AQUÍ
# ==========================================
# Modifica estos 3 valores para crear tu admin:
SUPERUSER_EMAIL = "admin@tickets.uah.cl"
SUPERUSER_NAME = "Super Admin"
SUPERUSER_PASSWORD = "StrongPassword123!"
# ==========================================

def create_superuser():
    with Session(engine) as session:
        # Check if user exists
        user = session.exec(select(User).where(User.email == SUPERUSER_EMAIL)).first()
        
        hashed_pw = hash_password(SUPERUSER_PASSWORD)
        
        if user:
            print(f"User {SUPERUSER_EMAIL} found.")
            # Upgrade to admin if not already
            if user.role != UserRole.ADMIN:
                user.role = UserRole.ADMIN.value
                user.password_hash = hashed_pw # Update password too just in case
                session.add(user)
                session.commit()
                print(f"✅ Updated {SUPERUSER_EMAIL} to ADMIN role.")
            else:
                print(f"ℹ️ User is already an ADMIN.")
        else:
            # Create new superuser
            new_user = User(
                email=SUPERUSER_EMAIL,
                name=SUPERUSER_NAME,
                password_hash=hashed_pw,
                role=UserRole.ADMIN.value
            )
            session.add(new_user)
            session.commit()
            print(f"✅ Created Superuser: {SUPERUSER_NAME} ({SUPERUSER_EMAIL})")

if __name__ == "__main__":
    create_superuser()
