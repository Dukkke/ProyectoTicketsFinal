from app.core.database import engine
from sqlmodel import Session, select
from app.models.ticket import Ticket, TicketMessage
from app.models.user import User  # Import needed for registry
from sqlalchemy.exc import IntegrityError
import sys

def try_delete():
    print("Intentando eliminar un ticket de prueba...")
    with Session(engine) as session:
        # Pick a random ticket to try deleting (one that exists)
        ticket = session.exec(select(Ticket).limit(1)).first()
        
        if not ticket:
            print("No hay tickets para probar.")
            return

        print(f"Intentando eliminar Ticket ID: {ticket.id} ({ticket.ticket_code})")
        
        try:
            # Emulate the backend logic
            messages = session.exec(select(TicketMessage).where(TicketMessage.ticket_id == ticket.id)).all()
            print(f"  -> Eliminando {len(messages)} mensajes asociados...")
            for m in messages:
                session.delete(m)
            
            print("  -> Eliminando ticket...")
            session.delete(ticket)
            
            session.commit()
            print("EXITO: El ticket se eliminó correctamente (en la simulación).")
        except IntegrityError as e:
            print("\n!!! ERROR DE INTEGRIDAD DETECTADO (Foreign Key) !!!")
            print(f"Detalle: {e.orig}")
        except Exception as e:
            print(f"\n!!! OTRO ERROR !!!: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    try_delete()
