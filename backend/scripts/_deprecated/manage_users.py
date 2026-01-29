"""
Unified User Management Script
Usage:
    python manage_users.py
    Follow the interactive prompts to add or update users.
"""
import sys
import os
import getpass

# Add parent directory to path to import database/models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select, text
from database import engine
from models import User, UserRole
from routers.auth import hash_password

def get_role_choice():
    print("\nSelect Role:")
    print("1. ESTUDIANTE")
    print("2. ACADEMICO")
    print("3. COORDINADOR")
    print("4. ADMIN")
    
    while True:
        choice = input("Enter choice (1-4): ").strip()
        if choice == "1": return UserRole.ESTUDIANTE
        if choice == "2": return UserRole.ACADEMICO
        if choice == "3": return UserRole.COORDINADOR
        if choice == "4": return UserRole.ADMIN
        print("Invalid choice. Try again.")

def create_or_update_user():
    print("\n=== User Management ===")
    email = input("Email: ").strip()
    if not email:
        print("Email is required.")
        return

    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        
        if user:
            print(f"\nUser found: {user.name} (Role: {user.role})")
            if input("Update this user? (y/n): ").lower() != 'y':
                return
        else:
            print("\nCreating new user...")
            user = User(email=email, password_hash="", name="", role=UserRole.ESTUDIANTE)

        # Get details
        name = input(f"Name [{user.name}]: ").strip()
        if name: user.name = name
        
        # Role
        role = get_role_choice()
        user.role = role.value if hasattr(role, 'value') else role # Handle Enum vs Str
        
        # Password
        pwd = getpass.getpass("Password (leave blank to keep current): ").strip()
        if pwd:
            user.password_hash = hash_password(pwd)
        elif not user.password_hash:
            print("Password is required for new users!")
            return

        # Specific fields based on role
        if role == UserRole.ESTUDIANTE:
            user.year = input(f"Year (1-5) [{user.year or ''}]: ").strip() or user.year
            user.rut = input(f"RUT [{user.rut or ''}]: ").strip() or user.rut

        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"\n✅ Successfully saved user: {user.name} as {user.role}")

def main():
    while True:
        create_or_update_user()
        if input("\nManage another user? (y/n): ").lower() != 'y':
            break

if __name__ == "__main__":
    main()
