import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Historia, Paciente
from app.schemas.historia import HistoriaGuardar, HistoriaActualizar, HistoriaRespuesta

router = APIRouter(prefix="/api/historias", tags=["historias"])


@router.post("", response_model=HistoriaRespuesta, status_code=201)
def guardar_historia(datos: HistoriaGuardar, db: Session = Depends(get_db)):
    if not db.get(Paciente, datos.paciente_id):
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    historia = Historia(
        paciente_id=datos.paciente_id,
        transcripcion=datos.transcripcion,
        historia_json=json.dumps(datos.historia_clinica.model_dump(), ensure_ascii=False),
        duracion_transcripcion_ms=datos.duracion_transcripcion_ms,
        duracion_extraccion_ms=datos.duracion_extraccion_ms,
        tiempo_edicion_ms=datos.tiempo_edicion_ms,
    )
    db.add(historia)
    db.commit()
    db.refresh(historia)
    return _a_respuesta(historia)


@router.get("", response_model=list[HistoriaRespuesta])
def listar_historias(paciente_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Historia)
    if paciente_id:
        q = q.filter(Historia.paciente_id == paciente_id)
    historias = q.order_by(Historia.fecha.desc()).all()
    return [_a_respuesta(h) for h in historias]


@router.get("/{historia_id}", response_model=HistoriaRespuesta)
def obtener_historia(historia_id: int, db: Session = Depends(get_db)):
    historia = db.get(Historia, historia_id)
    if not historia:
        raise HTTPException(status_code=404, detail="Historia no encontrada")
    return _a_respuesta(historia)


@router.patch("/{historia_id}", response_model=HistoriaRespuesta)
def actualizar_historia(historia_id: int, datos: HistoriaActualizar, db: Session = Depends(get_db)):
    historia = db.get(Historia, historia_id)
    if not historia:
        raise HTTPException(status_code=404, detail="Historia no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(historia, campo, valor)
    db.commit()
    db.refresh(historia)
    return _a_respuesta(historia)


def _a_respuesta(h: Historia) -> HistoriaRespuesta:
    return HistoriaRespuesta(
        id=h.id,
        paciente_id=h.paciente_id,
        fecha=h.fecha,
        transcripcion=h.transcripcion,
        historia_clinica=h.historia_clinica,
        duracion_transcripcion_ms=h.duracion_transcripcion_ms,
        duracion_extraccion_ms=h.duracion_extraccion_ms,
        tiempo_edicion_ms=h.tiempo_edicion_ms,
        tiempo_manual_ms=h.tiempo_manual_ms,
        creado_en=h.creado_en,
    )
