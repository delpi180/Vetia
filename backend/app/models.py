import json
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _ahora():
    return datetime.now(timezone.utc)


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dni: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(200))
    direccion: Mapped[str | None] = mapped_column(String(300))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    pacientes: Mapped[list["Paciente"]] = relationship(back_populates="cliente", cascade="all, delete-orphan")
    citas: Mapped[list["Cita"]] = relationship(back_populates="cliente", cascade="save-update, merge")


class Paciente(Base):
    __tablename__ = "pacientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    especie: Mapped[str] = mapped_column(String(50), nullable=False)
    raza: Mapped[str | None] = mapped_column(String(100))
    edad: Mapped[str | None] = mapped_column(String(50))
    sexo: Mapped[str | None] = mapped_column(String(20))
    color: Mapped[str | None] = mapped_column(String(100))
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    cliente: Mapped["Cliente"] = relationship(back_populates="pacientes")
    historias: Mapped[list["Historia"]] = relationship(back_populates="paciente", cascade="all, delete-orphan")
    vacunas: Mapped[list["Vacuna"]] = relationship(back_populates="paciente", cascade="all, delete-orphan")
    citas: Mapped[list["Cita"]] = relationship(back_populates="paciente", cascade="all, delete-orphan")


class Historia(Base):
    __tablename__ = "historias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    paciente_id: Mapped[int] = mapped_column(ForeignKey("pacientes.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)
    transcripcion: Mapped[str] = mapped_column(Text, nullable=False)
    historia_json: Mapped[str] = mapped_column(Text, nullable=False)
    duracion_transcripcion_ms: Mapped[float | None] = mapped_column(Float)
    duracion_extraccion_ms: Mapped[float | None] = mapped_column(Float)
    tiempo_edicion_ms: Mapped[float | None] = mapped_column(Float)   # tiempo vet editando formulario
    tiempo_manual_ms: Mapped[float | None] = mapped_column(Float)    # tiempo que tomaría el llenado 100% manual
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    paciente: Mapped["Paciente"] = relationship(back_populates="historias")
    respuesta_sus: Mapped["RespuestaSUS | None"] = relationship(back_populates="historia", cascade="all, delete-orphan")
    respuesta_tam: Mapped["RespuestaTAM | None"] = relationship(back_populates="historia", cascade="all, delete-orphan")

    @property
    def historia_clinica(self) -> dict:
        return json.loads(self.historia_json)


class RespuestaSUS(Base):
    """Cuestionario System Usability Scale (10 preguntas, escala 1-5)."""
    __tablename__ = "respuestas_sus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    historia_id: Mapped[int] = mapped_column(ForeignKey("historias.id"), nullable=False, unique=True)
    # Preguntas impares (positivas): 1,3,5,7,9  — contribución = valor - 1
    # Preguntas pares (negativas):   2,4,6,8,10 — contribución = 5 - valor
    p1:  Mapped[int] = mapped_column(Integer)
    p2:  Mapped[int] = mapped_column(Integer)
    p3:  Mapped[int] = mapped_column(Integer)
    p4:  Mapped[int] = mapped_column(Integer)
    p5:  Mapped[int] = mapped_column(Integer)
    p6:  Mapped[int] = mapped_column(Integer)
    p7:  Mapped[int] = mapped_column(Integer)
    p8:  Mapped[int] = mapped_column(Integer)
    p9:  Mapped[int] = mapped_column(Integer)
    p10: Mapped[int] = mapped_column(Integer)
    puntaje: Mapped[float] = mapped_column(Float)   # SUS score 0-100
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    historia: Mapped["Historia"] = relationship(back_populates="respuesta_sus")


class RespuestaTAM(Base):
    """Cuestionario Technology Acceptance Model (12 preguntas, escala 1-7).
    UP = Utilidad Percibida (p1-p5)
    FUP = Facilidad de Uso Percibida (p6-p9)
    IA  = Intención de Adopción (p10-p12)
    """
    __tablename__ = "respuestas_tam"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    historia_id: Mapped[int] = mapped_column(ForeignKey("historias.id"), nullable=False, unique=True)
    p1:  Mapped[int] = mapped_column(Integer)
    p2:  Mapped[int] = mapped_column(Integer)
    p3:  Mapped[int] = mapped_column(Integer)
    p4:  Mapped[int] = mapped_column(Integer)
    p5:  Mapped[int] = mapped_column(Integer)
    p6:  Mapped[int] = mapped_column(Integer)
    p7:  Mapped[int] = mapped_column(Integer)
    p8:  Mapped[int] = mapped_column(Integer)
    p9:  Mapped[int] = mapped_column(Integer)
    p10: Mapped[int] = mapped_column(Integer)
    p11: Mapped[int] = mapped_column(Integer)
    p12: Mapped[int] = mapped_column(Integer)
    puntaje_utilidad:  Mapped[float] = mapped_column(Float)   # promedio p1-p5
    puntaje_facilidad: Mapped[float] = mapped_column(Float)   # promedio p6-p9
    puntaje_intencion: Mapped[float] = mapped_column(Float)   # promedio p10-p12
    puntaje_global:    Mapped[float] = mapped_column(Float)   # promedio total
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    historia: Mapped["Historia"] = relationship(back_populates="respuesta_tam")


class Vacuna(Base):
    """Registro de vacunas y desparasitaciones por paciente."""
    __tablename__ = "vacunas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    paciente_id: Mapped[int] = mapped_column(ForeignKey("pacientes.id"), nullable=False, index=True)
    # "vacuna" | "desparasitacion"
    tipo: Mapped[str] = mapped_column(String(30), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    fecha_aplicacion: Mapped[date] = mapped_column(Date, nullable=False)
    proxima_dosis_dias: Mapped[int | None] = mapped_column(Integer)
    lote: Mapped[str | None] = mapped_column(String(100))
    notas: Mapped[str | None] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    paciente: Mapped["Paciente"] = relationship(back_populates="vacunas")


class Cita(Base):
    """Citas y controles programados."""
    __tablename__ = "citas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    paciente_id: Mapped[int] = mapped_column(ForeignKey("pacientes.id"), nullable=False, index=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"), nullable=True, index=True)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    # control | consulta | vacunacion | cirugia | otro
    tipo: Mapped[str] = mapped_column(String(50), nullable=False, default="control")
    motivo: Mapped[str | None] = mapped_column(String(300))
    notas: Mapped[str | None] = mapped_column(Text)
    # pendiente | confirmada | completada | cancelada
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")
    historia_id: Mapped[int | None] = mapped_column(ForeignKey("historias.id"), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    paciente: Mapped["Paciente"] = relationship(back_populates="citas")
    cliente: Mapped["Cliente | None"] = relationship(back_populates="citas")
