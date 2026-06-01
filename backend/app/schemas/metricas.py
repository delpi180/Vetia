from datetime import datetime
from pydantic import BaseModel, field_validator


PREGUNTAS_SUS = [
    "Creo que me gustaría usar este sistema frecuentemente.",
    "Encontré el sistema innecesariamente complejo.",
    "Pensé que el sistema era fácil de usar.",
    "Creo que necesitaría el apoyo de un técnico para usar este sistema.",
    "Encontré que las funciones de este sistema estaban bien integradas.",
    "Pensé que había demasiada inconsistencia en este sistema.",
    "Imagino que la mayoría de la gente aprendería a usar este sistema muy rápidamente.",
    "Encontré el sistema muy engorroso de usar.",
    "Me sentí muy confiado usando el sistema.",
    "Necesité aprender muchas cosas antes de poder usar este sistema.",
]


class SUSGuardar(BaseModel):
    historia_id: int
    respuestas: list[int]  # 10 valores del 1 al 5

    @field_validator("respuestas")
    @classmethod
    def validar_respuestas(cls, v):
        if len(v) != 10:
            raise ValueError("Se requieren exactamente 10 respuestas")
        if not all(1 <= r <= 5 for r in v):
            raise ValueError("Cada respuesta debe estar entre 1 y 5")
        return v


class SUSRespuesta(BaseModel):
    id: int
    historia_id: int
    puntaje: float
    respuestas: list[int]
    creado_en: datetime

    model_config = {"from_attributes": True}


PREGUNTAS_TAM = [
    # Utilidad Percibida (1-5)
    "Usar VetIA mejora mi rendimiento al registrar historias clínicas.",
    "Usar VetIA aumenta mi productividad en el trabajo.",
    "El uso de VetIA me permite ahorrar tiempo en la documentación.",
    "VetIA es útil para mi trabajo como veterinario.",
    "Usar VetIA facilita la documentación de mis consultas veterinarias.",
    # Facilidad de Uso Percibida (6-9)
    "Aprender a usar VetIA es fácil para mí.",
    "Me resulta sencillo usar VetIA para hacer lo que necesito.",
    "Mi interacción con VetIA es clara y comprensible.",
    "En general, encuentro que VetIA es fácil de usar.",
    # Intención de Adopción (10-12)
    "Tengo la intención de usar VetIA en mis consultas futuras.",
    "Recomendaría VetIA a otros veterinarios.",
    "Usaría VetIA regularmente si estuviera disponible en mi clínica.",
]

TAM_DIMENSIONES = {
    "utilidad":  list(range(0, 5)),   # índices p1-p5
    "facilidad": list(range(5, 9)),   # índices p6-p9
    "intencion": list(range(9, 12)),  # índices p10-p12
}


class TAMGuardar(BaseModel):
    historia_id: int
    respuestas: list[int]  # 12 valores del 1 al 7

    @field_validator("respuestas")
    @classmethod
    def validar_respuestas(cls, v):
        if len(v) != 12:
            raise ValueError("Se requieren exactamente 12 respuestas")
        if not all(1 <= r <= 7 for r in v):
            raise ValueError("Cada respuesta debe estar entre 1 y 7")
        return v


class TAMRespuesta(BaseModel):
    id: int
    historia_id: int
    respuestas: list[int]
    puntaje_utilidad: float
    puntaje_facilidad: float
    puntaje_intencion: float
    puntaje_global: float
    creado_en: datetime

    model_config = {"from_attributes": True}


class ResumenMetricas(BaseModel):
    total_consultas: int
    promedio_tiempo_transcripcion_ms: float | None
    promedio_tiempo_extraccion_ms: float | None
    promedio_tiempo_edicion_ms: float | None
    promedio_tiempo_total_ms: float | None
    promedio_sus: float | None
    total_encuestas_sus: int
    interpretacion_sus: str | None
