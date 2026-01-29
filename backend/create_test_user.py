
from sqlmodel import Session, select, create_engine
from app.models.user import User, UserRole
from app.core.database import engine
from app.core.security import hash_password

def create_test_user():
    with Session(engine) as session:
        email = "test.vespertino@alumnos.uahurtado.cl"
        # Check if exists
        statement = select(User).where(User.email == email)
        existing = session.exec(statement).first()
        if existing:
            session.delete(existing)
            session.commit()
            print("Existing test user deleted.")

        new_user = User(
            email=email,
            name="Test Vespertino",
            role="ESTUDIANTE",
            password_hash=hash_password("password123"),
            modality="Vespertina",
            year="1",
            rut="12.345.678-0"
        )
        session.add(new_user)
        session.commit()
        print(f"Created user: {new_user.email} with modality {new_user.modality}")

if __name__ == "__main__":
    create_test_user()
