"""
Add reopen_count column to tickets table.
Run this script from the backend directory with the virtual environment activated.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL[:50]}..." if DATABASE_URL else "DATABASE_URL not set!")

if not DATABASE_URL:
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        # PostgreSQL syntax for adding column if not exists
        conn.execute(text("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='reopen_count') THEN
                    ALTER TABLE tickets ADD COLUMN reopen_count INTEGER DEFAULT 0;
                END IF;
            END $$;
        """))
        conn.commit()
        print("✅ Column reopen_count added (or already exists)")
    except Exception as e:
        print(f"❌ Error: {e}")
