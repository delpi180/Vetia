from datetime import datetime
from typing import Literal

from pydantic import BaseModel

TIPOS_CITA = Literal["control", "consulta", "vacunacion", "cirugia", "otro"]
ESTADOS_CITA = Literal["pendiente", "confirmada", "completada", "cancelada"]


class CitaCrear(BaseModel):
    paciente_id: int
    cliente_id: int | None = None
    fecha_hora: datetime
    tipo: TIPOS_CITA = "control"
    motivo: str | None = None
    notas: str | None = None
    estado: ESTADOS_CITA = "pendiente"
    historia_id: int | None = None


class CitaActualizar(BaseModel):
    fecha_hora: datetime | None = None
    tipo: TIPOS_CITA | None = None
    motivo: str | None = None
    notas: str | None = None
    estado: ESTADOS_CITA | None = None
    historia_id: int | None = None


class CitaRespuesta(BaseModel):
    id: int
    paciente_id: int
    cliente_id: int | None
    fecha_hora: datetime
    tipo: str
    motivo: str | None
    notas: str | None
    estado: str
    historia_id: int | None
    creado_en: datetime
    paciente_nombre: str | None = None
    paciente_especie: str | None = None
    cliente_nombre: str | None = None

    model_config = {"from_attributes": True}
