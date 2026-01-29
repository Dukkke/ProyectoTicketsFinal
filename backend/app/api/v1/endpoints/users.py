from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List
import shutil
import os
import uuid

from app.core.database import get_session
from app.models.user import User, UserRole
from app.schemas.user import UserUpdate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])

@router.patch("/{user_id}/profile", response_model=UserResponse)
async def update_profile(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session)
):
    """
    Actualiza el perfil del usuario (teléfono, oficina, bio, etc.)
    """
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user_data = user_update.dict(exclude_unset=True)
    
    try:
        for key, value in user_data.items():
            setattr(db_user, key, value)
            
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno al actualizar perfil: {str(e)}")

@router.post("/{user_id}/upload-avatar")
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Sube una foto de perfil para el usuario.
    Guarda el archivo en local y actualiza la URL en la BD.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Validar extensión
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Formato de imagen no válido. Use JPG, PNG o GIF.")

    # Generar nombre único
    filename = f"{user_id}_{uuid.uuid4()}{ext}"
    file_path = f"uploads/{filename}"

    # Guardar archivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar imagen: {str(e)}")

    # Actualizar usuario
    # Construct full URL or relative path. Storing relative path is safer if domain changes.
    # Frontend will prepend API URL.
    user.profile_photo = f"/uploads/{filename}"
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"profile_photo": user.profile_photo}
