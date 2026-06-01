import pytest
from pydantic import ValidationError

from app.schemas.historia_clinica import (
    Alimentacion,
    Anamnesis,
    Diagnostico,
    EstadoSensorio,
    EstadoSistema,
    ExamenObjetivoGeneral,
    ExamenObjetivoParticular,
    HistoriaClinica,
    SistemaAnatomico,
    Tratamiento,
    ViaAdministracion,
)


def historia_minima() -> HistoriaClinica:
    return HistoriaClinica(
        anamnesis=Anamnesis(motivo_consulta="Vómitos"),
        diagnostico=Diagnostico(presuntivo="Gastroenteritis aguda"),
    )


class TestHistoriaClinicaMinima:
    def test_crea_con_campos_obligatorios(self):
        h = historia_minima()
        assert h.anamnesis.motivo_consulta == "Vómitos"
        assert h.diagnostico.presuntivo == "Gastroenteritis aguda"

    def test_campos_opcionales_son_none_por_defecto(self):
        h = historia_minima()
        assert h.anamnesis.tiempo_evolucion is None
        assert h.anamnesis.derivado_por is None
        assert h.diagnostico.definitivo is None

    def test_tratamiento_lista_vacia_por_defecto(self):
        h = historia_minima()
        assert h.tratamiento == []

    def test_diferenciales_lista_vacia_por_defecto(self):
        h = historia_minima()
        assert h.diagnostico.diferenciales == []


class TestValidacionCamposObligatorios:
    def test_falta_motivo_consulta_lanza_error(self):
        with pytest.raises(ValidationError):
            Anamnesis()  # type: ignore

    def test_falta_presuntivo_lanza_error(self):
        with pytest.raises(ValidationError):
            Diagnostico()  # type: ignore


class TestExamenObjetivoGeneral:
    def test_temperatura_fuera_de_rango_lanza_error(self):
        with pytest.raises(ValidationError):
            ExamenObjetivoGeneral(temperatura_c=50.0)

    def test_temperatura_minima_fuera_de_rango(self):
        with pytest.raises(ValidationError):
            ExamenObjetivoGeneral(temperatura_c=34.9)

    def test_peso_negativo_lanza_error(self):
        with pytest.raises(ValidationError):
            ExamenObjetivoGeneral(peso_kg=-1.0)

    def test_peso_cero_lanza_error(self):
        with pytest.raises(ValidationError):
            ExamenObjetivoGeneral(peso_kg=0.0)

    def test_valores_validos_aceptados(self):
        eog = ExamenObjetivoGeneral(
            temperatura_c=38.5,
            peso_kg=25.0,
            mucosas="Rosadas",
            estado_sensorio=EstadoSensorio.ALERTA,
        )
        assert eog.temperatura_c == 38.5
        assert eog.peso_kg == 25.0
        assert eog.estado_sensorio == EstadoSensorio.ALERTA

    def test_hidratacion_normal_por_defecto(self):
        eog = ExamenObjetivoGeneral()
        assert eog.hidratacion.estado == EstadoSistema.NO_EXPLORADO


class TestExamenObjetivoParticular:
    def test_once_sistemas_no_explorados_por_defecto(self):
        eop = ExamenObjetivoParticular()
        sistemas = [
            eop.piel, eop.ojos, eop.oidos,
            eop.sistema_digestivo, eop.cardiovascular, eop.respiratorio,
            eop.sistema_urinario, eop.nervioso, eop.linfatico,
            eop.sistema_locomotor, eop.reproductor,
        ]
        assert len(sistemas) == 11
        assert all(s.estado == EstadoSistema.NO_EXPLORADO for s in sistemas)

    def test_sistema_anormal_con_descripcion(self):
        eop = ExamenObjetivoParticular(
            sistema_digestivo=SistemaAnatomico(
                estado=EstadoSistema.ANORMAL,
                descripcion="Dolor a la palpación",
            )
        )
        assert eop.sistema_digestivo.estado == EstadoSistema.ANORMAL
        assert eop.sistema_digestivo.descripcion == "Dolor a la palpación"


class TestTratamiento:
    def test_tratamiento_completo(self):
        t = Tratamiento(
            farmaco="Metronidazol",
            dosis="250mg",
            via=ViaAdministracion.ORAL,
            frecuencia="cada 12 horas",
            duracion_dias=5,
        )
        assert t.farmaco == "Metronidazol"
        assert t.via == ViaAdministracion.ORAL

    def test_via_invalida_lanza_error(self):
        with pytest.raises(ValidationError):
            Tratamiento(
                farmaco="X",
                dosis="1mg",
                via="INTRAOCULAR",  # type: ignore
                frecuencia="diario",
            )


class TestHistoriaClinicaCompleta:
    def test_serializa_a_dict_correctamente(self):
        h = HistoriaClinica(
            anamnesis=Anamnesis(
                motivo_consulta="Cojera",
                tiempo_evolucion="2 días",
                alimentacion=Alimentacion(tipo="Croquetas", veces_al_dia=2),
            ),
            diagnostico=Diagnostico(
                presuntivo="Esguince",
                diferenciales=["Fractura", "Luxación"],
            ),
            tratamiento=[
                Tratamiento(
                    farmaco="Meloxicam",
                    dosis="0.1mg/kg",
                    via=ViaAdministracion.SC,
                    frecuencia="cada 24 horas",
                    duracion_dias=3,
                )
            ],
        )
        d = h.model_dump()
        assert d["anamnesis"]["motivo_consulta"] == "Cojera"
        assert len(d["diagnostico"]["diferenciales"]) == 2
        assert d["tratamiento"][0]["via"] == "SC"
