from app.core.database import engine
from sqlalchemy import text
from sqlmodel import Session

def upgrade_db():
    print("Agregando columnas de soft delete a la tabla tickets...")
    with Session(engine) as session:
        # Check if columns exist
        try:
            # Try to select the column to see if it exists
            session.exec(text("SELECT is_deleted FROM tickets LIMIT 1"))
            print("La columna is_deleted ya existe.")
        except Exception:
            print("Agregando columna is_deleted...")
            try:
                session.exec(text("ALTER TABLE tickets ADD COLUMN is_deleted BOOLEAN DEFAULT 0"))
                session.commit()
                print("Columna is_deleted agregada.")
            except Exception as e:
                print(f"Error agregando is_deleted: {e}")

        try:
            session.exec(text("SELECT deleted_at FROM tickets LIMIT 1"))
            print("La columna deleted_at ya existe.")
        except Exception:
            print("Agregando columna deleted_at...")
            try:
                session.exec(text("ALTER TABLE tickets ADD COLUMN deleted_at DATETIME"))
                session.commit()
                print("Columna deleted_at agregada.")
            except Exception as e:
                print(f"Error agregando deleted_at: {e}")

if __name__ == "__main__":
    try:
        upgrade_db()
        print("Migración manual completada con éxito.")
    except Exception as e:
        print(f"Error crítico en la migración: {e}")
