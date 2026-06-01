import logging
import time

from openai import OpenAI

from app.core.config import settings
from app.schemas.historia_clinica import HistoriaClinica

logger = logging.getLogger(__name__)

_cliente_openai = OpenAI(api_key=settings.openai_api_key)

_PROMPT_SISTEMA = """
Eres un asistente especializado en documentación clínica veterinaria en Perú.
Tu tarea es extraer información de la transcripción de una consulta veterinaria
y estructurarla en el formulario clínico.

Instrucciones:
- Extrae únicamente lo que se mencione explícitamente en la transcripción.
- Si un campo no se menciona, déjalo en null o usa el valor por defecto.
- Para "motivo_consulta" y "diagnostico.presuntivo" (campos obligatorios),
  infiere el valor más apropiado del contexto si no se dice textualmente.
- Los valores de estado usan: NORMAL, ANORMAL o NO_EXPLORADO.
- Las temperaturas van en Celsius (35–43°C) y los pesos en kg (0.1–100).
- Las vías de administración válidas son: ORAL, SC, IM, IV, TOPICA, OFTALMICA, OTICA.
- Responde siempre en español.
""".strip()


def extraer_campos(transcripcion: str) -> HistoriaClinica:
    """Extrae campos clínicos de una transcripción usando GPT-4o-mini.

    Args:
        transcripcion: Texto transcrito de la consulta veterinaria.

    Returns:
        HistoriaClinica con todos los campos extraídos.

    Raises:
        ValueError: Si la transcripción está vacía.
        RuntimeError: Si OpenAI no devuelve una respuesta válida.
    """
    if not transcripcion.strip():
        raise ValueError("La transcripción está vacía")

    logger.info("Iniciando extracción | %d caracteres", len(transcripcion))

    inicio = time.perf_counter()
    respuesta = _cliente_openai.beta.chat.completions.parse(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": _PROMPT_SISTEMA},
            {"role": "user", "content": f"Transcripción:\n\n{transcripcion}"},
        ],
        response_format=HistoriaClinica,
        temperature=0.1,
    )
    duracion_ms = (time.perf_counter() - inicio) * 1000

    historia = respuesta.choices[0].message.parsed
    if historia is None:
        raise RuntimeError("OpenAI no devolvió datos estructurados válidos")

    logger.info(
        "Extracción completada | %.0f ms | motivo='%s' | dx='%s'",
        duracion_ms,
        historia.anamnesis.motivo_consulta,
        historia.diagnostico.presuntivo,
    )
    return historia
