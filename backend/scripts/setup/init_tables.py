"""
Script to initialize/create all database tables.
Run this to create missing tables like tickets and courses.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from database import engine, init_db
from models import User, Ticket, Course  # Import all models

print("Creating database tables...")
print(f"Database URL: {os.getenv('DATABASE_URL')[:50]}...")

try:
    init_db()
    print("✅ Tables created successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
