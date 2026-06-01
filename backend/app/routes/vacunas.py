from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import Paciente, Vacuna
from app.schemas.vacuna import VacunaActualizar, VacunaCrear, VacunaRespuesta

router = APIRouter(prefix="/api/vacunas", tags=["vacunas"])


@router.post("", response_model=VacunaRespuesta, status_code=201)
def crear_vacuna(datos: VacunaCrear, db: Session = Depends(get_db)):
    if not db.get(Paciente, datos.paciente_id):
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    vacuna = Vacuna(**datos.model_dump())
    db.add(vacuna)
    db.commit()
    db.refresh(vacuna)
    return vacuna


@router.get("", response_model=list[VacunaRespuesta])
def listar_vacunas(paciente_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Vacuna)
    if paciente_id:
        q = q.filter(Vacuna.paciente_id == paciente_id)
    return q.order_by(Vacuna.fecha_aplicacion.desc()).all()


@router.get("/proximas", response_model=list[dict])
def vacunas_proximas(dias: int = 30, db: Session = Depends(get_db)):
    """Devuelve vacunas con próxima dosis vencida o dentro de `dias` días.
    Incluye nombre del paciente para mostrar en el dashboard."""
    hoy = date.today()
    limite = hoy + timedelta(days=dias)
    vacunas = (
        db.query(Vacuna)
        .options(joinedload(Vacuna.paciente))
        .filter(Vacuna.proxima_dosis_dias.is_not(None))
        .all()
    )
    resultado = []
    for v in vacunas:
        fecha_proxima = v.fecha_aplicacion + timedelta(days=v.proxima_dosis_dias)
        if fecha_proxima <= limite:
            dias_restantes = (fecha_proxima - hoy).days
            paciente = v.paciente
            resultado.append({
                "vacuna_id": v.id,
                "paciente_id": v.paciente_id,
                "paciente_nombre": paciente.nombre if paciente else "?",
                "paciente_especie": paciente.especie if paciente else "Otro",
                "tipo": v.tipo,
                "nombre": v.nombre,
                "fecha_proxima": fecha_proxima.isoformat(),
                "dias_restantes": dias_restantes,
            })
    resultado.sort(key=lambda x: x["dias_restantes"])
    return resultado


@router.put("/{vacuna_id}", response_model=VacunaRespuesta)
def actualizar_vacuna(vacuna_id: int, datos: VacunaActualizar, db: Session = Depends(get_db)):
    vacuna = db.get(Vacuna, vacuna_id)
    if not vacuna:
        raise HTTPException(status_code=404, detail="Vacuna no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(vacuna, campo, valor)
    db.commit()
    db.refresh(vacuna)
    return vacuna


@router.delete("/{vacuna_id}", status_code=204)
def eliminar_vacuna(vacuna_id: int, db: Session = Depends(get_db)):
    vacuna = db.get(Vacuna, vacuna_id)
    if not vacuna:
        raise HTTPException(status_code=404, detail="Vacuna no encontrada")
    db.delete(vacuna)
    db.commit()
