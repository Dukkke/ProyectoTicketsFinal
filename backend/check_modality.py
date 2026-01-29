
from sqlmodel import Session, select, create_engine
from app.models.user import User
from app.core.database import engine

def check_user_modality():
    with Session(engine) as session:
        # Find user
        statement = select(User).where(User.email == "valentina@alumnos.uahurtado.cl")
        user = session.exec(statement).first()
        
        if user:
            print(f"User: {user.name} {user.paternal_surname}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Modality: {user.modality}") 
        else:
            print("User not found")

        # Also check the other valentina
        statement2 = select(User).where(User.email == "variquep@alumnos.uahurtado.cl")
        user2 = session.exec(statement2).first()
        if user2:
            print(f"User 2: {user2.name} {user2.paternal_surname}")
            print(f"Modality: {user2.modality}")

if __name__ == "__main__":
    check_user_modality()
