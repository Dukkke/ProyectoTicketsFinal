# 📋 Instrucciones para Backup y Migración de Azure Database

## 🎯 Objetivo
Hacer un backup completo de tu base de datos Azure PostgreSQL y poder migrarla a otra base de datos sin perder información.

---

## 📦 Opción 1: Backup Manual desde Azure Portal (Más Fácil)

### Pasos:
1. Ve a [Azure Portal](https://portal.azure.com)
2. Navega a tu base de datos: `tickets-uah-db`
3. En el menú lateral, selecciona **"Copia de seguridad y restauración"**
4. Haz clic en **"Restaurar"** para crear un punto de restauración
5. También puedes descargar los backups automáticos existentes

**Ventajas:**
- ✅ No requiere herramientas adicionales
- ✅ Azure maneja todo automáticamente
- ✅ Puedes restaurar a cualquier punto en el tiempo (últimos 7 días)

---

## 💻 Opción 2: Backup usando pg_dump (Recomendado para Migración)

### Requisitos Previos:
1. **Instalar PostgreSQL Client Tools** (si no lo tienes):
   - Windows: Descarga desde [postgresql.org](https://www.postgresql.org/download/windows/)
   - Durante la instalación, asegúrate de seleccionar "Command Line Tools"

2. **Obtener Credenciales de Azure Database:**
   - Ve a Azure Portal > `tickets-uah-db`
   - Menú lateral > **"Cadenas de conexión"** o **"Connection strings"**
   - Copia la información de PostgreSQL

### Configurar el Script:

#### Para Windows (PowerShell):
1. Abre el archivo `backup_azure_db.ps1` en un editor de texto
2. Reemplaza estos valores con tu información real:
   ```powershell
   $AZURE_HOST = "tickets-uah-db.postgres.database.azure.com"
   $AZURE_USER = "tu_usuario@tickets-uah-db"  # Ejemplo: admin@tickets-uah-db
   $AZURE_PASSWORD = "tu_contraseña"
   $AZURE_DB = "tickets_db"  # Nombre de tu base de datos
   ```

3. Guarda el archivo

4. Ejecuta el script:
   ```powershell
   .\backup_azure_db.ps1
   ```

### Resultado:
- Se creará una carpeta `backups/` con un archivo `.sql`
- El archivo contendrá TODA tu base de datos (estructura + datos)
- Nombre del archivo: `backup_azure_YYYYMMDD_HHMMSS.sql`

---

## 🔄 Restaurar el Backup en Otra Base de Datos

### Opción A: Restaurar en PostgreSQL Local (Docker)
1. Asegúrate de que el contenedor de PostgreSQL esté corriendo
2. Copia el backup al contenedor:
   ```bash
   docker cp backups/backup_azure_YYYYMMDD_HHMMSS.sql tickets-db:/tmp/
   ```
3. Restaura el backup:
   ```bash
   docker exec -i tickets-db psql -U tickets_user -d tickets_db < backups/backup_azure_YYYYMMDD_HHMMSS.sql
   ```

---

## ⚠️ Notas Importantes

### Firewall de Azure:
Si obtienes un error de conexión, necesitas agregar tu IP al firewall de Azure:
1. Ve a Azure Portal > `tickets-uah-db`
2. Menú lateral > **"Redes"** o **"Networking"**
3. Haz clic en **"Agregar dirección IP del cliente actual"**
4. Guarda los cambios

### Verificar el Backup:
Después de crear el backup, verifica que el archivo no esté vacío:
```powershell
Get-Content backups\backup_azure_*.sql | Select-Object -First 20
```

Deberías ver comandos SQL como:
```sql
--
-- PostgreSQL database dump
--
CREATE TABLE users (...);
INSERT INTO users VALUES (...);
```

---

## 🚀 Próximos Pasos (Después del Backup)

Una vez que tengas el backup seguro:

1. **Arreglar la configuración del Frontend** para que se conecte correctamente al backend
2. **Actualizar las variables de entorno** en el archivo `.env` con la nueva conexión
