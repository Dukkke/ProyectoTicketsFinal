
"""
Update TicketType Enum in Database
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import text
from app.core.database import engine

def migrate():
    print("Migrating tickettype enum...")
    new_values = ['inscripcion', 'dificultades', 'otro']
    
    with engine.connect() as conn:
        for val in new_values:
            try:
                # PostgreSQL specific command to add value to enum
                conn.execute(text(f"ALTER TYPE tickettype ADD VALUE IF NOT EXISTS '{val}'"))
                conn.commit()
                print(f"✓ Added '{val}' to tickettype")
            except Exception as e:
                conn.rollback()
                print(f"Error adding '{val}': {e}")
                
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
