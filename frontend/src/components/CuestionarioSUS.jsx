import { useState } from 'react'
import { ClipboardList, X, Send, Loader2, CheckCircle } from 'lucide-react'

const PREGUNTAS = [
  "Creo que me gustaría usar este sistema frecuentemente.",
  "Encontré el sistema innecesariamente complejo.",
  "Pensé que el sistema era fácil de usar.",
  "Creo que necesitaría el apoyo de un técnico para usar este sistema.",
  "Encontré que las funciones de este sistema estaban bien integradas.",
  "Pensé que había demasiada inconsistencia en este sistema.",
  "Imagino que la mayoría de la gente aprendería a usar este sistema muy rápidamente.",
  "Encontré el sistema muy engorroso de usar.",
  "Me sentí muy confiado usando el sistema.",
  "Necesité aprender muchas cosas antes de poder usar este sistema.",
]

const ETIQUETAS = ['Totalmente en desacuerdo', '', '', '', 'Totalmente de acuerdo']

export default function CuestionarioSUS({ historiaId, onCerrar }) {
  const [respuestas, setRespuestas] = useState(Array(10).fill(null))
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  const completo = respuestas.every((r) => r !== null)

  const handleEnviar = async () => {
    if (!completo) return
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch('/api/metricas/sus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historia_id: historiaId, respuestas }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Error al enviar')
      setEnviado(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-emerald-600" />
            <span className="font-bold text-slate-800">Encuesta de Usabilidad (SUS)</span>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {enviado ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <CheckCircle size={48} className="text-emerald-500" />
            <p className="font-bold text-slate-800 text-lg">¡Gracias por tu respuesta!</p>
            <p className="text-slate-500 text-sm">La historia clínica y la encuesta han sido guardadas correctamente.</p>
            <button onClick={onCerrar}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Ir al inicio
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <p className="text-sm text-slate-500">
                Por favor indica tu nivel de acuerdo con cada afirmación sobre el sistema que acabas de usar.
              </p>

              {PREGUNTAS.map((pregunta, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="text-emerald-600 font-bold mr-1">{i + 1}.</span>{pregunta}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          const nueva = [...respuestas]
                          nueva[i] = val
                          setRespuestas(nueva)
                        }}
                        className={`flex-1 h-10 rounded-lg border-2 text-sm font-bold transition-all
                          ${respuestas[i] === val
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'
                          }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">{ETIQUETAS[0]}</span>
                    <span className="text-xs text-slate-400">{ETIQUETAS[4]}</span>
                  </div>
                </div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button onClick={onCerrar} className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
                Omitir por ahora
              </button>
              <button
                onClick={handleEnviar}
                disabled={!completo || enviando}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                {enviando
                  ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                  : <><Send size={14} /> Enviar encuesta ({respuestas.filter(r => r !== null).length}/10)</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
