from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Cita, Paciente
from app.schemas.cita import CitaActualizar, CitaCrear, CitaRespuesta, ESTADOS_CITA

router = APIRouter(prefix="/api/citas", tags=["citas"])


def _a_respuesta(c: Cita) -> dict:
    return {
        "id": c.id,
        "paciente_id": c.paciente_id,
        "cliente_id": c.cliente_id,
        "fecha_hora": c.fecha_hora,
        "tipo": c.tipo,
        "motivo": c.motivo,
        "notas": c.notas,
        "estado": c.estado,
        "historia_id": c.historia_id,
        "creado_en": c.creado_en,
        "paciente_nombre": c.paciente.nombre if c.paciente else None,
        "paciente_especie": c.paciente.especie if c.paciente else None,
        "cliente_nombre": c.cliente.nombre if c.cliente else None,
    }


@router.post("", response_model=CitaRespuesta, status_code=201)
def crear_cita(datos: CitaCrear, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, datos.paciente_id)
    if not paciente:
        raise HTTPException(404, "Paciente no encontrado")

    cita = Cita(
        paciente_id=datos.paciente_id,
        cliente_id=datos.cliente_id if datos.cliente_id is not None else paciente.cliente_id,
        fecha_hora=datos.fecha_hora,
        tipo=datos.tipo,
        motivo=datos.motivo,
        notas=datos.notas,
        estado=datos.estado,
        historia_id=datos.historia_id,
    )
    db.add(cita)
    db.commit()
    db.refresh(cita)
    return _a_respuesta(cita)


@router.get("", response_model=list[CitaRespuesta])
def listar_citas(
    paciente_id: int | None = None,
    estado: str | None = None,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Cita)
    if paciente_id is not None:
        q = q.filter(Cita.paciente_id == paciente_id)
    if estado:
        q = q.filter(Cita.estado == estado)
    if desde:
        q = q.filter(Cita.fecha_hora >= desde)
    if hasta:
        q = q.filter(Cita.fecha_hora <= hasta)
    return [_a_respuesta(c) for c in q.order_by(Cita.fecha_hora.asc()).all()]


@router.get("/hoy", response_model=list[CitaRespuesta])
def citas_de_hoy(db: Session = Depends(get_db)):
    ahora = datetime.now(timezone.utc)
    inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    fin = ahora.replace(hour=23, minute=59, second=59, microsecond=999999)
    citas = (
        db.query(Cita)
        .filter(Cita.fecha_hora >= inicio, Cita.fecha_hora <= fin, Cita.estado != "cancelada")
        .order_by(Cita.fecha_hora.asc())
        .all()
    )
    return [_a_respuesta(c) for c in citas]


@router.get("/proximas", response_model=list[CitaRespuesta])
def citas_proximas(dias: int = Query(default=7, ge=1, le=90), db: Session = Depends(get_db)):
    ahora = datetime.now(timezone.utc)
    hasta = ahora + timedelta(days=dias)
    citas = (
        db.query(Cita)
        .filter(
            Cita.fecha_hora >= ahora,
            Cita.fecha_hora <= hasta,
            Cita.estado.in_(["pendiente", "confirmada"]),
        )
        .order_by(Cita.fecha_hora.asc())
        .all()
    )
    return [_a_respuesta(c) for c in citas]


@router.put("/{cita_id}", response_model=CitaRespuesta)
def actualizar_cita(cita_id: int, datos: CitaActualizar, db: Session = Depends(get_db)):
    cita = db.get(Cita, cita_id)
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cita, campo, valor)
    db.commit()
    db.refresh(cita)
    return _a_respuesta(cita)


@router.patch("/{cita_id}/estado", response_model=CitaRespuesta)
def cambiar_estado(cita_id: int, estado: ESTADOS_CITA, db: Session = Depends(get_db)):
    cita = db.get(Cita, cita_id)
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    cita.estado = estado
    db.commit()
    db.refresh(cita)
    return _a_respuesta(cita)


@router.delete("/{cita_id}", status_code=204)
def eliminar_cita(cita_id: int, db: Session = Depends(get_db)):
    cita = db.get(Cita, cita_id)
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    db.delete(cita)
    db.commit()
