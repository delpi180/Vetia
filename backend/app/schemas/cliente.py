from datetime import datetime
from pydantic import BaseModel, field_validator


class ClienteCrear(BaseModel):
    dni: str | None = None
    nombre: str
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None

    @field_validator("dni")
    @classmethod
    def validar_dni(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v.isdigit() or len(v) != 8:
            raise ValueError("El DNI debe tener exactamente 8 dígitos")
        return v


class ClienteActualizar(BaseModel):
    dni: str | None = None
    nombre: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None

    @field_validator("dni")
    @classmethod
    def validar_dni(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v.isdigit() or len(v) != 8:
            raise ValueError("El DNI debe tener exactamente 8 dígitos")
        return v


class ClienteRespuesta(BaseModel):
    id: int
    dni: str | None
    nombre: str
    telefono: str | None
    email: str | None
    direccion: str | None
    creado_en: datetime

    model_config = {"from_attributes": True}
