# app/services/ticket_service.py
"""
Servicio de Tickets - Lógica de negocio para gestión de tickets.
Extraído de scripts/verify_ticket.py y endpoints.
"""

from typing import Optional, List
from sqlmodel import Session, select
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketType
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketUpdate


class TicketService:
    """Servicio para operaciones de tickets."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create_ticket(
        self, 
        ticket_data: TicketCreate, 
        student_id: int,
        auto_assign: bool = True
    ) -> Ticket:
        """
        Crea un nuevo ticket.
        
        Args:
            ticket_data: Datos del ticket
            student_id: ID del estudiante que crea el ticket
            auto_assign: Si es True, asigna automáticamente un académico
            
        Returns:
            Ticket creado
        """
        academic_id = None
        if auto_assign and not ticket_data.academic_id:
            academic = self._get_available_academic()
            academic_id = academic.id if academic else None
        else:
            academic_id = ticket_data.academic_id
        
        ticket = Ticket(
            title=ticket_data.title,
            description=ticket_data.description,
            ticket_type=ticket_data.ticket_type,
            student_id=student_id,
            academic_id=academic_id,
            status=TicketStatus.ABIERTO
        )
        
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket
    
    def get_ticket_by_id(self, ticket_id: int) -> Optional[Ticket]:
        """Obtiene un ticket por su ID."""
        return self.session.get(Ticket, ticket_id)
    
    def get_tickets_by_student(self, student_id: int) -> List[Ticket]:
        """Obtiene todos los tickets de un estudiante."""
        statement = select(Ticket).where(Ticket.student_id == student_id)
        return list(self.session.exec(statement).all())
    
    def get_tickets_by_academic(self, academic_id: int) -> List[Ticket]:
        """Obtiene todos los tickets asignados a un académico."""
        statement = select(Ticket).where(Ticket.academic_id == academic_id)
        return list(self.session.exec(statement).all())
    
    def get_pending_tickets(self) -> List[Ticket]:
        """Obtiene tickets sin asignar o pendientes."""
        statement = select(Ticket).where(
            Ticket.status.in_([TicketStatus.ABIERTO, TicketStatus.EN_PROGRESO])
        )
        return list(self.session.exec(statement).all())
    
    def update_ticket_status(
        self, 
        ticket_id: int, 
        new_status: TicketStatus,
        user_id: int
    ) -> Optional[Ticket]:
        """
        Actualiza el estado de un ticket.
        
        Args:
            ticket_id: ID del ticket
            new_status: Nuevo estado
            user_id: ID del usuario que realiza el cambio
            
        Returns:
            Ticket actualizado o None si no existe
        """
        ticket = self.get_ticket_by_id(ticket_id)
        if not ticket:
            return None
        
        # Manejar reapertura
        if new_status == TicketStatus.REABIERTO:
            ticket.reopen_count = (ticket.reopen_count or 0) + 1
        
        ticket.status = new_status
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket
    
    def assign_ticket(
        self, 
        ticket_id: int, 
        academic_id: int
    ) -> Optional[Ticket]:
        """Asigna un ticket a un académico."""
        ticket = self.get_ticket_by_id(ticket_id)
        if not ticket:
            return None
        
        ticket.academic_id = academic_id
        if ticket.status == TicketStatus.ABIERTO:
            ticket.status = TicketStatus.EN_PROGRESO
        
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket
    
    def add_message(
        self,
        ticket_id: int,
        sender_id: int,
        content: str
    ) -> Optional[TicketMessage]:
        """Agrega un mensaje a un ticket."""
        ticket = self.get_ticket_by_id(ticket_id)
        if not ticket:
            return None
        
        message = TicketMessage(
            ticket_id=ticket_id,
            sender_id=sender_id,
            content=content
        )
        
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message
    
    def get_ticket_messages(self, ticket_id: int) -> List[TicketMessage]:
        """Obtiene todos los mensajes de un ticket."""
        statement = select(TicketMessage).where(
            TicketMessage.ticket_id == ticket_id
        ).order_by(TicketMessage.created_at)
        return list(self.session.exec(statement).all())
    
    def _get_available_academic(self) -> Optional[User]:
        """Obtiene un académico disponible para asignación."""
        # Lógica simple: obtener el primero disponible
        # TODO: Implementar balanceo de carga
        statement = select(User).where(User.role == UserRole.ACADEMICO)
        return self.session.exec(statement).first()
    
    def verify_ticket_flow(self, student_email: str) -> dict:
        """
        Verifica el flujo completo de creación de tickets.
        Útil para debugging y testing.
        
        Args:
            student_email: Email del estudiante
            
        Returns:
            Diccionario con resultado de la verificación
        """
        # Buscar estudiante
        student = self.session.exec(
            select(User).where(User.email == student_email)
        ).first()
        
        if not student:
            return {"success": False, "error": "Estudiante no encontrado"}
        
        if student.role != UserRole.ESTUDIANTE:
            return {"success": False, "error": "El usuario no es estudiante"}
        
        # Buscar académico
        academic = self._get_available_academic()
        
        return {
            "success": True,
            "student": {
                "id": student.id,
                "email": student.email,
                "name": student.nombre
            },
            "academic_available": academic is not None,
            "academic": {
                "id": academic.id,
                "email": academic.email,
                "name": academic.nombre
            } if academic else None
        }
