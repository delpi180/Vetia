import logging
import time

from deepgram import DeepgramClient, FileSource, PrerecordedOptions

from app.core.config import settings

logger = logging.getLogger(__name__)

_cliente_deepgram = DeepgramClient(api_key=settings.deepgram_api_key)

_MIMETYPES: dict[str, str] = {
    "webm": "audio/webm",
    "mp3":  "audio/mpeg",
    "wav":  "audio/wav",
    "m4a":  "audio/mp4",
    "ogg":  "audio/ogg",
}


def transcribir_audio(audio_bytes: bytes, formato: str = "webm") -> str:
    """Transcribe audio usando Deepgram Nova-3.

    Args:
        audio_bytes: Contenido binario del archivo de audio.
        formato: Extensión del archivo (webm, mp3, wav, m4a, ogg).

    Returns:
        Texto transcrito.

    Raises:
        ValueError: Si el formato no está soportado.
        RuntimeError: Si Deepgram no devuelve transcripción.
    """
    if formato not in _MIMETYPES:
        raise ValueError(
            f"Formato '{formato}' no soportado. "
            f"Permitidos: {list(_MIMETYPES.keys())}"
        )

    mimetype = _MIMETYPES[formato]
    logger.info("Iniciando transcripción | formato=%s | tamaño=%d bytes", formato, len(audio_bytes))

    fuente: FileSource = {"buffer": audio_bytes, "mimetype": mimetype}
    opciones = PrerecordedOptions(
        model=settings.deepgram_model,
        language=settings.deepgram_language,
        smart_format=True,
        punctuate=True,
        diarize=False,
    )

    inicio = time.perf_counter()
    respuesta = _cliente_deepgram.listen.rest.v("1").transcribe_file(fuente, opciones)
    duracion_ms = (time.perf_counter() - inicio) * 1000

    try:
        transcripcion = (
            respuesta.results.channels[0].alternatives[0].transcript
        )
    except (AttributeError, IndexError) as e:
        raise RuntimeError(f"Deepgram no devolvió transcripción válida: {e}") from e

    if not transcripcion.strip():
        raise RuntimeError("Deepgram devolvió transcripción vacía")

    logger.info("Transcripción completada | %.0f ms | %d caracteres", duracion_ms, len(transcripcion))
    return transcripcion
