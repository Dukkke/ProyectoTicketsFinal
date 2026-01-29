from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
# Ensure the URL is valid for sqlalchemy (postgres -> postgresql)
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

print(f"Connecting to: {database_url}")

try:
    engine = create_engine(database_url)
    inspector = inspect(engine)
    columns = inspector.get_columns('users')
    print("Columns in 'users' table:")
    for column in columns:
        print(f"- {column['name']} ({column['type']})")
except Exception as e:
    print(f"Error: {e}")
