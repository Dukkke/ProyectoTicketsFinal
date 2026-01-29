# Script PowerShell para hacer backup de Azure Database
# Uso: .\backup_azure_db.ps1

# IMPORTANTE: Reemplaza estos valores con tu información de Azure Database
# Puedes encontrar esta información en Azure Portal > tickets-uah-db > Connection strings

# Configuración de Azure Database
$AZURE_HOST = "tickets-uah-db.postgres.database.azure.com"
$AZURE_USER = "tu_usuario@tickets-uah-db"
$AZURE_PASSWORD = "tu_contraseña"
$AZURE_DB = "tickets_db"
$AZURE_PORT = "5432"

# Nombre del archivo de backup con fecha
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "backup_azure_$timestamp.sql"
$BACKUP_DIR = "backups"

# Crear directorio de backups si no existe
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Iniciando backup de Azure Database" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Host: $AZURE_HOST"
Write-Host "Database: $AZURE_DB"
Write-Host "Archivo: $BACKUP_DIR\$BACKUP_FILE"
Write-Host ""

# Configurar variable de entorno para la contraseña
$env:PGPASSWORD = $AZURE_PASSWORD

# Ejecutar pg_dump
try {
    & pg_dump `
        -h $AZURE_HOST `
        -U $AZURE_USER `
        -d $AZURE_DB `
        -p $AZURE_PORT `
        --no-owner `
        --no-acl `
        -F p `
        -f "$BACKUP_DIR\$BACKUP_FILE"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Backup completado exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivo: $BACKUP_DIR\$BACKUP_FILE" -ForegroundColor Green
        
        $fileSize = (Get-Item "$BACKUP_DIR\$BACKUP_FILE").Length / 1MB
        Write-Host "📊 Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para restaurar este backup en otra base de datos, usa:" -ForegroundColor Yellow
        Write-Host "psql -h HOST -U USER -d DATABASE -f $BACKUP_DIR\$BACKUP_FILE" -ForegroundColor Yellow
    } else {
        throw "Error al ejecutar pg_dump"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error al crear el backup" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verifica que pg_dump esté instalado (viene con PostgreSQL)" -ForegroundColor Yellow
    Write-Host "2. Verifica tus credenciales de Azure Database" -ForegroundColor Yellow
    Write-Host "3. Verifica que el firewall de Azure permita tu IP" -ForegroundColor Yellow
    exit 1
} finally {
    # Limpiar variable de entorno
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
