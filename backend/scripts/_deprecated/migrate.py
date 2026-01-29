"""
Database migration script to add new columns for coordinator features
"""
from sqlmodel import text
from database import engine

def migrate():
    columns = [
        ("year", "VARCHAR(10)"),
        ("profile_photo", "TEXT"),
        ("phone", "VARCHAR(50)"),
        ("office", "VARCHAR(100)"),
        ("bio", "TEXT"),
        # New fields for Student Portal Overhaul
        ("paternal_surname", "VARCHAR(100)"),
        ("maternal_surname", "VARCHAR(100)"),
        ("personal_email", "VARCHAR(255)"),
        ("emergency_phone", "VARCHAR(50)"),
        ("admission_year", "INTEGER"),
        ("program", "VARCHAR(100)"),
        ("modality", "VARCHAR(50)")
    ]
    
    for col_name, col_type in columns:
        with engine.connect() as conn:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()
                print(f"✓ Added/verified {col_name} column")
            except Exception as e:
                conn.rollback()
                print(f"✗ Error with {col_name}: {e}")
    
    # Add COORDINADOR to userrole enum
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'coordinador'"))
            conn.commit()
            print("✓ Added coordinador to userrole enum")
        except Exception as e:
            conn.rollback()
            print(f"- coordinador enum: {e}")
    
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
