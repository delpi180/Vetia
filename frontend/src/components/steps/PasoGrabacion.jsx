import { useState } from 'react'
import AudioRecorder from '../AudioRecorder'
import { ArrowLeft, ArrowRight, Mic, PenLine } from 'lucide-react'

export default function PasoGrabacion({ datosPaciente, onGrabacionLista, onAnterior, onManual }) {
  const [audioBlob, setAudioBlob] = useState(null)

  return (
    <div className="space-y-5">
      {/* Info del paciente */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Mic size={18} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {datosPaciente.nombrePaciente}
            {datosPaciente.raza ? ` · ${datosPaciente.raza}` : ''} ({datosPaciente.especie})
          </p>
          <p className="text-xs text-slate-500">Propietario: {datosPaciente.nombreCliente}</p>
        </div>
      </div>

      {/* Grabador */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <AudioRecorder onGrabacionCompleta={setAudioBlob} />
      </div>

      {/* Confirmación audio listo */}
      {audioBlob && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          Audio listo — {(audioBlob.size / 1024).toFixed(0)} KB grabados
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3">
        <button onClick={onAnterior}
          className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft size={15} />
          Atrás
        </button>
        <button onClick={() => onGrabacionLista(audioBlob)} disabled={!audioBlob}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
          Analizar con IA
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Entrada manual */}
      <div className="text-center">
        <button onClick={onManual}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors py-1">
          <PenLine size={14} />
          Ingresar historia manualmente sin audio
        </button>
      </div>
    </div>
  )
}
