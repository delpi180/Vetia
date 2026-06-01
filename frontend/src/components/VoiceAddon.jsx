import { useState } from 'react'
import { Mic, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import AudioRecorder from './AudioRecorder'

/**
 * Fusiona la historia existente con los datos de una nueva grabación.
 * Reglas:
 *   - Campos simples: la nueva grabación solo sobreescribe si el campo existente está vacío/null.
 *   - Listas de tratamiento: se acumulan (append), sin duplicar.
 *   - Diagnósticos diferenciales: se acumulan y deduplicen.
 *   - Sistemas anatómicos: si el existente es NO_EXPLORADO y el nuevo tiene datos, se actualiza.
 */
function fusionar(existente, nueva) {
  const rellenar = (a, b) => (a != null && a !== '' && a !== 0 ? a : b)

  const fusionarSistema = (ex, nu) => ({
    estado: ex?.estado === 'NO_EXPLORADO' && nu?.estado !== 'NO_EXPLORADO' ? nu.estado : ex?.estado ?? 'NO_EXPLORADO',
    descripcion: rellenar(ex?.descripcion, nu?.descripcion),
  })

  return {
    anamnesis: {
      motivo_consulta: rellenar(existente.anamnesis.motivo_consulta, nueva.anamnesis.motivo_consulta),
      tiempo_evolucion: rellenar(existente.anamnesis.tiempo_evolucion, nueva.anamnesis.tiempo_evolucion),
      derivado_por: rellenar(existente.anamnesis.derivado_por, nueva.anamnesis.derivado_por),
      anamnesis_detalle: rellenar(existente.anamnesis.anamnesis_detalle, nueva.anamnesis.anamnesis_detalle),
      alimentacion: {
        tipo: rellenar(existente.anamnesis.alimentacion?.tipo, nueva.anamnesis.alimentacion?.tipo),
        cantidad_gr: rellenar(existente.anamnesis.alimentacion?.cantidad_gr, nueva.anamnesis.alimentacion?.cantidad_gr),
        veces_al_dia: rellenar(existente.anamnesis.alimentacion?.veces_al_dia, nueva.anamnesis.alimentacion?.veces_al_dia),
        observaciones: rellenar(existente.anamnesis.alimentacion?.observaciones, nueva.anamnesis.alimentacion?.observaciones),
      },
      antecedentes: rellenar(existente.anamnesis.antecedentes, nueva.anamnesis.antecedentes),
    },
    examen_objetivo_general: {
      mucosas: rellenar(existente.examen_objetivo_general.mucosas, nueva.examen_objetivo_general.mucosas),
      temperatura_c: rellenar(existente.examen_objetivo_general.temperatura_c, nueva.examen_objetivo_general.temperatura_c),
      peso_kg: rellenar(existente.examen_objetivo_general.peso_kg, nueva.examen_objetivo_general.peso_kg),
      condicion_corporal: rellenar(existente.examen_objetivo_general.condicion_corporal, nueva.examen_objetivo_general.condicion_corporal),
      estado_sensorio: rellenar(existente.examen_objetivo_general.estado_sensorio, nueva.examen_objetivo_general.estado_sensorio),
      hidratacion: {
        estado: existente.examen_objetivo_general.hidratacion?.estado === 'NO_EXPLORADO'
          ? (nueva.examen_objetivo_general.hidratacion?.estado ?? 'NO_EXPLORADO')
          : existente.examen_objetivo_general.hidratacion?.estado,
        descripcion: rellenar(existente.examen_objetivo_general.hidratacion?.descripcion, nueva.examen_objetivo_general.hidratacion?.descripcion),
      },
    },
    examen_objetivo_particular: Object.fromEntries(
      ['piel','ojos','oidos','sistema_digestivo','cardiovascular','respiratorio',
       'sistema_urinario','nervioso','linfatico','sistema_locomotor','reproductor']
        .map((s) => [s, fusionarSistema(existente.examen_objetivo_particular[s], nueva.examen_objetivo_particular[s])])
    ),
    diagnostico: {
      presuntivo: rellenar(existente.diagnostico.presuntivo, nueva.diagnostico.presuntivo),
      diferenciales: [...new Set([
        ...(existente.diagnostico.diferenciales ?? []),
        ...(nueva.diagnostico.diferenciales ?? []),
      ])],
      definitivo: rellenar(existente.diagnostico.definitivo, nueva.diagnostico.definitivo),
    },
    // Los tratamientos se acumulan
    tratamiento: [
      ...(existente.tratamiento ?? []),
      ...(nueva.tratamiento ?? []),
    ],
    indicaciones_cierre: {
      indicaciones_casa: rellenar(existente.indicaciones_cierre.indicaciones_casa, nueva.indicaciones_cierre.indicaciones_casa),
      dieta_recomendada: rellenar(existente.indicaciones_cierre.dieta_recomendada, nueva.indicaciones_cierre.dieta_recomendada),
      examenes_solicitados: rellenar(existente.indicaciones_cierre.examenes_solicitados, nueva.indicaciones_cierre.examenes_solicitados),
      observaciones: rellenar(existente.indicaciones_cierre.observaciones, nueva.indicaciones_cierre.observaciones),
      proximo_control_dias: rellenar(existente.indicaciones_cierre.proximo_control_dias, nueva.indicaciones_cierre.proximo_control_dias),
    },
  }
}

const ESTADOS = { idle: 'idle', grabando: 'grabando', procesando: 'procesando', listo: 'listo', error: 'error' }

export default function VoiceAddon({ historiaActual, onActualizar }) {
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState(ESTADOS.idle)
  const [audioBlob, setAudioBlob] = useState(null)
  const [msgError, setMsgError] = useState('')
  const [camposAgregados, setCamposAgregados] = useState(0)

  const cerrar = () => {
    setAbierto(false)
    setEstado(ESTADOS.idle)
    setAudioBlob(null)
    setMsgError('')
  }

  const procesarAudio = async (blob) => {
    setAudioBlob(blob)
    setEstado(ESTADOS.procesando)
    try {
      const formData = new FormData()
      const ext = blob.type.includes('webm') ? 'webm' : 'wav'
      formData.append('audio', blob, `addon.${ext}`)

      const resp = await fetch('/api/consulta/procesar', { method: 'POST', body: formData })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || `Error ${resp.status}`)
      }

      const { historia_clinica: nueva } = await resp.json()
      const fusionada = fusionar(historiaActual, nueva)

      // Contar cuántos campos se completaron
      const nuevosTratamientos = (nueva.tratamiento ?? []).length
      const nuevosDiferenciales = (nueva.diagnostico.diferenciales ?? []).filter(
        (d) => !(historiaActual.diagnostico.diferenciales ?? []).includes(d)
      ).length
      setCamposAgregados(nuevosTratamientos + nuevosDiferenciales)

      onActualizar(fusionada)
      setEstado(ESTADOS.listo)
    } catch (e) {
      setMsgError(e.message)
      setEstado(ESTADOS.error)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 py-3 rounded-2xl text-sm font-semibold transition-all"
      >
        <Mic size={16} />
        Agregar más datos por voz
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">Agregar datos por voz</span>
        </div>
        <button onClick={cerrar} className="text-emerald-400 hover:text-emerald-700 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="px-5 py-5">
        {/* Idle / Grabando */}
        {(estado === ESTADOS.idle || estado === ESTADOS.grabando) && (
          <>
            <p className="text-xs text-slate-500 mb-4 text-center leading-relaxed">
              Graba información adicional. Los nuevos datos se <strong>fusionarán</strong> con el
              formulario — los tratamientos se acumulan y los campos vacíos se completan.
            </p>
            <AudioRecorder onGrabacionCompleta={procesarAudio} />
          </>
        )}

        {/* Procesando */}
        {estado === ESTADOS.procesando && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={28} className="text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">Procesando segunda grabación...</p>
            <p className="text-xs text-slate-400">Transcribiendo y fusionando con los datos existentes</p>
          </div>
        )}

        {/* Listo */}
        {estado === ESTADOS.listo && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Formulario actualizado</p>
            <p className="text-xs text-slate-500 text-center">
              Los nuevos datos fueron fusionados.
              {camposAgregados > 0 && ` Se añadieron ${camposAgregados} ítems nuevos.`}
            </p>
            <button
              onClick={cerrar}
              className="mt-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Error */}
        {estado === ESTADOS.error && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">Error al procesar</p>
            <p className="text-xs text-red-600 text-center">{msgError}</p>
            <button
              onClick={() => setEstado(ESTADOS.idle)}
              className="mt-1 px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
