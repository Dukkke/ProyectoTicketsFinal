from app.core.database import engine
from sqlalchemy import text
from sqlmodel import Session

def force_update():
    print("Iniciando actualización forzada de esquema (PostgreSQL)...")
    with Session(engine) as session:
        # 1. Check and Add is_archived (if missing)
        try:
            print("Verificando is_archived...")
            session.exec(text("SELECT is_archived FROM tickets LIMIT 1"))
            print("-> is_archived ya existe.")
        except Exception:
            print("-> is_archived NO existe. Creando...")
            try:
                session.rollback() # Clear error state
                session.exec(text("ALTER TABLE tickets ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
                session.commit()
                print("-> is_archived creado exitosamente.")
            except Exception as e:
                print(f"FAILED to add is_archived: {e}")

        # 2. Check and Add is_deleted
        try:
            print("Verificando is_deleted...")
            session.exec(text("SELECT is_deleted FROM tickets LIMIT 1"))
            print("-> is_deleted ya existe.")
        except Exception:
            print("-> is_deleted NO existe. Creando...")
            try:
                session.rollback()
                session.exec(text("ALTER TABLE tickets ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE"))
                session.commit()
                print("-> is_deleted creado exitosamente.")
            except Exception as e:
                print(f"FAILED to add is_deleted: {e}")

        # 3. Check and Add deleted_at
        try:
            print("Verificando deleted_at...")
            session.exec(text("SELECT deleted_at FROM tickets LIMIT 1"))
            print("-> deleted_at ya existe.")
        except Exception:
            print("-> deleted_at NO existe. Creando...")
            try:
                session.rollback()
                session.exec(text("ALTER TABLE tickets ADD COLUMN deleted_at TIMESTAMP WITHOUT TIME ZONE"))
                session.commit()
                print("-> deleted_at creado exitosamente.")
            except Exception as e:
                print(f"FAILED to add deleted_at: {e}")
        
        # 4. Fix NULLs just in case
        print("Corrigiendo valores NULL...")
        try:
            session.exec(text("UPDATE tickets SET is_archived = FALSE WHERE is_archived IS NULL"))
            session.exec(text("UPDATE tickets SET is_deleted = FALSE WHERE is_deleted IS NULL"))
            session.commit()
            print("-> Valores NULL corregidos.")
        except Exception as e:
            print(f"Error fixing NULLs: {e}")

if __name__ == "__main__":
    try:
        force_update()
        print("Actualización FINALIZADA.")
    except Exception as e:
        print(f"FATAL ERROR: {e}")
