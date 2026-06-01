from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EstadoSistema(str, Enum):
    NORMAL = "NORMAL"
    ANORMAL = "ANORMAL"
    NO_EXPLORADO = "NO_EXPLORADO"


class EstadoSensorio(str, Enum):
    ALERTA = "ALERTA"
    DEPRIMIDO = "DEPRIMIDO"
    ESTUPOROSO = "ESTUPOROSO"
    COMATOSO = "COMATOSO"


class ViaAdministracion(str, Enum):
    ORAL = "ORAL"
    SC = "SC"
    IM = "IM"
    IV = "IV"
    TOPICA = "TOPICA"
    OFTALMICA = "OFTALMICA"
    OTICA = "OTICA"


class Alimentacion(BaseModel):
    tipo: Optional[str] = None
    cantidad_gr: Optional[float] = None
    veces_al_dia: Optional[int] = None
    observaciones: Optional[str] = None


class Hidratacion(BaseModel):
    estado: EstadoSistema = EstadoSistema.NO_EXPLORADO
    descripcion: Optional[str] = None


class ExamenObjetivoGeneral(BaseModel):
    mucosas: Optional[str] = None
    temperatura_c: Optional[float] = Field(None, ge=35.0, le=43.0)
    peso_kg: Optional[float] = Field(None, ge=0.1, le=100.0)
    condicion_corporal: Optional[str] = None
    estado_sensorio: Optional[EstadoSensorio] = None
    hidratacion: Hidratacion = Field(default_factory=Hidratacion)


class SistemaAnatomico(BaseModel):
    estado: EstadoSistema = EstadoSistema.NO_EXPLORADO
    descripcion: Optional[str] = None


class ExamenObjetivoParticular(BaseModel):
    piel: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    ojos: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    oidos: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    sistema_digestivo: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    cardiovascular: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    respiratorio: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    sistema_urinario: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    nervioso: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    linfatico: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    sistema_locomotor: SistemaAnatomico = Field(default_factory=SistemaAnatomico)
    reproductor: SistemaAnatomico = Field(default_factory=SistemaAnatomico)


class Diagnostico(BaseModel):
    presuntivo: str
    diferenciales: list[str] = Field(default_factory=list)
    definitivo: Optional[str] = None


class Tratamiento(BaseModel):
    farmaco: str
    presentacion: Optional[str] = None
    dosis: str
    via: ViaAdministracion
    frecuencia: str
    duracion_dias: Optional[int] = None
    indicaciones: Optional[str] = None


class IndicacionesCierre(BaseModel):
    indicaciones_casa: Optional[str] = None
    dieta_recomendada: Optional[str] = None
    examenes_solicitados: Optional[str] = None
    observaciones: Optional[str] = None
    proximo_control_dias: Optional[int] = None


class Anamnesis(BaseModel):
    motivo_consulta: str
    tiempo_evolucion: Optional[str] = None
    derivado_por: Optional[str] = None
    anamnesis_detalle: Optional[str] = None
    alimentacion: Alimentacion = Field(default_factory=Alimentacion)
    antecedentes: Optional[str] = None


class HistoriaClinica(BaseModel):
    anamnesis: Anamnesis
    examen_objetivo_general: ExamenObjetivoGeneral = Field(default_factory=ExamenObjetivoGeneral)
    examen_objetivo_particular: ExamenObjetivoParticular = Field(default_factory=ExamenObjetivoParticular)
    diagnostico: Diagnostico
    tratamiento: list[Tratamiento] = Field(default_factory=list)
    indicaciones_cierre: IndicacionesCierre = Field(default_factory=IndicacionesCierre)
