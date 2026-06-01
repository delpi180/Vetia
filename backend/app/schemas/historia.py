from datetime import datetime
from pydantic import BaseModel

from app.schemas.historia_clinica import HistoriaClinica


class HistoriaGuardar(BaseModel):
    paciente_id: int
    transcripcion: str | None = None
    historia_clinica: HistoriaClinica
    duracion_transcripcion_ms: float | None = None
    duracion_extraccion_ms: float | None = None
    tiempo_edicion_ms: float | None = None


class HistoriaActualizar(BaseModel):
    tiempo_manual_ms: float | None = None


class HistoriaRespuesta(BaseModel):
    id: int
    paciente_id: int
    fecha: datetime
    transcripcion: str | None
    historia_clinica: dict
    duracion_transcripcion_ms: float | None
    duracion_extraccion_ms: float | None
    tiempo_edicion_ms: float | None
    tiempo_manual_ms: float | None
    creado_en: datetime

    model_config = {"from_attributes": True}
