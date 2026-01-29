
import psycopg2
import os

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user="ticketsadmin",
        password="ingenieria.2k26",
        host="tickets-uah-db.postgres.database.azure.com",
        port="5432",
        sslmode="require"
    )
    print("Conexión exitosa!")
    conn.close()
except Exception as e:
    print(f"Error de conexión: {e}")
