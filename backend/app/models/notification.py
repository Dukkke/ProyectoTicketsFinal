from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    title: str
    message: str
    is_read: bool = Field(default=False)
    type: str  # 'ticket' | 'justification'
    related_id: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
