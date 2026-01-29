"""
Tickets module for the Tickets UAH system.
Handles ticket creation, management, and statistics.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, func, delete

from app.core.database import get_session
from app.models.user import User, UserRole, REMOTA_COORDINATOR_EMAIL
from app.models.ticket import Ticket, TicketType, TicketStatus, TicketMessage, MessageSenderRole
from app.models.audit import AuditLog
from app.models.course import Course, StudentCourse
from app.schemas.user import UserResponse
from app.schemas.ticket import (
    TicketCreate, TicketResponse, TicketAccept, TicketReject, 
    RespondRequest, EscalateRequest, ReopenRequest
)
from app.schemas.course import CourseCreate, CourseResponse, AssignStudentRequest

# Create router
router = APIRouter(prefix="/api", tags=["Tickets"])


def generate_ticket_code(session: Session) -> str:
    """Generate unique ticket code like TKT-2026-0001"""
    year = datetime.now().year
    prefix = f"TKT-{year}-"
    
    # Find the highest ticket number for this year
    result = session.exec(
        select(Ticket.ticket_code).where(
            Ticket.ticket_code.like(f"{prefix}%")
        ).order_by(Ticket.ticket_code.desc())
    ).first()
    
    if result:
        # Extract the number from the last ticket code (e.g., "TKT-2026-0003" -> 3)
        try:
            last_num = int(result.split("-")[-1])
            next_num = last_num + 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1
    
    return f"{prefix}{next_num:04d}"


def check_expired_tickets(session: Session):
    """
    Check for 'solucionado' tickets older than 7 days and soft-delete them.
    This runs on list requests to ensure lazy maintenance.
    """
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    expired_tickets = session.exec(
        select(Ticket).where(
            Ticket.status == TicketStatus.solucionado,
            Ticket.resolved_at < seven_days_ago,
            Ticket.is_deleted == False
        )
    ).all()
    
    if expired_tickets:
        print(f"DEBUG: Soft-deleting {len(expired_tickets)} expired tickets")
        for ticket in expired_tickets:
            ticket.is_deleted = True
            ticket.deleted_at = datetime.utcnow()
            session.add(ticket)
        session.commit()


def enrich_ticket_response(ticket: Ticket, session: Session) -> TicketResponse:
    """Add student and academic names to ticket response"""
    student = session.get(User, ticket.student_id)
    academic = session.get(User, ticket.academic_id)
    coordinator = session.get(User, ticket.coordinator_id) if ticket.coordinator_id else None
    
    return TicketResponse(
        id=ticket.id,
        ticket_code=ticket.ticket_code,
        student_id=ticket.student_id,
        academic_id=ticket.academic_id,
        ticket_type=ticket.ticket_type,
        status=ticket.status,
        title=ticket.title,
        description=ticket.description,
        proposed_date=ticket.proposed_date,
        confirmed_date=ticket.confirmed_date,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        rejection_reason=ticket.rejection_reason,
        coordinator_response=ticket.coordinator_response,
        coordinator_id=ticket.coordinator_id,
        responded_at=ticket.responded_at,
        satisfaction_rating=ticket.satisfaction_rating,
        satisfaction_comment=ticket.satisfaction_comment,
        resolved_at=ticket.resolved_at,
        escalated_to_academic=ticket.escalated_to_academic,
        escalation_note=ticket.escalation_note,
        student_name=student.name if student else None,
        student_year=student.year if student else None,
        student_rut=student.rut if student else None,
        student_profile_photo=student.profile_photo if student else None,
        student_email=student.email if student else None,
        student_modality=student.modality if student else None,
        academic_name=academic.name if academic else None,
        student_admission_year=student.admission_year if student else None,
        coordinator_name=coordinator.name if coordinator else None,
    )


# ========== TICKET ENDPOINTS ==========

def create_ticket_logic(session: Session, ticket_data: TicketCreate, student_id: int):
    """Core logic for creating a ticket"""
    # Verify student exists
    student = session.get(User, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    # Rate Limiting: Check tickets created by this student in the last 24 hours
    last_24h = datetime.utcnow() - timedelta(hours=24)
    daily_count = session.exec(
        select(func.count(Ticket.id)).where(
            Ticket.student_id == student_id,
            Ticket.created_at >= last_24h
        )
    ).one() or 0
    
    if daily_count >= 3:
        raise HTTPException(status_code=400, detail="Has excedido el límite de 3 tickets diarios")
    
    # Handle academic_id - if provided, verify it exists
    academic_id = ticket_data.academic_id
    if academic_id:
        academic = session.get(User, academic_id)
        if not academic:
            raise HTTPException(status_code=404, detail="Académico no encontrado")
        if academic.role != UserRole.ACADEMICO:
            raise HTTPException(status_code=400, detail="El usuario seleccionado no es académico")
    else:
        # If no academic specified, we need to assign one for the DB constraint.
        # Fallback priority:
        # 1. First available Academic
        # 2. Remote Coordinator (Giannina) to support remote tickets flow
        # 3. Any available Coordinator
        
        first_academic = session.exec(
            select(User).where(User.role == UserRole.ACADEMICO)
        ).first()
        
        if first_academic:
            academic_id = first_academic.id
        else:
            # Fallback to Coordinator if no academics exist
            remota_coord = session.exec(
                select(User).where(User.email == REMOTA_COORDINATOR_EMAIL)
            ).first()
            
            if remota_coord:
                academic_id = remota_coord.id
            else:
                # Any coordinator
                any_coord = session.exec(
                    select(User).where(User.role == UserRole.COORDINADOR)
                ).first()
                
                if any_coord:
                    academic_id = any_coord.id
                else:
                    raise HTTPException(status_code=400, detail="No hay académicos ni coordinadores disponibles para asignar el ticket")
    
    # Handle proposed_date - if not provided, use current datetime
    proposed_date = ticket_data.proposed_date or datetime.utcnow()
    
    # Generate ticket code
    ticket_code = generate_ticket_code(session)
    
    # Create ticket
    ticket = Ticket(
        ticket_code=ticket_code,
        student_id=student_id,
        academic_id=academic_id,
        ticket_type=ticket_data.ticket_type,
        title=ticket_data.title,
        description=ticket_data.description,
        proposed_date=proposed_date,
    )
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Notify Coordinator
    from app.models.notification import Notification
    
    # Determine which coordinator to notify based on student modality
    is_remota = (student.modality and student.modality.lower() == "remota")
    
    # We need to find the coordinator for this modality
    target_coordinator = None
    if is_remota:
        target_coordinator = session.exec(
            select(User).where(User.email == REMOTA_COORDINATOR_EMAIL)
        ).first()
    else:
        # For Diurna, find any coordinator who IS NOT the remote one
        target_coordinator = session.exec(
            select(User)
            .where(User.role == UserRole.COORDINADOR)
            .where(User.email != REMOTA_COORDINATOR_EMAIL)
        ).first()
    
    if target_coordinator:
        # Diferenciar notificación según el tipo de ticket
        ticket_type_names = {
            "consulta": "Consulta",
            "solicitud_hora": "Solicitud de Hora",
            "sugerencia": "Sugerencia",
            "consulta_ramo": "Consulta sobre Ramo"
        }
        type_display = ticket_type_names.get(ticket.ticket_type, "Ticket")
        
        notification = Notification(
            user_id=target_coordinator.id,
            title=f"Nuevo Ticket de {type_display}",
            message=f"El estudiante {student.name} ha creado un ticket de {type_display.lower()}: {ticket.title}",
            type="ticket",
            related_id=ticket.id
        )
        session.add(notification)
        session.commit()
    
    return enrich_ticket_response(ticket, session)


@router.post("/tickets", response_model=TicketResponse)
def create_ticket(
    ticket_data: TicketCreate, 
    student_id: int,  # Will come from auth later or query param
    session: Session = Depends(get_session)
):
    """Create a new ticket (student creates) - Query param version"""
    return create_ticket_logic(session, ticket_data, student_id)


@router.post("/users/{student_id}/tickets", response_model=TicketResponse)
def create_user_ticket(
    student_id: int,
    ticket_data: TicketCreate,
    session: Session = Depends(get_session)
):
    """Create a new ticket for a specific user (Frontend compatible)"""
    return create_ticket_logic(session, ticket_data, student_id)


@router.get("/tickets", response_model=list[TicketResponse])
def list_tickets(
    coordinator_email: str = None,
    include_deleted: bool = False,
    session: Session = Depends(get_session)
):
    """
    List tickets filtered by coordinator modality.
    - Giannina (rradziev@uahurtado.cl): Only sees Remota tickets
    - Other coordinators: Only see diurno tickets
    """
    # 0. Lazy cleanup of expired tickets
    check_expired_tickets(session)

    # 1. Fetch tickets (excluding soft-deleted ones unless requested)
    query = select(Ticket)
    if not include_deleted:
        query = query.where(Ticket.is_deleted == False)
    
    tickets = session.exec(query).all()
    
    # If coordinator_email is provided, filter by modality and 7-day rule for solved tickets
    if coordinator_email:
        # Get current coordinator user to check direct assignment
        current_coord = session.exec(select(User).where(User.email == coordinator_email)).first()
        current_coord_id = current_coord.id if current_coord else None
        
        is_giannina = coordinator_email.lower() == REMOTA_COORDINATOR_EMAIL.lower()
        
        # 7-day cleanup rule for coordinators: Hide SOLUCIONADO tickets older than 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        filtered_tickets = []
        for ticket in tickets:
            # Rule 0: Allow if explicitly assigned to this coordinator (Overrides modality)
            # This ensures Cynthia/Margarita see their own tickets even if modality matches Giannina (and vice-versa)
            is_assigned_to_me = current_coord_id and ticket.coordinator_id == current_coord_id
            
            # Rule 0.5: Reopened tickets in pendiente status are ALWAYS visible to Presencial coordinators
            # This ensures no ticket gets lost due to modality mismatch after reopen
            is_reopened_pending = (ticket.reopen_count and ticket.reopen_count > 0 and 
                                   ticket.status == TicketStatus.pendiente and 
                                   not is_giannina)  # Only for Presencial coords
            
            # Giannina sees reopened tickets for Remota/Vespertina students (will be handled by modality below)
            # But Presencial coords (Cynthia/Margarita) see ALL reopened pending tickets
            
            # Rule 1: 7-day cleanup for resolved tickets (Applies to everyone)
            if ticket.status == TicketStatus.solucionado and ticket.resolved_at and ticket.resolved_at < seven_days_ago:
                continue
                
            student = session.get(User, ticket.student_id)
            if student:
                student_modality = (student.modality or "Diurna").lower()
                
                # Rule 2: Modality filtering
                matches_modality = False
                if is_giannina:
                    # Giannina only sees Remota students
                    if student_modality == "modalidad remota" or student_modality == "vespertina":
                        matches_modality = True
                else:
                    # Cynthia, Margarita, and other Presencial coords see diurno students
                    if student_modality != "modalidad remota" and student_modality != "vespertina":
                        matches_modality = True
                
                # Final Decision: Add if Modality Matches OR Assigned to Me OR Reopened Pending
                if matches_modality or is_assigned_to_me or is_reopened_pending:
                    filtered_tickets.append(ticket)
        
        return [enrich_ticket_response(t, session) for t in filtered_tickets]
    
    return [enrich_ticket_response(t, session) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, session: Session = Depends(get_session)):
    """Get a specific ticket"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return enrich_ticket_response(ticket, session)


@router.get("/tickets/student/{student_id}", response_model=list[TicketResponse])
def get_student_tickets(
    student_id: int, 
    archived: bool = False,
    session: Session = Depends(get_session)
):
    """Get tickets for a student (filtered by archived status)"""
    try:
        # Trigger cleanup
        check_expired_tickets(session)
        
        tickets = session.exec(
            select(Ticket)
            .where(Ticket.student_id == student_id)
            .where(Ticket.is_archived == archived)
            .where(Ticket.is_deleted == False)  # Exclude deleted tickets
            .order_by(Ticket.created_at.desc())
        ).all()
        return [enrich_ticket_response(t, session) for t in tickets]
    except Exception as e:
        print(f"TICKET ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            with open("ticket_error.log", "w") as f:
                f.write(str(e))
                traceback.print_exc(file=f)
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tickets/academic/{academic_id}", response_model=list[TicketResponse])
def get_academic_tickets(academic_id: int, session: Session = Depends(get_session)):
    """Get all tickets for an academic (excluding archived)"""
    check_expired_tickets(session)
    
    tickets = session.exec(
        select(Ticket)
        .where(Ticket.academic_id == academic_id)
        .where(Ticket.is_archived == False)
        .where(Ticket.is_deleted == False)
        .order_by(Ticket.created_at.desc())
    ).all()
    
    # Debug logging
    print(f"DEBUG: Fetching tickets for academic {academic_id}")
    print(f"DEBUG: Found {len(tickets)} tickets")
    for t in tickets:
        print(f"  - Ticket #{t.id}: status={t.status}, escalated={t.escalated_to_academic}")
    
    return [enrich_ticket_response(t, session) for t in tickets]


@router.put("/tickets/{ticket_id}/accept", response_model=TicketResponse)
def accept_ticket(
    ticket_id: int, 
    accept_data: TicketAccept,
    session: Session = Depends(get_session)
):
    """Accept a ticket (academic action)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    if ticket.status != TicketStatus.pendiente:
        raise HTTPException(status_code=400, detail="Solo se pueden aceptar tickets pendientes")
    
    ticket.status = TicketStatus.aceptado
    ticket.confirmed_date = accept_data.confirmed_date
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    
    return enrich_ticket_response(ticket, session)


@router.put("/tickets/{ticket_id}/archive")
def archive_ticket(ticket_id: int, session: Session = Depends(get_session)):
    """Archive a ticket (soft delete)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    ticket.is_archived = True
    session.add(ticket)
    session.commit()
    return {"message": "Ticket archivado exitosamente", "id": ticket_id}


@router.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: int, 
    hard: bool = False,
    session: Session = Depends(get_session)
):
    """Delete a ticket (Soft delete by default, Hard delete if specified)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    if hard:
        # Hard Delete: Remove from DB completely
        # Use bulk delete for messages to ensure all are removed
        try:
            # Delete messages first
            session.exec(delete(TicketMessage).where(TicketMessage.ticket_id == ticket_id))
            
            # Delete ticket
            session.delete(ticket)
            session.commit()
            return {"ok": True}
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Error al eliminar ticket: {str(e)}")
    else:
        # Soft Delete (Archive/Delete System)
        ticket.is_deleted = True
        ticket.deleted_at = datetime.utcnow()
        session.add(ticket)
        session.commit()
        return {"message": "Ticket eliminado (soft delete) exitosamente", "id": ticket_id}


@router.put("/tickets/{ticket_id}/reject", response_model=TicketResponse)
def reject_ticket(
    ticket_id: int,
    reject_data: TicketReject,
    session: Session = Depends(get_session)
):
    """Reject a ticket (academic action)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    if ticket.status != TicketStatus.pendiente:
        raise HTTPException(status_code=400, detail="Solo se pueden rechazar tickets pendientes")
    
    ticket.status = TicketStatus.rechazado
    ticket.rejection_reason = reject_data.rejection_reason
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    return enrich_ticket_response(ticket, session)


@router.put("/tickets/{ticket_id}/complete", response_model=TicketResponse)
def complete_ticket(ticket_id: int, session: Session = Depends(get_session)):
    """Mark a ticket as completed (by academic after attending student)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Allow completing tickets that are accepted, derivado, or respondido
    allowed_statuses = [TicketStatus.aceptado, TicketStatus.derivado, TicketStatus.respondido]
    if ticket.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Solo se pueden completar tickets aceptados, derivados o respondidos")
    
    ticket.status = TicketStatus.completado
    ticket.resolved_at = datetime.utcnow()
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    return enrich_ticket_response(ticket, session)


@router.post("/tickets/{ticket_id}/reopen", response_model=TicketResponse)
def reopen_ticket(
    ticket_id: int,
    reopen_data: ReopenRequest,
    session: Session = Depends(get_session)
):
    """
    Reopen a ticket (Student action).
    - Allow max 2 reopens.
    - Status changes to 'pendiente'.
    - Increment reopen_count.
    """
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Check if ticket is closed (solucionado or completado or rechazaod)
    if ticket.status not in [TicketStatus.solucionado, TicketStatus.completado, TicketStatus.rechazado]:
         raise HTTPException(status_code=400, detail="Solo se pueden reabrir tickets cerrados (solucionados o rechazados)")
            
    # Check reopen limit
    if ticket.reopen_count >= 2:
        raise HTTPException(status_code=400, detail="Has alcanzado el límite de reaperturas para este ticket (máximo 2)")
    
    # Update ticket
    ticket.status = TicketStatus.pendiente
    ticket.reopen_count += 1
    ticket.updated_at = datetime.utcnow()
    
    # Add system message indicating reopen
    message = TicketMessage(
        ticket_id=ticket_id,
        sender_id=ticket.student_id,
        sender_role=MessageSenderRole.ESTUDIANTE,
        content=f"Ticket Reabierto. Motivo: {reopen_data.reason}",
        is_system_message=True
    )
    session.add(message)
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Notify Coordinator (Original logic: find coordinator)
    # Re-use logic to find appropriate coordinator
    student = session.get(User, ticket.student_id)
    is_remota = (student.modality and student.modality.lower() == "remota")
    
    target_coordinator = None
    if is_remota:
        target_coordinator = session.exec(
            select(User).where(User.email == REMOTA_COORDINATOR_EMAIL)
        ).first()
    else:
        target_coordinator = session.exec(
            select(User)
            .where(User.role == UserRole.COORDINADOR)
            .where(User.email != REMOTA_COORDINATOR_EMAIL)
        ).first()
        
    if target_coordinator:
        from app.models.notification import Notification
        notification = Notification(
            user_id=target_coordinator.id,
            title=f"Ticket Reabierto (#{ticket.ticket_code})",
            message=f"El estudiante {student.name} ha reabierto el ticket: {ticket.title}",
            type="ticket",
            related_id=ticket.id
        )
        session.add(notification)
        session.commit()

    return enrich_ticket_response(ticket, session)





@router.put("/tickets/{ticket_id}/academic-respond")
def academic_respond_ticket(
    ticket_id: int,
    body: RespondRequest,
    session: Session = Depends(get_session)
):
    """Academic responds directly to student (for escalated tickets)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Check if ticket is in derivado status or pending (direct to academic)
    if ticket.status not in [TicketStatus.derivado, TicketStatus.pendiente]:
        raise HTTPException(status_code=400, detail="El ticket no está en estado que permita respuesta del académico")
    
    # Save the academic response (we'll use coordinator_response field but it's from academic)
    ticket.coordinator_response = body.response
    ticket.coordinator_id = body.coordinator_id  # Actually academic_id in this case
    ticket.responded_at = datetime.utcnow()
    ticket.status = TicketStatus.respondido
    ticket.updated_at = datetime.utcnow()
    
    # Save message to chat history
    message = TicketMessage(
        ticket_id=ticket_id,
        sender_id=body.coordinator_id,  # academic_id
        sender_role=MessageSenderRole.ACADEMICO,
        content=body.response,
        is_system_message=False
    )
    session.add(message)
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Notify Student
    from app.models.notification import Notification
    notification = Notification(
        user_id=ticket.student_id,
        title="Respuesta del Académico",
        message=f"El académico ha respondido a tu ticket: {ticket.title}",
        type="ticket",
        related_id=ticket.id
    )
    session.add(notification)
    session.commit()
    
    return enrich_ticket_response(ticket, session)


# ========== STATISTICS ENDPOINTS ==========

@router.get("/stats/academic/{academic_id}")
def get_academic_stats(academic_id: int, session: Session = Depends(get_session)):
    """Get statistics for an academic"""
    # Total tickets
    total = session.exec(
        select(func.count(Ticket.id)).where(Ticket.academic_id == academic_id)
    ).one() or 0
    
    # By status - Include 'derivado' in pending count for academics
    # (derivado means the ticket was escalated to the academic and is waiting for their response)
    pending = session.exec(
        select(func.count(Ticket.id)).where(
            Ticket.academic_id == academic_id,
            (Ticket.status == TicketStatus.pendiente) | (Ticket.status == TicketStatus.derivado)
        )
    ).one() or 0
    
    # Responded tickets (tickets that have been answered by the academic)
    responded = session.exec(
        select(func.count(Ticket.id)).where(
            Ticket.academic_id == academic_id,
            Ticket.status == TicketStatus.respondido
        )
    ).one() or 0
    
    accepted = session.exec(
        select(func.count(Ticket.id)).where(
            Ticket.academic_id == academic_id,
            Ticket.status == TicketStatus.aceptado
        )
    ).one() or 0
    
    completed = session.exec(
        select(func.count(Ticket.id)).where(
            Ticket.academic_id == academic_id,
            (Ticket.status == TicketStatus.completado) | (Ticket.status == TicketStatus.solucionado)
        )
    ).one() or 0
    
    rejected = session.exec(
        select(func.count(Ticket.id)).where(
            Ticket.academic_id == academic_id,
            Ticket.status == TicketStatus.rechazado
        )
    ).one() or 0
    
    # Unique students
    unique_students = session.exec(
        select(func.count(func.distinct(Ticket.student_id))).where(
            Ticket.academic_id == academic_id
        )
    ).one() or 0
    
    return {
        "total_tickets": total,
        "pending": pending,
        "responded": responded,
        "accepted": accepted,
        "completed": completed,
        "rejected": rejected,
        "unique_students": unique_students,
        "completion_rate": round((completed / total * 100) if total > 0 else 0, 1)
    }


@router.get("/stats/admin/analytics")
def get_admin_analytics(session: Session = Depends(get_session)):
    """Get advanced analytics for admin dashboard"""
    # 1. Satisfaction Rating (only fully solved tickets)
    avg_rating = session.exec(
        select(func.avg(Ticket.satisfaction_rating)).where(Ticket.status == TicketStatus.solucionado)
    ).one() or 0
    
    # 2. Response Time (Coordinator Response) - in hours
    # We need tickets that have both created_at and responded_at
    tickets_with_response = session.exec(
        select(Ticket).where(Ticket.responded_at != None)
    ).all()
    
    total_response_minutes = 0
    count_response = 0
    
    for t in tickets_with_response:
        delta = t.responded_at - t.created_at
        total_response_minutes += delta.total_seconds() / 60
        count_response += 1
        
    avg_response_hours = round((total_response_minutes / 60 / count_response) if count_response > 0 else 0, 1)

    # 3. Total stats
    total_tickets = session.exec(select(func.count(Ticket.id))).one()
    solved_tickets = session.exec(select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.solucionado)).one()
    
    return {
        "average_satisfaction": round(float(avg_rating), 1) if avg_rating else 0.0,
        "average_response_hours": avg_response_hours,
        "total_tickets": total_tickets,
        "solved_tickets": solved_tickets,
        "resolution_rate": round((solved_tickets / total_tickets * 100) if total_tickets > 0 else 0, 1)
    }


@router.get("/stats/admin/coordinators")
def get_coordinator_analytics(session: Session = Depends(get_session)):
    """Get performance metrics per coordinator"""
    coordinators = session.exec(select(User).where(User.role == "coordinador")).all() # lowercase in DB
    stats = []
    
    for coord in coordinators:
        # Get tickets responded by this coordinator
        tickets = session.exec(select(Ticket).where(Ticket.coordinator_id == coord.id)).all()
        
        count = len(tickets)
        if count == 0:
            stats.append({
                "id": coord.id,
                "name": coord.name,
                "tickets_responded": 0,
                "avg_rating": 0,
                "avg_response_hours": 0
            })
            continue
            
        # Calculate avg rating
        ratings = [t.satisfaction_rating for t in tickets if t.satisfaction_rating]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
        
        # Calculate avg response time
        total_mins = 0
        response_count = 0
        for t in tickets:
            if t.responded_at and t.created_at:
                delta = t.responded_at - t.created_at
                total_mins += delta.total_seconds() / 60
                response_count += 1
                
        avg_hours = round((total_mins / 60 / response_count), 1) if response_count > 0 else 0.0
        
        stats.append({
            "id": coord.id,
            "name": coord.name,
            "tickets_responded": count,
            "avg_rating": avg_rating,
            "avg_response_hours": avg_hours
        })
        
    return stats


@router.get("/stats/admin/academics")
def get_academic_analytics(session: Session = Depends(get_session)):
    """Get performance metrics per academic"""
    academics = session.exec(select(User).where(User.role == UserRole.ACADEMICO)).all()
    stats = []
    
    for acad in academics:
        # Get tickets assigned to this academic
        tickets = session.exec(select(Ticket).where(Ticket.academic_id == acad.id)).all()
        
        total = len(tickets)
        if total == 0:
            stats.append({
                "id": acad.id,
                "name": acad.name,
                "tickets_assigned": 0,
                "tickets_resolved": 0,
                "resolution_rate": 0,
                "avg_rating": 0,
                "avg_response_hours": 0,
                "current_backlog": 0
            })
            continue

        # Resolved: Solucionado or Completado
        resolved_count = sum(1 for t in tickets if t.status in [TicketStatus.solucionado, TicketStatus.completado])
        resolution_rate = round((resolved_count / total * 100), 1)
        
        # Backlog: Pendiente or Derivado (waiting for action)
        backlog_count = sum(1 for t in tickets if t.status in [TicketStatus.pendiente, TicketStatus.derivado])
        
        # Rating (only from rated tickets)
        ratings = [t.satisfaction_rating for t in tickets if t.satisfaction_rating]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
        
        # Response Time (hours)
        response_times = []
        for t in tickets:
            if t.responded_at and t.created_at:
                 delta = t.responded_at - t.created_at
                 response_times.append(delta.total_seconds() / 3600)
        
        avg_response_hours = round(sum(response_times) / len(response_times), 1) if response_times else 0.0
        
        stats.append({
            "id": acad.id,
            "name": acad.name,
            "tickets_assigned": total,
            "tickets_resolved": resolved_count,
            "resolution_rate": resolution_rate,
            "avg_rating": avg_rating,
            "avg_response_hours": avg_response_hours,
            "current_backlog": backlog_count
        })
        
    return stats


# ========== COURSE ENDPOINTS ==========

@router.post("/courses", response_model=CourseResponse)
def create_course(
    course_data: CourseCreate,
    academic_id: int,
    session: Session = Depends(get_session)
):
    """Create a new course for an academic"""
    course = Course(
        name=course_data.name,
        code=course_data.code,
        academic_id=academic_id,
        semester=course_data.semester,
    )
    session.add(course)
    session.commit()
    session.refresh(course)
    return course


@router.get("/courses/academic/{academic_id}", response_model=list[CourseResponse])
def get_academic_courses(academic_id: int, session: Session = Depends(get_session)):
    """Get all courses for an academic"""
    courses = session.exec(
        select(Course).where(Course.academic_id == academic_id)
    ).all()
    
    result = []
    for c in courses:
        count = session.exec(select(func.count(StudentCourse.id)).where(StudentCourse.course_id == c.id)).one()
        response = CourseResponse(
            id=c.id, name=c.name, code=c.code, 
            academic_id=c.academic_id, semester=c.semester, 
            student_count=count
        )
        result.append(response)
        
    return result


@router.get("/courses/{course_id}/students", response_model=list[UserResponse])
def get_course_students(course_id: int, session: Session = Depends(get_session)):
    """Get all students enrolled in a course"""
    links = session.exec(select(StudentCourse).where(StudentCourse.course_id == course_id)).all()
    student_ids = [link.student_id for link in links]
    
    if not student_ids:
        return []
        
    students = session.exec(select(User).where(User.id.in_(student_ids))).all()
    # Convert manually to avoid password leak if any issues, though UserResponse handles it
    return [UserResponse(**s.dict()) for s in students]


@router.post("/courses/{course_id}/students")
def assign_student_to_course(
    course_id: int,
    body: AssignStudentRequest,
    session: Session = Depends(get_session)
):
    """Assign a student to a course (Coordinator/Admin)"""
    # 1. Verify Course
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
        
    # 2. Verify Student
    student = session.exec(select(User).where(User.email == body.student_email)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    if student.role != UserRole.ESTUDIANTE:
        raise HTTPException(status_code=400, detail="El usuario no es un estudiante")
        
    # 3. Check if already enrolled
    existing = session.exec(
        select(StudentCourse).where(
            StudentCourse.course_id == course_id,
            StudentCourse.student_id == student.id
        )
    ).first()
    
    if existing:
        return {"message": "El estudiante ya está inscrito en este curso"}
        
    # 4. Enroll
    link = StudentCourse(course_id=course_id, student_id=student.id)
    session.add(link)
    session.commit()
    
    return {"message": "Estudiante inscrito exitosamente", "student": student.name}


# ========== ACADEMICS LIST ==========

@router.get("/academics", response_model=list)
def list_academics(session: Session = Depends(get_session)):
    """List all academics (for student to select)"""
    academics = session.exec(
        select(User).where(User.role == UserRole.ACADEMICO)
    ).all()
    return [{"id": a.id, "name": a.name, "email": a.email} for a in academics]


# ========== COORDINATOR ENDPOINTS ==========

@router.put("/tickets/{ticket_id}/respond")
def coordinator_respond_ticket(
    ticket_id: int,
    body: RespondRequest,
    session: Session = Depends(get_session)
):
    """Coordinator responds to a ticket"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    print(f"DEBUG: Responding to ticket {ticket_id} by coordinator {body.coordinator_id}")
    try:
        ticket.coordinator_response = body.response
        ticket.coordinator_id = body.coordinator_id # Save who responded
        ticket.responded_at = datetime.utcnow()
        ticket.status = TicketStatus.respondido
        ticket.updated_at = datetime.utcnow()
        
        # Save message to chat history
        message = TicketMessage(
            ticket_id=ticket_id,
            sender_id=body.coordinator_id,
            sender_role=MessageSenderRole.COORDINADOR,
            content=body.response,
            is_system_message=False
        )
        session.add(message)
        
        print(f"DEBUG: Status set to {ticket.status}")
        
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        print("DEBUG: Commit successful")
        
        # Notify Student
        from app.models.notification import Notification
        notification = Notification(
            user_id=ticket.student_id,
            title="Ticket Respondido",
            message=f"La coordinación ha respondido a tu ticket: {ticket.title}",
            type="ticket",
            related_id=ticket.id
        )
        session.add(notification)
        session.commit()
        
        return enrich_ticket_response(ticket, session)
    except Exception as e:
        print(f"ERROR in coordinator_respond_ticket: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.put("/tickets/{ticket_id}/resolve")
def student_resolve_ticket(
    ticket_id: int,
    rating: int = 5,
    comment: str = None,
    session: Session = Depends(get_session)
):
    """Student marks ticket as solved and provides satisfaction rating"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Allow resolving tickets that are respondido, derivado, pendiente, solucionado, or completado
    allowed_statuses = [TicketStatus.respondido, TicketStatus.derivado, TicketStatus.pendiente, TicketStatus.solucionado, TicketStatus.completado]
    if ticket.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="El ticket no puede ser resuelto en su estado actual")
    
    ticket.satisfaction_rating = min(max(rating, 1), 5)  # Clamp between 1-5
    ticket.satisfaction_comment = comment
    ticket.resolved_at = datetime.utcnow()
    ticket.status = TicketStatus.solucionado
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    return enrich_ticket_response(ticket, session)


@router.put("/tickets/{ticket_id}/reopen")
def student_reopen_ticket(
    ticket_id: int,
    body: ReopenRequest,
    session: Session = Depends(get_session)
):
    """Student reopens a ticket if response didn't help"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    allowed_statuses = [TicketStatus.respondido, TicketStatus.solucionado, TicketStatus.completado]
    if ticket.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="El ticket no se puede reabrir en su estado actual")
        
    # Check limit (max 2 reopens)
    if ticket.reopen_count >= 2:
        raise HTTPException(status_code=400, detail="Has alcanzado el límite de 2 reaperturas para este ticket. Por favor crea un nuevo ticket si persiste la duda.")
    
    # Update date to now so it appears as a new/recent ticket for the coordinator
    now = datetime.now()
    ticket.proposed_date = now
    ticket.updated_at = datetime.utcnow()
    
    # Unarchive if it was hidden
    ticket.is_archived = False
    

    # Append new question to description
    timestamp = now.strftime("%d/%m/%Y %H:%M")
    
    # Capture previous interaction context if it exists (coordinator response)
    if ticket.coordinator_response:
        # Check if we already appended this response to avoid duplication
        # (Naive check: if description ends with the response)
        # Better: Check if "Respuesta Anterior" is already in description with the same content?
        # Let's just append if ticket.coordinator_response is NOT empty.
        # Ideally, we should check if the last block of description is NOT the same response.
        
        coord_name = "Coordinación"
        if ticket.coordinator_id:
            coord = session.get(User, ticket.coordinator_id)
            if coord:
                coord_name = coord.name
        
        response_block = f"\n\n--- 💬 Respuesta Anterior de {coord_name} ---\n{ticket.coordinator_response}"
        
        if response_block not in ticket.description: 
             ticket.description += response_block
        
        # Clear current response field to indicate pending state
        ticket.coordinator_response = None 
        ticket.responded_at = None

    # Append the student's new reason/question
    reopen_block = f"\n\n--- ↩️ Reabierto por estudiante el {timestamp} ---\n{body.reason}"
    if reopen_block not in ticket.description:
        ticket.description += reopen_block
    
    # Increment reopen count
    ticket.reopen_count += 1
    
    # Reset status
    if ticket.escalated_to_academic:
        ticket.status = TicketStatus.derivado
    else:
        ticket.status = TicketStatus.pendiente
        
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    return enrich_ticket_response(ticket, session)


@router.put("/tickets/{ticket_id}/escalate")
def coordinator_escalate_ticket(
    ticket_id: int,
    body: EscalateRequest,
    session: Session = Depends(get_session)
):
    """Coordinator escalates ticket to a professor"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    academic = session.get(User, body.academic_id)
    if not academic or academic.role != UserRole.ACADEMICO:
        raise HTTPException(status_code=404, detail="Académico no encontrado")
    
    ticket.academic_id = body.academic_id
    ticket.escalated_to_academic = True
    ticket.escalation_note = body.note
    ticket.coordinator_id = body.coordinator_id # Save who escalated
    ticket.status = TicketStatus.derivado
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Notify Academic
    from app.models.notification import Notification
    notification = Notification(
        user_id=ticket.academic_id,
        title="Ticket Escalado",
        message=f"Se te ha derivado un ticket del estudiante ID {ticket.student_id}: {ticket.title}",
        type="ticket",
        related_id=ticket.id
    )
    session.add(notification)
    session.commit()
    
    return enrich_ticket_response(ticket, session)


@router.get("/tickets/filter")
def filter_tickets(
    year: str = None,
    ticket_type: str = None, 
    status: str = None,
    session: Session = Depends(get_session)
):
    """Filter tickets by year, type, and status (for coordinators)"""
    # Start with all tickets
    query = select(Ticket)
    
    # We need to join with User to filter by year
    tickets = session.exec(query.order_by(Ticket.created_at.desc())).all()
    
    result = []
    for ticket in tickets:
        enriched = enrich_ticket_response(ticket, session)
        
        # Apply filters
        if year and enriched.get("student_year") != year:
            continue
        if ticket_type and ticket.ticket_type != ticket_type:
            continue
        if status and ticket.status.value != status:
            continue
            
        result.append(enriched)
    
    return result


@router.get("/stats/coordinator")
def get_coordinator_stats(session: Session = Depends(get_session)):
    """Get overall statistics for coordinator dashboard"""
    # Total tickets
    total = session.exec(select(func.count(Ticket.id))).one() or 0
    
    # By status
    pending = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status == "pendiente")
    ).one() or 0
    
    responded = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status == "respondido")
    ).one() or 0
    
    solved = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status == "solucionado")
    ).one() or 0
    
    escalated = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status == "derivado")
    ).one() or 0
    
    completed = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status == "completado")
    ).one() or 0
    
    # Students by year
    students = session.exec(select(User).where(User.role == UserRole.ESTUDIANTE)).all()
    year_counts = {"1": 0, "2": 0, "3": 0, "4": 0}
    for s in students:
        if s.year in year_counts:
            year_counts[s.year] += 1
    
    # By type (for pending tickets)
    pending_tickets = session.exec(
        select(Ticket).where(Ticket.status == "pendiente")
    ).all()
    type_counts = {}
    for t in pending_tickets:
        type_name = t.ticket_type
        type_counts[type_name] = type_counts.get(type_name, 0) + 1
    
    # Avg satisfaction
    solved_tickets = session.exec(
        select(Ticket).where(Ticket.status == "solucionado")
    ).all()
    ratings = [t.satisfaction_rating for t in solved_tickets if t.satisfaction_rating]
    avg_satisfaction = round(sum(ratings) / len(ratings), 1) if ratings else 0
    
    return {
        "total_tickets": total,
        "pending": pending,
        "responded": responded,
        "solved": solved,
        "escalated": escalated,
        "completed": completed,
        "students_by_year": year_counts,
        "pending_by_type": type_counts,
        "avg_satisfaction": avg_satisfaction
    }


@router.get("/stats/admin")
def get_admin_stats(session: Session = Depends(get_session)):
    """Get comprehensive statistics for admin analytics dashboard"""
    # Total counts
    total_tickets = session.exec(select(func.count(Ticket.id))).one() or 0
    total_users = session.exec(select(func.count(User.id))).one() or 0
    
    # By status
    status_counts = {}
    for status in TicketStatus:
        count = session.exec(
            select(func.count(Ticket.id)).where(Ticket.status == status)
        ).one() or 0
        status_counts[status.value] = count
    
    # By role
    role_counts = {}
    for role in [UserRole.ESTUDIANTE, UserRole.ACADEMICO, UserRole.COORDINADOR, UserRole.ADMIN]:
        count = session.exec(
            select(func.count(User.id)).where(User.role == role.value)
        ).one() or 0
        role_counts[role.value] = count
    
    # Satisfaction analysis
    solved_tickets = session.exec(
        select(Ticket).where(Ticket.satisfaction_rating.is_not(None))
    ).all()
    ratings = [t.satisfaction_rating for t in solved_tickets]
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in ratings:
        if r in rating_distribution:
            rating_distribution[r] += 1
    avg_satisfaction = round(sum(ratings) / len(ratings), 2) if ratings else 0
    
    # Escalation rate
    total_responded = status_counts.get('respondido', 0) + status_counts.get('solucionado', 0)
    escalated_count = status_counts.get('derivado', 0)
    escalation_rate = round((escalated_count / total_tickets * 100) if total_tickets > 0 else 0, 1)
    
    # Resolution rate
    solved_count = status_counts.get('solucionado', 0)
    resolution_rate = round((solved_count / total_tickets * 100) if total_tickets > 0 else 0, 1)
    
    return {
        "total_tickets": total_tickets,
        "total_users": total_users,
        "status_counts": status_counts,
        "role_counts": role_counts,
        "avg_satisfaction": avg_satisfaction,
        "rating_distribution": rating_distribution,
        "escalation_rate": escalation_rate,
        "resolution_rate": resolution_rate
    }

