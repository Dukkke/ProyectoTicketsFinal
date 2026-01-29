"""
Justifications module for the Tickets UAH system.
Handles absence justification submissions, approval, and professor derivation.
Beta feature for presencial students only.
"""
import os
import shutil
from datetime import datetime
from typing import List, Optional
import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.user import User, UserRole, REMOTA_COORDINATOR_EMAIL
from app.models.justification import Justification, JustificationStatus, JustificationProfessor
from app.schemas.justification import (
    JustificationCreate, JustificationResponse, JustificationReject,
    JustificationListResponse, StudentInfo
)

# Create router
router = APIRouter(prefix="/api/justifications", tags=["Justifications"])

# Upload directory for justification documents
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "uploads", "justifications")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_student_info(user: User) -> StudentInfo:
    """Convert User to StudentInfo for responses"""
    return StudentInfo(
        id=user.id,
        name=user.name,
        email=user.email,
        paternal_surname=user.paternal_surname,
        maternal_surname=user.maternal_surname,
        rut=user.rut,
        phone=user.phone,
        admission_year=user.admission_year,
        program=user.program
    )


# ========== STUDENT ENDPOINTS ==========

@router.get("/student/{student_id}", response_model=JustificationListResponse)
def get_student_justifications(student_id: int, session: Session = Depends(get_session)):
    """Get all justifications for a student"""
    justifications = session.exec(
        select(Justification)
        .where(Justification.student_id == student_id)
        .order_by(Justification.created_at.desc())
    ).all()
    
    items = []
    for j in justifications:
        # Get professor IDs
        prof_links = session.exec(
            select(JustificationProfessor)
            .where(JustificationProfessor.justification_id == j.id)
        ).all()
        prof_ids = [pl.professor_id for pl in prof_links]
        
        response = JustificationResponse.model_validate(j)
        response.professor_ids = prof_ids
        items.append(response)
    
    return JustificationListResponse(items=items, total=len(items))

@router.post("", response_model=JustificationResponse)
async def create_justification(
    absence_reason: str = Form(...),
    absence_start_date: str = Form(...),
    absence_end_date: str = Form(...),
    affected_courses: str = Form(...),
    professor_ids: str = Form(...),  # Comma-separated IDs
    documents: List[UploadFile] = File(...), # Changed to List
    student_id: int = Form(...),
    session: Session = Depends(get_session)
):
    """Create a new absence justification with document upload"""
    
    # Validate student exists and is presencial
    student = session.get(User, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Check modality - only presencial students
    if student.modality and student.modality.lower() == "remota":
        raise HTTPException(status_code=403, detail="Esta función solo está disponible para estudiantes presenciales")
    
    # Parse dates
    try:
        start_date = datetime.fromisoformat(absence_start_date.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(absence_end_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")
    
    # Parse professor IDs
    try:
        prof_ids = [int(x.strip()) for x in professor_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="IDs de profesores inválidos")
    
    # Save uploaded documents
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    saved_filenames = []
    saved_paths = []

    for doc in documents:
        # Sanitize filename
        sanitized_name = "".join([c if c.isalnum() or c in "._-" else "_" for c in doc.filename])
        safe_filename = f"{student_id}_{timestamp}_{sanitized_name}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as f:
            shutil.copyfileobj(doc.file, f)
        
        saved_filenames.append(doc.filename)
        saved_paths.append(safe_filename)
    
    # Serialize to JSON if multiple, or keep single if just one (for backward compat? No, let's use list)
    # Actually, legacy rows have strings. New rows will have JSON lists.
    # Frontend needs to handle both.
    
    document_filename_json = json.dumps(saved_filenames)
    document_path_json = json.dumps(saved_paths)

    # Create justification
    justification = Justification(
        student_id=student_id,
        absence_reason=absence_reason,
        absence_start_date=start_date,
        absence_end_date=end_date,
        affected_courses=affected_courses,
        document_filename=document_filename_json,
        document_path=document_path_json,
        status=JustificationStatus.PENDIENTE
    )
    
    session.add(justification)
    session.commit()
    session.refresh(justification)
    
    # Add professor relationships
    for prof_id in prof_ids:
        jp = JustificationProfessor(
            justification_id=justification.id,
            professor_id=prof_id
        )
        session.add(jp)
    session.commit()
    
    # Notify Coordinator about new justification
    from app.models.notification import Notification
    
    # Determine which coordinator to notify based on student modality
    is_remota = (student.modality and student.modality.lower() == "remota")
    
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
        notification = Notification(
            user_id=target_coordinator.id,
            title="Nuevo Justificativo",
            message=f"El estudiante {student.name} ha enviado un nuevo justificativo de ausencia.",
            type="justification",
            related_id=justification.id
        )
        session.add(notification)
        session.commit()
    
    response = JustificationResponse.model_validate(justification)
    response.student = get_student_info(student)
    response.professor_ids = prof_ids
    return response

@router.get("/pending", response_model=JustificationListResponse)
def get_pending_justifications(coordinator_email: str, session: Session = Depends(get_session)):
    """Get all pending justifications for the coordinator's modality"""
    
    statement = select(Justification).where(Justification.status == JustificationStatus.PENDIENTE)
    justifications = session.exec(statement).all()
    
    items = []
    for j in justifications:
        student = session.get(User, j.student_id)
        if not student:
            continue
            
        # Filter by modality if needed
        # Diurna coord sees Diurna students. Remota coord sees Remota students.
        # margarita@uahurtado.cl is likely Diurna
        is_remota_coord = (coordinator_email == REMOTA_COORDINATOR_EMAIL)
        is_student_remota = (student.modality and student.modality.lower() == "remota")
        
        if is_remota_coord != is_student_remota:
            continue

        # Get professor IDs
        prof_links = session.exec(
            select(JustificationProfessor)
            .where(JustificationProfessor.justification_id == j.id)
        ).all()
        prof_ids = [pl.professor_id for pl in prof_links]
        
        response = JustificationResponse.model_validate(j)
        response.student = get_student_info(student)
        response.professor_ids = prof_ids
        items.append(response)
    
    return JustificationListResponse(items=items, total=len(items))

@router.put("/{justification_id}/approve")
def approve_justification(
    justification_id: int,
    coordinator_id: int,
    session: Session = Depends(get_session)
):
    """Approve a justification and notify professors"""
    
    justification = session.get(Justification, justification_id)
    if not justification:
        raise HTTPException(status_code=404, detail="Justificativo no encontrado")
    
    if justification.status != JustificationStatus.PENDIENTE:
        raise HTTPException(status_code=400, detail="Este justificativo ya fue procesado")
    
    # Update status
    justification.status = JustificationStatus.APROBADO
    justification.coordinator_id = coordinator_id
    justification.reviewed_at = datetime.utcnow()
    justification.updated_at = datetime.utcnow()
    
    # Get professors
    profs_rels = session.exec(
        select(JustificationProfessor)
        .where(JustificationProfessor.justification_id == justification_id)
    ).all()
    
    from app.models.notification import Notification
    
    # Notify Student
    notification = Notification(
        user_id=justification.student_id,
        title="Justificativo Aprobado",
        message=f"Tu justificativo para {justification.affected_courses} ha sido aprobado.",
        type="justification",
        related_id=justification.id
    )
    session.add(notification)

    # Notify Professors & Log Email
    for jp in profs_rels:
        jp.notified_at = datetime.utcnow()
        
        # Notify in App
        prof_notification = Notification(
            user_id=jp.professor_id,
            title="Nuevo Justificativo Asignado",
            message=f"Se le ha derivado un justificativo para el estudiante ID {justification.student_id}.",
            type="justification_assigned",
            related_id=justification.id
        )
        session.add(prof_notification)

        # Log Email (Simulation)
        try:
            professor = session.get(User, jp.professor_id)
            if professor:
                with open("emails.log", "a", encoding="utf-8") as log:
                    log.write(f"\n--- MAIL TO: {professor.email} ---\n")
                    log.write(f"Subject: Justificativo Aprobado - Estudiante {justification.student_id}\n")
                    log.write(f"Estimado/a Prof. {professor.name},\n")
                    log.write(f"Se ha aprobado el justificativo del estudiante.\n")
                    log.write(f"Motivo: {justification.absence_reason}\n")
                    log.write(f"Fechas: {justification.absence_start_date} - {justification.absence_end_date}\n")
                    log.write("----------------------------------\n")
        except Exception as e:
            print(f"Error logging email: {e}")
    
    session.commit()
    
    return {"ok": True, "message": "Justificativo aprobado y derivado a profesores"}


@router.put("/{justification_id}/professors")
def update_justification_professors(
    justification_id: int,
    professor_ids: List[int],
    session: Session = Depends(get_session)
):
    """Update assigned professors for a justification"""
    justification = session.get(Justification, justification_id)
    if not justification:
        raise HTTPException(status_code=404, detail="Justificativo no encontrado")
    
    # Remove existing associations
    existing_rels = session.exec(
        select(JustificationProfessor)
        .where(JustificationProfessor.justification_id == justification_id)
    ).all()
    
    for rel in existing_rels:
        session.delete(rel)
    
    # Add new associations
    for prof_id in professor_ids:
        jp = JustificationProfessor(
            justification_id=justification.id,
            professor_id=prof_id
        )
        session.add(jp)
        
    session.commit()
    
    return {"ok": True, "message": "Profesores actualizados correctamente"}


@router.put("/{justification_id}/reject")
def reject_justification(
    justification_id: int,
    coordinator_id: int,
    rejection: JustificationReject,
    session: Session = Depends(get_session)
):
    """Reject a justification with reason"""
    
    justification = session.get(Justification, justification_id)
    if not justification:
        raise HTTPException(status_code=404, detail="Justificativo no encontrado")
    
    if justification.status != JustificationStatus.PENDIENTE:
        raise HTTPException(status_code=400, detail="Este justificativo ya fue procesado")
    
    # Update status
    justification.status = JustificationStatus.RECHAZADO
    justification.coordinator_id = coordinator_id
    justification.reviewed_at = datetime.utcnow()
    justification.rejection_reason = rejection.rejection_reason
    justification.updated_at = datetime.utcnow()
    
    # Notify Student
    from app.models.notification import Notification
    notification = Notification(
        user_id=justification.student_id,
        title="Justificativo Rechazado",
        message=f"Tu justificativo ha sido rechazado. Razón: {rejection.rejection_reason}",
        type="justification",
        related_id=justification.id
    )
    session.add(notification)
    
    session.commit()
    
    return {"ok": True, "message": "Justificativo rechazado"}


# ========== PROFESSOR ENDPOINTS ==========

@router.get("/professor/{professor_id}", response_model=JustificationListResponse)
def get_professor_justifications(professor_id: int, session: Session = Depends(get_session)):
    """Get approved justifications assigned to a professor"""
    
    # Get justification IDs for this professor
    jp_records = session.exec(
        select(JustificationProfessor)
        .where(JustificationProfessor.professor_id == professor_id)
    ).all()
    
    justification_ids = [jp.justification_id for jp in jp_records]
    
    if not justification_ids:
        return JustificationListResponse(items=[], total=0)
    
    # Get approved justifications
    justifications = session.exec(
        select(Justification)
        .where(Justification.id.in_(justification_ids))
        .where(Justification.status == JustificationStatus.APROBADO)
        .order_by(Justification.reviewed_at.desc())
    ).all()
    
    items = []
    for j in justifications:
        student = session.get(User, j.student_id)
        response = JustificationResponse.model_validate(j)
        if student:
            response.student = get_student_info(student)
        response.professor_ids = [professor_id]
        items.append(response)
    
    return JustificationListResponse(items=items, total=len(items))


@router.put("/professor/{professor_id}/view/{justification_id}")
def mark_justification_viewed(
    professor_id: int,
    justification_id: int,
    session: Session = Depends(get_session)
):
    """Mark a justification as viewed by professor"""
    
    jp = session.exec(
        select(JustificationProfessor)
        .where(JustificationProfessor.professor_id == professor_id)
        .where(JustificationProfessor.justification_id == justification_id)
    ).first()
    
    if not jp:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    
    jp.viewed_at = datetime.utcnow()
    session.commit()
    
    return {"ok": True}


# ========== FILE DOWNLOAD ==========

@router.get("/document/{filename}")
def get_document(filename: str):
    """Get a justification document by filename - Opens in browser instead of downloading"""
    from fastapi.responses import FileResponse
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # Return file with inline disposition to open in browser instead of downloading
    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )
