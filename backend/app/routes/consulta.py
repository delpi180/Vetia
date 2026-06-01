import logging
import time

from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.schemas.historia_clinica import HistoriaClinica
from app.services.deepgram_service import transcribir_audio
from app.services.extraccion_service import extraer_campos

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/consulta", tags=["consulta"])


class RespuestaConsulta(BaseModel):
    transcripcion: str
    historia_clinica: HistoriaClinica
    duracion_transcripcion_ms: float
    duracion_extraccion_ms: float
    duracion_total_ms: float


@router.post("/procesar", response_model=RespuestaConsulta)
async def procesar_consulta(audio: UploadFile) -> RespuestaConsulta:
    """Transcribe el audio de la consulta y extrae los campos clínicos.

    Recibe un archivo de audio, lo transcribe con Deepgram Nova-3 y luego
    extrae los campos del formulario clínico usando GPT-4o-mini.

    Args:
        audio: Archivo de audio de la consulta (webm, mp3, wav, m4a, ogg).

    Returns:
        Transcripción y formulario clínico pre-llenado.
    """
    # Validar formato del archivo
    extension = ""
    if audio.filename and "." in audio.filename:
        extension = audio.filename.rsplit(".", 1)[-1].lower()

    if extension not in settings.formatos_permitidos:
        raise HTTPException(
            status_code=400,
            detail=f"Formato '{extension}' no soportado. Permitidos: {settings.formatos_permitidos}",
        )

    audio_bytes = await audio.read()

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="El archivo de audio está vacío")

    max_bytes = settings.max_audio_size_mb * 1_048_576
    if len(audio_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo excede el tamaño máximo de {settings.max_audio_size_mb} MB",
        )

    logger.info("Procesando consulta | archivo=%s | tamaño=%d bytes", audio.filename, len(audio_bytes))
    inicio_total = time.perf_counter()

    # Paso 1: Transcripción
    try:
        inicio = time.perf_counter()
        transcripcion = transcribir_audio(audio_bytes, formato=extension)
        duracion_transcripcion_ms = (time.perf_counter() - inicio) * 1000
    except RuntimeError as e:
        logger.error("Error en transcripción: %s", e)
        raise HTTPException(status_code=422, detail=f"Error al transcribir el audio: {e}")

    # Paso 2: Extracción de campos
    try:
        inicio = time.perf_counter()
        historia = extraer_campos(transcripcion)
        duracion_extraccion_ms = (time.perf_counter() - inicio) * 1000
    except (ValueError, RuntimeError) as e:
        logger.error("Error en extracción: %s", e)
        raise HTTPException(status_code=422, detail=f"Error al extraer campos clínicos: {e}")

    duracion_total_ms = (time.perf_counter() - inicio_total) * 1000
    logger.info(
        "Consulta procesada | transcripcion=%.0fms | extraccion=%.0fms | total=%.0fms",
        duracion_transcripcion_ms,
        duracion_extraccion_ms,
        duracion_total_ms,
    )

    return RespuestaConsulta(
        transcripcion=transcripcion,
        historia_clinica=historia,
        duracion_transcripcion_ms=round(duracion_transcripcion_ms, 1),
        duracion_extraccion_ms=round(duracion_extraccion_ms, 1),
        duracion_total_ms=round(duracion_total_ms, 1),
    )
