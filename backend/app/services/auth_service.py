# app/services/auth_service.py
"""
Servicio de Autenticación - Lógica de negocio para auth.
"""

from typing import Optional
from datetime import datetime, timedelta
from sqlmodel import Session

from app.models.user import User
from app.services.user_service import UserService


class AuthService:
    """Servicio para operaciones de autenticación."""
    
    def __init__(self, session: Session):
        self.session = session
        self.user_service = UserService(session)
    
    def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Autentica un usuario con email y contraseña.
        
        Args:
            email: Email del usuario
            password: Contraseña
            
        Returns:
            Usuario autenticado o None
        """
        return self.user_service.verify_password(email, password)
    
    def register_student(
        self,
        email: str,
        password: str,
        nombre: str,
        apellido: str,
        rut: str,
        carrera: str = ""
    ) -> User:
        """
        Registra un nuevo estudiante.
        
        Args:
            email: Email institucional
            password: Contraseña
            nombre: Nombre
            apellido: Apellido
            rut: RUT
            carrera: Carrera
            
        Returns:
            Usuario estudiante creado
            
        Raises:
            ValueError: Si el email no es institucional o ya existe
        """
        # Validar email institucional
        if not email.endswith('@alumnos.uahurtado.cl'):
            raise ValueError("Estudiantes deben usar correo @alumnos.uahurtado.cl")
        
        from app.models.user import UserRole
        return self.user_service.create_user(
            email=email,
            password=password,
            nombre=nombre,
            apellido=apellido,
            rut=rut,
            role=UserRole.ESTUDIANTE,
            carrera=carrera
        )
    
    def register_academic(
        self,
        email: str,
        password: str,
        nombre: str,
        apellido: str = ""
    ) -> User:
        """
        Registra un nuevo académico.
        
        Args:
            email: Email institucional
            password: Contraseña
            nombre: Nombre
            apellido: Apellido
            
        Returns:
            Usuario académico creado
            
        Raises:
            ValueError: Si el email no es institucional o ya existe
        """
        # Validar email institucional
        if not email.endswith('@uahurtado.cl'):
            raise ValueError("Académicos deben usar correo @uahurtado.cl")
        
        from app.models.user import UserRole
        return self.user_service.create_user(
            email=email,
            password=password,
            nombre=nombre,
            apellido=apellido,
            role=UserRole.ACADEMICO
        )
    
    def user_needs_password_change(self, user: User) -> bool:
        """Verifica si el usuario debe cambiar su contraseña."""
        return getattr(user, 'must_change_password', False)
    
    def change_password(
        self,
        user_id: int,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Cambia la contraseña de un usuario.
        
        Args:
            user_id: ID del usuario
            current_password: Contraseña actual
            new_password: Nueva contraseña
            
        Returns:
            True si se cambió exitosamente
        """
        return self.user_service.change_password(
            user_id, current_password, new_password
        )
