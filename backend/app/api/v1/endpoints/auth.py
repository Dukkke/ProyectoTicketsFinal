"""
Authentication module for the Tickets UAH system.
Handles user registration and login with password hashing.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.database import get_session
from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole, REMOTA_COORDINATOR_EMAIL
from app.models.ticket import Ticket
from app.models.course import Course
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate
from app.services import UserService, AuthService


# Create router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Register a new user (student or academic).
    Only institutional emails allowed:
    - Students: @alumnos.uahurtado.cl
    - Academics/Coordinators: @uahurtado.cl
    """
    # Validate institutional email domain
    email_lower = user_data.email.lower()
    
    if user_data.role == UserRole.ESTUDIANTE:
        if not email_lower.endswith('@alumnos.uahurtado.cl'):
            raise HTTPException(
                status_code=400,
                detail="Los estudiantes deben usar su correo institucional @alumnos.uahurtado.cl"
            )
    elif user_data.role in [UserRole.ACADEMICO, UserRole.COORDINADOR]:
        if not email_lower.endswith('@uahurtado.cl'):
            raise HTTPException(
                status_code=400,
                detail="Los académicos y coordinadores deben usar su correo institucional @uahurtado.cl"
            )
    
    # Check if email already exists
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya está registrado"
        )
    
    # Validate password strength
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    # Normalize role to match PostgreSQL enum values
    # DB has: ESTUDIANTE, ACADEMICO (uppercase), coordinador (lowercase)
    role_mapping = {
        'estudiante': 'ESTUDIANTE',
        'academico': 'ACADEMICO',
        'coordinador': 'coordinador',  # stays lowercase
        'admin': 'ADMIN'
    }
    normalized_role = role_mapping.get(user_data.role.lower(), user_data.role.upper())
    
    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        role=normalized_role,
        year=user_data.year,  # Store student year
        password_hash=hash_password(user_data.password)
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    """
    Login with email and password.
    """
    try:
        print(f"DEBUG LOGIN ATTEMPT: {credentials.email}")
        # Find user by email
        user = session.exec(
            select(User).where(User.email == credentials.email)
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Correo electrónico o contraseña incorrectos"
            )
        
        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Correo electrónico o contraseña incorrectos"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}"
        )


@router.get("/users", response_model=list[UserResponse])
def list_users(
    coordinator_email: str = None,
    session: Session = Depends(get_session)
):
    """
    List registered users.
    If coordinator_email is provided, filters students based on modality:
    - Giannina: Only Modalidad Remota students
    - Others: Only Diurna (non-Remota) students
    - All: See all Academics/Coordinators
    """
    users = session.exec(select(User)).all()
    
    if coordinator_email:
        is_giannina = coordinator_email.lower() == REMOTA_COORDINATOR_EMAIL.lower()
        filtered_users = []
        
        for user in users:
            # Check filtering rules for Students AND Academics
            if user.role in ["ESTUDIANTE", "ACADEMICO"]: 
                # Determine modality (default to Diurna if not set)
                user_modality = (user.modality or "Diurna").lower()
                is_remota = user_modality == "modalidad remota" or user_modality == "vespertina"
                
                if is_giannina:
                    # Giannina only sees Remota users
                    if is_remota:
                        filtered_users.append(user)
                else:
                    # Others see only Diurna users
                    if not is_remota:
                        filtered_users.append(user)
            else:
                # Coordinators and Admins are visible to all (or handle separately if needed)
                filtered_users.append(user)
                
        return filtered_users

    return users


@router.post("/users", response_model=UserResponse)
def admin_create_user(
    user_data: UserCreate, 
    session: Session = Depends(get_session),
    x_requesting_role: str | None = Header(default=None, alias="X-Requesting-Role"),
    x_requesting_email: str | None = Header(default=None, alias="X-Requesting-Email")
):
    """
    Create a new user from admin panel.
    Enforces modality based on coordinator email if applicable.
    """
    # Check if email already exists
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya está registrado"
        )
    
    # Normalize role
    role_mapping = {
        'estudiante': 'ESTUDIANTE',
        'academico': 'ACADEMICO',
        'coordinador': 'coordinador',
        'admin': 'ADMIN'
    }
    normalized_role = role_mapping.get(user_data.role.lower(), user_data.role.upper())
    
    # Permission check for Coordinators
    if x_requesting_role and x_requesting_role.lower() == 'coordinador':
        if normalized_role in ['ADMIN', 'coordinador']:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para crear administradores o coordinadores."
            )
        
        # Enforce Modality for Students based on Coordinator
        if normalized_role == 'ESTUDIANTE':
            is_giannina = x_requesting_email and x_requesting_email.lower() == REMOTA_COORDINATOR_EMAIL.lower()
            if is_giannina:
                user_data.modality = 'Modalidad Remota'
            else:
                user_data.modality = 'Diurna' # Force Diurna for other coordinators
    
    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        role=normalized_role,
        year=user_data.year,
        rut=user_data.rut,
        password_hash=hash_password(user_data.password),
        must_change_password=True,
        modality=user_data.modality # Use the enforced or provided modality
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, session: Session = Depends(get_session)):
    """
    Get a specific user by ID.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, session: Session = Depends(get_session)):
    """
    Update a user's information (admin only).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Update only provided fields
    if user_data.email is not None:
        # Check if new email is already taken by another user
        existing = session.exec(
            select(User).where(User.email == user_data.email, User.id != user_id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        user.email = user_data.email
    
    if user_data.name is not None:
        user.name = user_data.name
    
    if user_data.role is not None:
        user.role = user_data.role
    
    # Profile fields for coordinators
    if user_data.year is not None:
        user.year = user_data.year
    if user_data.rut is not None:
        user.rut = user_data.rut
    if user_data.profile_photo is not None:
        user.profile_photo = user_data.profile_photo
    if user_data.phone is not None:
        user.phone = user_data.phone
    if user_data.office is not None:
        user.office = user_data.office
    if user_data.bio is not None:
        user.bio = user_data.bio
    
    # Extended profile fields for students
    if user_data.paternal_surname is not None:
        user.paternal_surname = user_data.paternal_surname
    if user_data.maternal_surname is not None:
        user.maternal_surname = user_data.maternal_surname
    if user_data.personal_email is not None:
        user.personal_email = user_data.personal_email
    if user_data.emergency_phone is not None:
        user.emergency_phone = user_data.emergency_phone
    if user_data.admission_year is not None:
        user.admission_year = user_data.admission_year
    if user_data.program is not None:
        user.program = user_data.program
    if user_data.modality is not None:
        user.modality = user_data.modality
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    session: Session = Depends(get_session),
    x_requesting_role: str | None = Header(default=None, alias="X-Requesting-Role")
):
    """
    Delete a user.
    - Admins can delete anyone.
    - Coordinators can delete Students and Academics only.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Permission check
    if x_requesting_role and x_requesting_role.lower() == 'coordinador':
        if user.role in [UserRole.ADMIN, UserRole.COORDINADOR]:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para eliminar administradores o coordinadores."
            )
    
    # Delete related tickets (as student or academic)
    tickets = session.exec(select(Ticket).where((Ticket.student_id == user_id) | (Ticket.academic_id == user_id))).all()
    for ticket in tickets:
        session.delete(ticket)
        
    # Delete related courses (as academic) - check if Course model is imported
    # Assuming explicit deletion to be safe
    courses = session.exec(select(Course).where(Course.academic_id == user_id)).all()
    for course in courses:
        session.delete(course)

    session.delete(user)
    session.commit()
    return {"message": "Usuario eliminado exitosamente", "id": user_id}


class PasswordReset(BaseModel):
    """Schema for password reset (admin only)."""
    new_password: str


class OnboardingPasswordChange(BaseModel):
    """Schema for first-time password change during onboarding."""
    new_password: str
    

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength. Returns (is_valid, error_message).
    Requirements:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
    """
    import re
    
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe tener al menos una letra mayúscula"
    
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe tener al menos una letra minúscula"
    
    if not re.search(r'\d', password):
        return False, "La contraseña debe tener al menos un número"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`~]', password):
        return False, "La contraseña debe tener al menos un carácter especial (!@#$%^&*...)"
    
    return True, ""


@router.put("/users/{user_id}/onboarding-password")
def onboarding_password_change(
    user_id: int, 
    password_data: OnboardingPasswordChange, 
    session: Session = Depends(get_session)
):
    """
    Change password during first-time onboarding.
    Does not require current password (user has a temporary one).
    Requires strong password validation.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Only allow if user must change password (first login)
    if not user.must_change_password:
        raise HTTPException(
            status_code=400, 
            detail="Este endpoint solo es válido para el primer cambio de contraseña"
        )
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Update password and clear flag
    user.password_hash = hash_password(password_data.new_password)
    user.must_change_password = False
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {"message": "Contraseña actualizada exitosamente", "user": UserResponse.model_validate(user)}


@router.put("/users/{user_id}/password")
def reset_user_password(user_id: int, password_data: PasswordReset, session: Session = Depends(get_session)):
    """
    Reset a user's password (admin only).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    user.password_hash = hash_password(password_data.new_password)
    session.add(user)
    session.commit()
    
    return {"message": "Contraseña actualizada exitosamente", "id": user_id}

class ChangePasswordSchema(BaseModel):
    """Schema for user changing their own password"""
    email: str
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordSchema, 
    session: Session = Depends(get_session)
):
    """
    Change password for the current user.
    Requires current password for verification.
    """
    # Find user
    user = session.exec(
        select(User).where(User.email == password_data.email)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Verify current password
    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
        
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
        
    # Update password and clear flag
    user.password_hash = hash_password(password_data.new_password)
    user.must_change_password = False
    
    session.add(user)
    session.commit()
    
    return {"message": "Contraseña actualizada exitosamente. Por favor inicie sesión de nuevo."}
