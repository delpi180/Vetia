from datetime import datetime
from pydantic import BaseModel


class PacienteCrear(BaseModel):
    nombre: str
    especie: str
    raza: str | None = None
    edad: str | None = None
    sexo: str | None = None
    color: str | None = None
    cliente_id: int


class PacienteActualizar(BaseModel):
    nombre: str | None = None
    especie: str | None = None
    raza: str | None = None
    edad: str | None = None
    sexo: str | None = None
    color: str | None = None


class PacienteRespuesta(BaseModel):
    id: int
    nombre: str
    especie: str
    raza: str | None
    edad: str | None
    sexo: str | None
    color: str | None
    cliente_id: int
    creado_en: datetime

    model_config = {"from_attributes": True}
