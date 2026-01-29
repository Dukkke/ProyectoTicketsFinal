# 🔐 Gestión de Superusuario (Admin)

Este archivo explica cómo crear o actualizar un usuario administrador en el sistema.

## Pasos para crear un Admin

1.  Abre el archivo `scripts/create_superuser.py` con tu editor de código.
2.  Busca la sección de **CONFIGURACIÓN** al principio del archivo:

    ```python
    # ==========================================
    # CONFIGURATION - EDIT YOUR SUPERUSER HERE
    # ==========================================
    SUPERUSER_EMAIL = "admin@tickets.uah.cl"  <-- Pon el correo aquí
    SUPERUSER_NAME = "Super Admin"            <-- Pon el nombre aquí
    SUPERUSER_PASSWORD = "StrongPassword123!" <-- Pon la contraseña aquí
    # ==========================================
    ```

3.  Modifica los valores `SUPERUSER_EMAIL`, `SUPERUSER_NAME` y `SUPERUSER_PASSWORD` con los datos que deseas.
4.  Guarda el archivo.
5.  Abre una terminal en la carpeta `backend` y ejecuta:

    ```bash
    python scripts/create_superuser.py
    ```

6.  El script te confirmará si el usuario fue creado o actualizado:
    *   ✅ `Created Superuser`: Se creó un usuario nuevo.
    *   ✅ `Updated ... to ADMIN role`: El usuario ya existía y se le dieron permisos de admin.

---
**Nota**: Puedes repetir este proceso cuantas veces quieras para agregar más administradores o cambiar contraseñas.
