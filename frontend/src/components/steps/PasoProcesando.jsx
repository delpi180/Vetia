import { useEffect, useState } from 'react'
import { Mic, Brain, FileText, Loader2 } from 'lucide-react'

const ETAPAS = [
  { icono: Mic,      label: 'Transcribiendo audio',   sub: 'Deepgram Nova-3' },
  { icono: Brain,    label: 'Extrayendo campos',       sub: 'GPT-4o-mini' },
  { icono: FileText, label: 'Preparando formulario',   sub: 'Casi listo...' },
]

export default function PasoProcesando({ audioBlob, onResultado, onError }) {
  const [etapa, setEtapa] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setEtapa(1), 3000)
    const t2 = setTimeout(() => setEtapa(2), 8000)

    const procesar = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)
      try {
        const formData = new FormData()
        const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav'
        formData.append('audio', audioBlob, `consulta.${ext}`)
        const resp = await fetch('/api/consulta/procesar', { method: 'POST', body: formData, signal: controller.signal })
        clearTimeout(timeoutId)
        if (!resp.ok) {
          let detalle = `Error ${resp.status}`
          try { const err = await resp.json(); detalle = err.detail || detalle } catch { /* respuesta no es JSON */ }
          throw new Error(detalle)
        }
        onResultado(await resp.json())
      } catch (e) {
        clearTimeout(timeoutId)
        if (e.name === 'AbortError') {
          onError('El servidor tardó demasiado en responder. Es posible que esté iniciando — espera 30 segundos e intenta de nuevo.')
        } else {
          onError(e.message)
        }
      }
    }
    procesar()
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Loader2 size={30} className="text-emerald-600 animate-spin" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Analizando consulta...</h2>
      <p className="text-sm text-slate-500 mb-8">Puede tomar entre 10 y 20 segundos</p>

      <div className="space-y-2 text-left max-w-xs mx-auto">
        {ETAPAS.map(({ icono: Icono, label, sub }, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
            ${i < etapa  ? 'bg-emerald-50 border border-emerald-200'
            : i === etapa ? 'bg-slate-50 border border-slate-200'
            : 'border border-transparent opacity-40'}`}
          >
            <Icono size={16} className={i <= etapa ? 'text-emerald-600' : 'text-slate-400'} />
            <div>
              <p className={`text-xs font-semibold ${i <= etapa ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
              <p className={`text-xs ${i <= etapa ? 'text-slate-400' : 'text-slate-300'}`}>{sub}</p>
            </div>
            {i === etapa && <Loader2 size={13} className="text-emerald-500 animate-spin ml-auto" />}
            {i < etapa && <span className="text-emerald-500 text-xs ml-auto font-bold">✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
