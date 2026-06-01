from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import Historia, RespuestaSUS, RespuestaTAM
from app.schemas.metricas import ResumenMetricas, SUSGuardar, SUSRespuesta, TAMGuardar, TAMRespuesta, TAM_DIMENSIONES

router = APIRouter(prefix="/api/metricas", tags=["metricas"])


def _calcular_sus(respuestas: list[int]) -> float:
    """Fórmula oficial SUS: suma contribuciones × 2.5"""
    contribucion = 0
    for i, val in enumerate(respuestas):
        if (i + 1) % 2 == 1:   # impares (positivas)
            contribucion += val - 1
        else:                    # pares (negativas)
            contribucion += 5 - val
    return contribucion * 2.5


def _interpretar_sus(puntaje: float) -> str:
    if puntaje >= 90: return "Excelente (A)"
    if puntaje >= 80: return "Bueno (B)"
    if puntaje >= 70: return "Aceptable (C)"
    if puntaje >= 60: return "Pobre (D)"
    return "Inaceptable (F)"


@router.post("/sus", response_model=SUSRespuesta, status_code=201)
def guardar_sus(datos: SUSGuardar, db: Session = Depends(get_db)):
    if not db.get(Historia, datos.historia_id):
        raise HTTPException(status_code=404, detail="Historia no encontrada")

    existente = db.query(RespuestaSUS).filter_by(historia_id=datos.historia_id).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe una encuesta SUS para esta historia")

    puntaje = _calcular_sus(datos.respuestas)
    sus = RespuestaSUS(
        historia_id=datos.historia_id,
        p1=datos.respuestas[0], p2=datos.respuestas[1],
        p3=datos.respuestas[2], p4=datos.respuestas[3],
        p5=datos.respuestas[4], p6=datos.respuestas[5],
        p7=datos.respuestas[6], p8=datos.respuestas[7],
        p9=datos.respuestas[8], p10=datos.respuestas[9],
        puntaje=puntaje,
    )
    db.add(sus)
    db.commit()
    db.refresh(sus)
    return _sus_a_respuesta(sus)


@router.get("/sus", response_model=list[SUSRespuesta])
def listar_sus(db: Session = Depends(get_db)):
    return [_sus_a_respuesta(s) for s in db.query(RespuestaSUS).order_by(RespuestaSUS.creado_en.desc()).all()]


@router.get("/resumen", response_model=ResumenMetricas)
def resumen(db: Session = Depends(get_db)):
    historias = db.query(Historia).all()
    encuestas = db.query(RespuestaSUS).all()

    def promedio(valores):
        vals = [v for v in valores if v is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    tiempos_transcripcion = [h.duracion_transcripcion_ms for h in historias]
    tiempos_extraccion    = [h.duracion_extraccion_ms    for h in historias]
    tiempos_edicion       = [h.tiempo_edicion_ms         for h in historias]
    tiempos_totales       = [
        (h.duracion_transcripcion_ms or 0) + (h.duracion_extraccion_ms or 0) + (h.tiempo_edicion_ms or 0)
        for h in historias
        if h.duracion_transcripcion_ms and h.duracion_extraccion_ms
    ]
    puntajes_sus = [e.puntaje for e in encuestas]
    promedio_sus = promedio(puntajes_sus)

    return ResumenMetricas(
        total_consultas=len(historias),
        promedio_tiempo_transcripcion_ms=promedio(tiempos_transcripcion),
        promedio_tiempo_extraccion_ms=promedio(tiempos_extraccion),
        promedio_tiempo_edicion_ms=promedio(tiempos_edicion),
        promedio_tiempo_total_ms=promedio(tiempos_totales) if tiempos_totales else None,
        promedio_sus=promedio_sus,
        total_encuestas_sus=len(encuestas),
        interpretacion_sus=_interpretar_sus(promedio_sus) if promedio_sus else None,
    )


@router.get("/config")
def obtener_config():
    return {
        "version": "0.1.0",
        "deepgram_model": settings.deepgram_model,
        "deepgram_language": settings.deepgram_language,
        "llm_model": settings.llm_model,
        "max_audio_duration_seconds": settings.max_audio_duration_seconds,
        "formatos_permitidos": settings.formatos_permitidos,
        "debug": settings.debug,
    }


def _tam_promedio(respuestas: list[int], indices: list[int]) -> float:
    vals = [respuestas[i] for i in indices]
    return round(sum(vals) / len(vals), 3)


def _tam_a_respuesta(t: RespuestaTAM) -> TAMRespuesta:
    return TAMRespuesta(
        id=t.id, historia_id=t.historia_id,
        respuestas=[t.p1, t.p2, t.p3, t.p4, t.p5, t.p6, t.p7, t.p8, t.p9, t.p10, t.p11, t.p12],
        puntaje_utilidad=t.puntaje_utilidad,
        puntaje_facilidad=t.puntaje_facilidad,
        puntaje_intencion=t.puntaje_intencion,
        puntaje_global=t.puntaje_global,
        creado_en=t.creado_en,
    )


@router.post("/tam", response_model=TAMRespuesta, status_code=201)
def guardar_tam(datos: TAMGuardar, db: Session = Depends(get_db)):
    if not db.get(Historia, datos.historia_id):
        raise HTTPException(status_code=404, detail="Historia no encontrada")

    existente = db.query(RespuestaTAM).filter_by(historia_id=datos.historia_id).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe una encuesta TAM para esta historia")

    r = datos.respuestas
    pu  = _tam_promedio(r, TAM_DIMENSIONES["utilidad"])
    fup = _tam_promedio(r, TAM_DIMENSIONES["facilidad"])
    ia  = _tam_promedio(r, TAM_DIMENSIONES["intencion"])
    global_ = round(sum(r) / len(r), 3)

    tam = RespuestaTAM(
        historia_id=datos.historia_id,
        p1=r[0], p2=r[1], p3=r[2], p4=r[3], p5=r[4],
        p6=r[5], p7=r[6], p8=r[7], p9=r[8],
        p10=r[9], p11=r[10], p12=r[11],
        puntaje_utilidad=pu,
        puntaje_facilidad=fup,
        puntaje_intencion=ia,
        puntaje_global=global_,
    )
    db.add(tam)
    db.commit()
    db.refresh(tam)
    return _tam_a_respuesta(tam)


@router.get("/tam", response_model=list[TAMRespuesta])
def listar_tam(db: Session = Depends(get_db)):
    return [_tam_a_respuesta(t) for t in db.query(RespuestaTAM).order_by(RespuestaTAM.creado_en.desc()).all()]


def _sus_a_respuesta(s: RespuestaSUS) -> SUSRespuesta:
    return SUSRespuesta(
        id=s.id, historia_id=s.historia_id, puntaje=s.puntaje,
        respuestas=[s.p1, s.p2, s.p3, s.p4, s.p5, s.p6, s.p7, s.p8, s.p9, s.p10],
        creado_en=s.creado_en,
    )
