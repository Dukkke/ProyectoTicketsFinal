# cli.py
"""
CLI del Sistema de Tickets UAH
Comandos administrativos usando Typer.
"""

import typer
from typing import Optional
from sqlmodel import Session

app = typer.Typer(
    name="tickets-cli",
    help="CLI para administración del Sistema de Tickets UAH"
)


def get_session():
    """Obtiene una sesión de base de datos."""
    from app.core.database import engine
    return Session(engine)


@app.command()
def create_superuser(
    email: str = typer.Option(..., prompt="Email del administrador"),
    password: str = typer.Option(..., prompt="Contraseña", hide_input=True),
    nombre: str = typer.Option("Administrador", prompt="Nombre")
):
    """
    Crea un usuario administrador/coordinador.
    
    Ejemplo:
        python cli.py create-superuser --email admin@uahurtado.cl
    """
    from app.services import UserService
    from app.models.user import UserRole
    
    with get_session() as session:
        service = UserService(session)
        try:
            user = service.create_user(
                email=email,
                password=password,
                nombre=nombre,
                role=UserRole.COORDINADOR
            )
            typer.echo(f"✅ Superusuario creado: {user.email} (ID: {user.id})")
        except ValueError as e:
            typer.echo(f"❌ Error: {e}", err=True)
            raise typer.Exit(1)


@app.command()
def create_academic(
    email: str = typer.Option(..., prompt="Email del académico"),
    password: str = typer.Option(..., prompt="Contraseña", hide_input=True),
    nombre: str = typer.Option(..., prompt="Nombre"),
    apellido: str = typer.Option("", prompt="Apellido")
):
    """
    Crea un usuario académico.
    
    Ejemplo:
        python cli.py create-academic --email profesor@uahurtado.cl
    """
    from app.services import AuthService
    
    with get_session() as session:
        service = AuthService(session)
        try:
            user = service.register_academic(
                email=email,
                password=password,
                nombre=nombre,
                apellido=apellido
            )
            typer.echo(f"✅ Académico creado: {user.email} (ID: {user.id})")
        except ValueError as e:
            typer.echo(f"❌ Error: {e}", err=True)
            raise typer.Exit(1)


@app.command()
def verify_ticket(
    student_email: str = typer.Argument(..., help="Email del estudiante")
):
    """
    Verifica el flujo de creación de tickets para un estudiante.
    
    Ejemplo:
        python cli.py verify-ticket estudiante@alumnos.uahurtado.cl
    """
    from app.services import TicketService
    
    with get_session() as session:
        service = TicketService(session)
        result = service.verify_ticket_flow(student_email)
        
        if result["success"]:
            typer.echo("✅ Verificación exitosa:")
            typer.echo(f"   Estudiante: {result['student']['name']} ({result['student']['email']})")
            if result["academic_available"]:
                typer.echo(f"   Académico disponible: {result['academic']['name']}")
            else:
                typer.echo("   ⚠️ No hay académicos disponibles para asignación")
        else:
            typer.echo(f"❌ Error: {result['error']}", err=True)
            raise typer.Exit(1)


@app.command()
def list_users(
    role: Optional[str] = typer.Option(None, help="Filtrar por rol: estudiante, academico, coordinador")
):
    """
    Lista usuarios en el sistema.
    
    Ejemplo:
        python cli.py list-users --role academico
    """
    from app.services import UserService
    from app.models.user import UserRole
    
    with get_session() as session:
        service = UserService(session)
        
        if role:
            role_map = {
                "estudiante": UserRole.ESTUDIANTE,
                "academico": UserRole.ACADEMICO,
                "coordinador": UserRole.COORDINADOR
            }
            if role.lower() not in role_map:
                typer.echo(f"❌ Rol inválido. Use: {', '.join(role_map.keys())}", err=True)
                raise typer.Exit(1)
            users = service.get_users_by_role(role_map[role.lower()])
        else:
            from sqlmodel import select
            from app.models.user import User
            users = list(session.exec(select(User)).all())
        
        typer.echo(f"\n📋 Usuarios encontrados: {len(users)}\n")
        for user in users:
            typer.echo(f"  [{user.id}] {user.email} - {user.nombre} ({user.role.value})")


@app.command()
def init_db():
    """
    Inicializa las tablas de la base de datos.
    """
    from app.core.database import init_db as do_init_db
    
    typer.echo("🔄 Inicializando base de datos...")
    do_init_db()
    typer.echo("✅ Base de datos inicializada")


@app.command()
def health():
    """
    Verifica el estado de la conexión a la base de datos.
    """
    from sqlmodel import text
    
    try:
        with get_session() as session:
            session.exec(text("SELECT 1"))
        typer.echo("✅ Conexión a base de datos: OK")
    except Exception as e:
        typer.echo(f"❌ Error de conexión: {e}", err=True)
        raise typer.Exit(1)


if __name__ == "__main__":
    app()
