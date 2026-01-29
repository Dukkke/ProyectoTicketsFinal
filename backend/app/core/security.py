# app/core/security.py
"""
Utilidades de seguridad - Hashing de contraseñas y JWT.
"""

from datetime import datetime, timedelta
from typing import Optional, Any
import jwt
import bcrypt

from app.core.config import settings


# ═══════════════════════════════════════════════════════════════
# HASHING DE CONTRASEÑAS (Compatible con hashes existentes)
# ═══════════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """
    Hashea una contraseña con bcrypt.
    Compatible con los hashes existentes en la base de datos.
    """
    password_bytes = password.encode('utf-8')[:72]  # bcrypt limit
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash.
    Compatible con los hashes existentes en la base de datos.
    """
    password_bytes = plain_password.encode('utf-8')[:72]
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except (Exception, BaseException):
        return False


# ═══════════════════════════════════════════════════════════════
# JWT TOKENS
# ═══════════════════════════════════════════════════════════════

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un token JWT de acceso.
    
    Args:
        data: Datos a codificar en el token
        expires_delta: Tiempo de expiración
        
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica un token JWT.
    
    Args:
        token: Token JWT a decodificar
        
    Returns:
        Datos del token o None si es inválido
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_data(token: str, key: str) -> Optional[Any]:
    """
    Obtiene un dato específico del token.
    
    Args:
        token: Token JWT
        key: Clave a obtener
        
    Returns:
        Valor de la clave o None
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get(key)
    return None
