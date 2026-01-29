# app/services/user_service.py
"""
Servicio de Usuarios - Lógica de negocio para gestión de usuarios.
Extraído de scripts/manage_users.py y scripts/create_superuser.py.
"""

from typing import Optional, List
from sqlmodel import Session, select
from passlib.hash import bcrypt

from app.models.user import User, UserRole


class UserService:
    """Servicio para operaciones de usuarios."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create_user(
        self,
        email: str,
        password: str,
        nombre: str,
        apellido: str = "",
        rut: str = "",
        role: UserRole = UserRole.ESTUDIANTE,
        carrera: str = ""
    ) -> User:
        """
        Crea un nuevo usuario.
        
        Args:
            email: Email del usuario
            password: Contraseña sin hashear
            nombre: Nombre del usuario
            apellido: Apellido del usuario
            rut: RUT del usuario
            role: Rol del usuario
            carrera: Carrera (solo para estudiantes)
            
        Returns:
            Usuario creado
            
        Raises:
            ValueError: Si el email ya está registrado
        """
        # Verificar si el email ya existe
        existing = self.get_user_by_email(email)
        if existing:
            raise ValueError(f"El email {email} ya está registrado")
        
        # Hashear contraseña
        hashed_password = bcrypt.hash(password)
        
        user = User(
            email=email.lower().strip(),
            hashed_password=hashed_password,
            nombre=nombre.strip(),
            apellido=apellido.strip(),
            rut=rut.strip(),
            role=role,
            carrera=carrera.strip() if carrera else None
        )
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
    def create_admin(self, email: str, password: str) -> User:
        """
        Crea un usuario administrador/coordinador.
        
        Args:
            email: Email del administrador
            password: Contraseña
            
        Returns:
            Usuario administrador creado
        """
        return self.create_user(
            email=email,
            password=password,
            nombre="Administrador",
            role=UserRole.COORDINADOR
        )
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Obtiene un usuario por su ID."""
        return self.session.get(User, user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Obtiene un usuario por su email."""
        statement = select(User).where(User.email == email.lower().strip())
        return self.session.exec(statement).first()
    
    def get_users_by_role(self, role: UserRole) -> List[User]:
        """Obtiene todos los usuarios con un rol específico."""
        statement = select(User).where(User.role == role)
        return list(self.session.exec(statement).all())
    
    def get_all_students(self) -> List[User]:
        """Obtiene todos los estudiantes."""
        return self.get_users_by_role(UserRole.ESTUDIANTE)
    
    def get_all_academics(self) -> List[User]:
        """Obtiene todos los académicos."""
        return self.get_users_by_role(UserRole.ACADEMICO)
    
    def get_all_coordinators(self) -> List[User]:
        """Obtiene todos los coordinadores."""
        return self.get_users_by_role(UserRole.COORDINADOR)
    
    def update_user(
        self,
        user_id: int,
        **kwargs
    ) -> Optional[User]:
        """
        Actualiza los datos de un usuario.
        
        Args:
            user_id: ID del usuario
            **kwargs: Campos a actualizar
            
        Returns:
            Usuario actualizado o None si no existe
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        # Campos permitidos para actualización
        allowed_fields = {'nombre', 'apellido', 'carrera', 'role'}
        
        for field, value in kwargs.items():
            if field in allowed_fields and value is not None:
                setattr(user, field, value)
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
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
            True si se cambió exitosamente, False si la contraseña actual es incorrecta
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        # Verificar contraseña actual
        if not bcrypt.verify(current_password, user.hashed_password):
            return False
        
        # Hashear nueva contraseña
        user.hashed_password = bcrypt.hash(new_password)
        user.must_change_password = False
        
        self.session.add(user)
        self.session.commit()
        return True
    
    def set_temporary_password(self, user_id: int, temp_password: str) -> bool:
        """
        Establece una contraseña temporal que debe ser cambiada.
        
        Args:
            user_id: ID del usuario
            temp_password: Contraseña temporal
            
        Returns:
            True si se estableció exitosamente
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.hashed_password = bcrypt.hash(temp_password)
        user.must_change_password = True
        
        self.session.add(user)
        self.session.commit()
        return True
    
    def delete_user(self, user_id: int) -> bool:
        """
        Elimina un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            True si se eliminó exitosamente
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        self.session.delete(user)
        self.session.commit()
        return True
    
    def verify_password(self, email: str, password: str) -> Optional[User]:
        """
        Verifica las credenciales de un usuario.
        
        Args:
            email: Email del usuario
            password: Contraseña
            
        Returns:
            Usuario si las credenciales son válidas, None si no
        """
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        if not bcrypt.verify(password, user.hashed_password):
            return None
        
        return user
