
"""
Create AuditLog table
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import SQLModel
from app.core.database import engine
from app.models.audit import AuditLog

def migrate():
    print("Creating audit_logs table...")
    SQLModel.metadata.create_all(engine)
    print("✓ Created audit_logs table")

if __name__ == "__main__":
    migrate()
