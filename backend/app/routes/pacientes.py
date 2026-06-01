from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Cliente, Paciente
from app.schemas.paciente import PacienteCrear, PacienteActualizar, PacienteRespuesta

router = APIRouter(prefix="/api/pacientes", tags=["pacientes"])


@router.post("", response_model=PacienteRespuesta, status_code=201)
def crear_paciente(datos: PacienteCrear, db: Session = Depends(get_db)):
    if not db.get(Cliente, datos.cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    paciente = Paciente(**datos.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.get("", response_model=list[PacienteRespuesta])
def listar_pacientes(cliente_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Paciente)
    if cliente_id:
        q = q.filter(Paciente.cliente_id == cliente_id)
    return q.order_by(Paciente.nombre).all()


@router.get("/{paciente_id}", response_model=PacienteRespuesta)
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente


@router.put("/{paciente_id}", response_model=PacienteRespuesta)
def actualizar_paciente(paciente_id: int, datos: PacienteActualizar, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(paciente, campo, valor)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.delete("/{paciente_id}", status_code=204)
def eliminar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    db.delete(paciente)
    db.commit()
