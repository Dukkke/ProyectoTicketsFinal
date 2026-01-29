"""
Ticket Messages router for the Tickets UAH system.
Handles chat messages between students, coordinators, and academics.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List

from app.core.database import get_session
from app.models.ticket import TicketMessage, MessageSenderRole, Ticket
from app.models.user import User
from app.schemas.ticket import TicketMessageCreate, TicketMessageResponse


router = APIRouter(prefix="/api/tickets", tags=["Ticket Messages"])


@router.get("/{ticket_id}/messages", response_model=List[TicketMessageResponse])
def get_ticket_messages(ticket_id: int, session: Session = Depends(get_session)):
    """
    Get all messages for a ticket, ordered by creation date.
    """
    # Verify ticket exists
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Get messages
    messages = session.exec(
        select(TicketMessage)
        .where(TicketMessage.ticket_id == ticket_id)
        .order_by(TicketMessage.created_at)
    ).all()
    
    # Enrich with sender info
    result = []
    for msg in messages:
        sender = session.get(User, msg.sender_id)
        result.append(TicketMessageResponse(
            id=msg.id,
            ticket_id=msg.ticket_id,
            sender_id=msg.sender_id,
            sender_role=msg.sender_role,
            sender_name=sender.name if sender else "Usuario eliminado",
            sender_photo=sender.profile_photo if sender else None,
            content=msg.content,
            created_at=msg.created_at,
            is_system_message=msg.is_system_message
        ))
    
    return result


@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse)
def create_ticket_message(
    ticket_id: int,
    message_data: TicketMessageCreate,
    sender_id: int,
    sender_role: str,
    session: Session = Depends(get_session)
):
    """
    Create a new message in a ticket conversation.
    """
    # Verify ticket exists
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Verify sender exists
    sender = session.get(User, sender_id)
    if not sender:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Map role string to enum
    role_mapping = {
        'estudiante': MessageSenderRole.ESTUDIANTE,
        'coordinador': MessageSenderRole.COORDINADOR,
        'academico': MessageSenderRole.ACADEMICO,
    }
    msg_role = role_mapping.get(sender_role.lower())
    if not msg_role:
        raise HTTPException(status_code=400, detail="Rol no válido")
    
    # Limit students to 3 messages per ticket to avoid overwhelming coordinators/academics
    MAX_STUDENT_MESSAGES = 3
    if msg_role == MessageSenderRole.ESTUDIANTE:
        student_message_count = len(session.exec(
            select(TicketMessage)
            .where(TicketMessage.ticket_id == ticket_id)
            .where(TicketMessage.sender_role == MessageSenderRole.ESTUDIANTE)
            .where(TicketMessage.is_system_message == False)
        ).all())
        
        if student_message_count >= MAX_STUDENT_MESSAGES:
            raise HTTPException(
                status_code=400, 
                detail=f"Has alcanzado el límite de {MAX_STUDENT_MESSAGES} mensajes para este ticket. Espera la respuesta de coordinación."
            )
    
    # Create message
    new_message = TicketMessage(
        ticket_id=ticket_id,
        sender_id=sender_id,
        sender_role=msg_role,
        content=message_data.content,
        is_system_message=False
    )
    
    session.add(new_message)
    session.commit()
    session.refresh(new_message)
    
    # Notify recipient
    from app.models.notification import Notification
    
    target_user_id = None
    if msg_role == MessageSenderRole.ESTUDIANTE:
        # If student sends message, notify the academic assigned OR search for the coordinator
        target_user_id = ticket.academic_id
        # Also notify coordinator if not assigned to academic or as secondary? 
        # For now, let's notify the academic if exists, otherwise we'd need to find the coordinator.
        if not target_user_id:
             # Find coordinator for modality
             student = session.get(User, sender_id)
             is_remota = (student.modality and student.modality.lower() == "remota")
             from app.models.user import REMOTA_COORDINATOR_EMAIL, UserRole
             from sqlmodel import select
             if is_remota:
                 coord = session.exec(select(User).where(User.email == REMOTA_COORDINATOR_EMAIL)).first()
             else:
                 coord = session.exec(select(User).where(User.role == UserRole.COORDINADOR).where(User.email != REMOTA_COORDINATOR_EMAIL)).first()
             if coord:
                 target_user_id = coord.id
    else:
        # If coordinator or academic sends message, notify student
        target_user_id = ticket.student_id
        
    if target_user_id and target_user_id != sender_id:
        notification = Notification(
            user_id=target_user_id,
            title="Nuevo Mensaje",
            message=f"Has recibido un nuevo mensaje en el ticket {ticket.ticket_code}",
            type="message",
            related_id=ticket.id
        )
        session.add(notification)
        session.commit()
    
    return TicketMessageResponse(
        id=new_message.id,
        ticket_id=new_message.ticket_id,
        sender_id=new_message.sender_id,
        sender_role=new_message.sender_role,
        sender_name=sender.name,
        sender_photo=sender.profile_photo,
        content=new_message.content,
        created_at=new_message.created_at,
        is_system_message=new_message.is_system_message
    )


def create_system_message(
    ticket_id: int, 
    content: str, 
    sender_id: int,
    sender_role: MessageSenderRole,
    session: Session
):
    """
    Helper function to create system messages (e.g., "Ticket derivado a...").
    """
    msg = TicketMessage(
        ticket_id=ticket_id,
        sender_id=sender_id,
        sender_role=sender_role,
        content=content,
        is_system_message=True
    )
    session.add(msg)
    session.commit()
    return msg
