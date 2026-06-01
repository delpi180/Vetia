"""
Migración de base de datos - ejecutar con el servidor DETENIDO:
  cd backend
  venv\Scripts\activate
  py migrate.py
"""
from sqlalchemy import inspect, text
from app.core.database import engine
from app.models import Base

def migrar():
    inspector = inspect(engine)
    tablas = inspector.get_table_names()

    with engine.connect() as conn:
        # Agregar columnas a historias si no existen
        if "historias" in tablas:
            columnas = [c["name"] for c in inspector.get_columns("historias")]
            if "tiempo_edicion_ms" not in columnas:
                conn.execute(text("ALTER TABLE historias ADD COLUMN tiempo_edicion_ms REAL"))
                conn.commit()
                print("OK: Columna tiempo_edicion_ms agregada a historias")
            else:
                print("OK: tiempo_edicion_ms ya existe en historias")
            if "tiempo_manual_ms" not in columnas:
                conn.execute(text("ALTER TABLE historias ADD COLUMN tiempo_manual_ms REAL"))
                conn.commit()
                print("OK: Columna tiempo_manual_ms agregada a historias")
            else:
                print("OK: tiempo_manual_ms ya existe en historias")

    # Crear tablas nuevas (respuestas_sus, respuestas_tam, vacunas, citas)
    Base.metadata.create_all(bind=engine)
    print("OK: Tablas verificadas/creadas (incluyendo respuestas_sus, respuestas_tam, vacunas, citas)")

if __name__ == "__main__":
    migrar()
