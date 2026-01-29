"""
FastAPI Main Application - Sistema de Tickets UAH
Endpoint principal y conexión a base de datos.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session, text
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.database import init_db, get_session, engine
# Import ALL models to ensure they are registered with SQLModel before creating tables
from app.models.user import User
from app.models.ticket import Ticket, TicketMessage
from app.models.course import Course, StudentCourse
from app.models.justification import Justification, JustificationProfessor
from app.models.notification import Notification

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.tickets import router as tickets_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.messages import router as messages_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.justifications import router as justifications_router
from app.api.v1.endpoints.notifications import router as notifications_router


class CORSMiddlewareCustom(BaseHTTPMiddleware):
    """Custom CORS middleware that ensures headers are always sent"""
    async def dispatch(self, request: Request, call_next):
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = JSONResponse(content={}, status_code=200)
        else:
            response = await call_next(request)
        
        # Add CORS headers to ALL responses
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="Sistema de Tickets UAH",
    description="API para el sistema de tickets de soporte universitario. "
                "Permite a estudiantes enviar consultas, solicitar horas, "
                "y realizar sugerencias a los académicos.",
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"GLOBAL ERROR: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error (Global): {str(exc)}"},
    )

# Add custom CORS middleware
app.add_middleware(CORSMiddlewareCustom)

# Include routers
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(users_router)
app.include_router(messages_router)
app.include_router(admin_router)
app.include_router(justifications_router)
app.include_router(notifications_router)

# Mount static files
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    """
    Endpoint raíz - Verifica que la API está funcionando.
    """
    return {"message": "API funcionando"}


@app.get("/health")
def health_check(session: Session = Depends(get_session)):
    """
    Health check endpoint - Verifica conexión a la base de datos.
    """
    try:
        # Test database connection
        session.exec(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }


@app.get("/api/info")
def api_info():
    """
    Información general de la API.
    """
    return {
        "name": "Sistema de Tickets UAH",
        "description": "Sistema para gestión de tickets de soporte universitario",
        "features": [
            "Consultas de estudiantes a académicos",
            "Solicitud de horas",
            "Sugerencias y feedback",
            "Consultas sobre ramos"
        ]
    }
