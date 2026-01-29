from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/user/{user_id}", response_model=List[NotificationResponse])
def get_user_notifications(
    user_id: int,
    session: Session = Depends(get_session)
):
    """Get notifications for a user"""
    query = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
    return session.exec(query).all()

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    session: Session = Depends(get_session)
):
    """Mark a notification as read"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.is_read = True
    session.add(notification)
    session.commit()
    return {"ok": True}
