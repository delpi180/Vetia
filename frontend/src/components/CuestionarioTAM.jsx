import { useState } from 'react'
import { Brain, X, Send, Loader2, CheckCircle } from 'lucide-react'

const DIMENSIONES = [
  {
    id: 'utilidad',
    label: 'Utilidad Percibida',
    color: 'text-violet-600',
    preguntas: [
      'Usar VetIA mejora mi rendimiento al registrar historias clínicas.',
      'Usar VetIA aumenta mi productividad en el trabajo.',
      'El uso de VetIA me permite ahorrar tiempo en la documentación.',
      'VetIA es útil para mi trabajo como veterinario.',
      'Usar VetIA facilita la documentación de mis consultas veterinarias.',
    ],
  },
  {
    id: 'facilidad',
    label: 'Facilidad de Uso Percibida',
    color: 'text-blue-600',
    preguntas: [
      'Aprender a usar VetIA es fácil para mí.',
      'Me resulta sencillo usar VetIA para hacer lo que necesito.',
      'Mi interacción con VetIA es clara y comprensible.',
      'En general, encuentro que VetIA es fácil de usar.',
    ],
  },
  {
    id: 'intencion',
    label: 'Intención de Adopción',
    color: 'text-emerald-600',
    preguntas: [
      'Tengo la intención de usar VetIA en mis consultas futuras.',
      'Recomendaría VetIA a otros veterinarios.',
      'Usaría VetIA regularmente si estuviera disponible en mi clínica.',
    ],
  },
]

// Lista plana de 12 preguntas con índice global calculado al nivel de módulo
let _gi = 0
const PREGUNTAS_PLANAS = DIMENSIONES.flatMap(d =>
  d.preguntas.map(texto => ({ texto, dimId: d.id, color: d.color, idx: _gi++ }))
)

export default function CuestionarioTAM({ historiaId, onCerrar }) {
  const [respuestas, setRespuestas] = useState(Array(12).fill(null))
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  const completo = respuestas.every(r => r !== null)

  const handleEnviar = async () => {
    if (!completo) return
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch('/api/metricas/tam', {
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
            <Brain size={18} className="text-violet-600" />
            <span className="font-bold text-slate-800">Encuesta TAM — Aceptación Tecnológica</span>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {enviado ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <CheckCircle size={48} className="text-violet-500" />
            <p className="font-bold text-slate-800 text-lg">¡Gracias por completar la encuesta TAM!</p>
            <p className="text-slate-500 text-sm">Tus respuestas ayudan a validar la aceptación del sistema.</p>
            <button onClick={onCerrar}
              className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Ir al inicio
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <p className="text-sm text-slate-500">
                Indica tu nivel de acuerdo (1 = Totalmente en desacuerdo, 7 = Totalmente de acuerdo) con cada afirmación.
              </p>

              {DIMENSIONES.map(dim => {
                const pregsDeEstasDim = PREGUNTAS_PLANAS.filter(p => p.dimId === dim.id)
                return (
                  <div key={dim.id} className="space-y-4">
                    <div className={`text-xs font-bold uppercase tracking-wider ${dim.color} border-b border-slate-100 pb-1`}>
                      {dim.label}
                    </div>
                    {pregsDeEstasDim.map(({ texto, idx }) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">
                          <span className={`font-bold mr-1 ${dim.color}`}>{idx + 1}.</span>{texto}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map(val => (
                            <button
                              key={val}
                              onClick={() => {
                                const nueva = [...respuestas]
                                nueva[idx] = val
                                setRespuestas(nueva)
                              }}
                              className={`flex-1 h-9 rounded-lg border-2 text-xs font-bold transition-all
                                ${respuestas[idx] === val
                                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                                  : 'border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-500'
                                }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-400">En desacuerdo</span>
                          <span className="text-[10px] text-slate-400">De acuerdo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}

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
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                {enviando
                  ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                  : <><Send size={14} /> Enviar TAM ({respuestas.filter(r => r !== null).length}/12)</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
