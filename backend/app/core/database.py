"""
Database configuration for the Tickets UAH system.
Uses SQLModel with PostgreSQL.
Supports both local Docker and Azure Database for PostgreSQL.
"""
import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
# For Azure: Use the connection string from Azure Portal
# For Local Docker: Uses 'db' as hostname within Docker network
DATABASE_URL = os.getenv("DATABASE_URL")

# Check if using Azure (requires SSL)
USE_AZURE = os.getenv("USE_AZURE", "false").lower() == "true"

# Connection arguments for SSL (required for Azure PostgreSQL)
connect_args = {}
if USE_AZURE:
    connect_args = {
        "sslmode": "require"
    }

# Create engine with appropriate settings
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",
    connect_args=connect_args,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True  # Verify connections before use
)


def init_db():
    """Initialize database tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
