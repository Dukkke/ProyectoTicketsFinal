
"""
Change ticket_type column to VARCHAR
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import text
from app.core.database import engine

def migrate():
    print("Migrating ticket_type column to VARCHAR...")
    
    with engine.connect() as conn:
        try:
            # Change column type to VARCHAR
            # USING ticket_type::text cast is necessary if converting from enum
            conn.execute(text("ALTER TABLE tickets ALTER COLUMN ticket_type TYPE VARCHAR USING ticket_type::text"))
            conn.commit()
            print("✓ Changed ticket_type column to VARCHAR")
        except Exception as e:
            conn.rollback()
            print(f"Error changing column type: {e}")
                
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
