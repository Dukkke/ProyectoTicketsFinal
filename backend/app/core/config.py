# app/core/config.py
"""
Configuración centralizada de la aplicación.
Sigue el patrón 12-Factor App para configuración via variables de entorno.
"""

import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Configuración de la aplicación."""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # API
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # App
    APP_NAME: str = "Sistema de Tickets UAH"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB
    
    @property
    def is_production(self) -> bool:
        """Verifica si estamos en producción."""
        return not self.DEBUG


@lru_cache()
def get_settings() -> Settings:
    """
    Obtiene la configuración.
    Usa caché para evitar recrear el objeto en cada llamada.
    """
    return Settings()


# Instancia global
settings = get_settings()
