#!/bin/bash
# Script para hacer backup de Azure Database
# Uso: ./backup_azure_db.sh

# IMPORTANTE: Reemplaza estos valores con tu información de Azure Database
# Puedes encontrar esta información en Azure Portal > tickets-uah-db > Connection strings

# Configuración de Azure Database
AZURE_HOST="tickets-uah-db.postgres.database.azure.com"
AZURE_USER="tu_usuario@tickets-uah-db"
AZURE_PASSWORD="tu_contraseña"
AZURE_DB="tickets_db"
AZURE_PORT="5432"

# Nombre del archivo de backup con fecha
BACKUP_FILE="backup_azure_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_DIR="backups"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Iniciando backup de Azure Database"
echo "=========================================="
echo "Host: $AZURE_HOST"
echo "Database: $AZURE_DB"
echo "Archivo: $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Ejecutar pg_dump
PGPASSWORD="$AZURE_PASSWORD" pg_dump \
  -h "$AZURE_HOST" \
  -U "$AZURE_USER" \
  -d "$AZURE_DB" \
  -p "$AZURE_PORT" \
  --no-owner \
  --no-acl \
  -F p \
  -f "$BACKUP_DIR/$BACKUP_FILE"

# Verificar si el backup fue exitoso
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup completado exitosamente!"
    echo "📁 Archivo: $BACKUP_DIR/$BACKUP_FILE"
    echo "📊 Tamaño: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
    echo ""
    echo "Para restaurar este backup en otra base de datos, usa:"
    echo "psql -h HOST -U USER -d DATABASE -f $BACKUP_DIR/$BACKUP_FILE"
else
    echo ""
    echo "❌ Error al crear el backup"
    echo "Verifica tus credenciales de Azure Database"
    exit 1
fi
