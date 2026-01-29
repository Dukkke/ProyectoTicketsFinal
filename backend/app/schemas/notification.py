from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel

class NotificationBase(SQLModel):
    title: str
    message: str
    is_read: bool = False
    type: str
    related_id: int

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime
