from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class VacunaCrear(BaseModel):
    paciente_id: int
    tipo: Literal["vacuna", "desparasitacion"]
    nombre: str
    fecha_aplicacion: date
    proxima_dosis_dias: int | None = None
    lote: str | None = None
    notas: str | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v):
        if not v.strip():
            raise ValueError("El nombre no puede estar vacío")
        return v.strip()


class VacunaActualizar(BaseModel):
    tipo: Literal["vacuna", "desparasitacion"] | None = None
    nombre: str | None = None
    fecha_aplicacion: date | None = None
    proxima_dosis_dias: int | None = None
    lote: str | None = None
    notas: str | None = None


class VacunaRespuesta(BaseModel):
    id: int
    paciente_id: int
    tipo: str
    nombre: str
    fecha_aplicacion: date
    proxima_dosis_dias: int | None
    lote: str | None
    notas: str | None
    creado_en: datetime

    model_config = {"from_attributes": True}
