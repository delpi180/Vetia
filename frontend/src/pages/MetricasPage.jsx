import { useState, useEffect } from 'react'
import { BarChart2, Clock, Star, Zap, FileText, TrendingUp, Mic, Target, CheckCircle, Brain, Download, ArrowLeftRight, Save } from 'lucide-react'
import { exportarMetricasExcel } from '../utils/exportExcel'

const PREGUNTAS_SUS = [
  "Me gustaría usar este sistema frecuentemente.",
  "El sistema es innecesariamente complejo.",
  "El sistema es fácil de usar.",
  "Necesitaría apoyo técnico para usarlo.",
  "Las funciones están bien integradas.",
  "Hay demasiada inconsistencia.",
  "La mayoría aprendería a usarlo rápido.",
  "El sistema es engorroso de usar.",
  "Me sentí confiado usando el sistema.",
  "Necesité aprender muchas cosas antes.",
]

function ms(v, decimals = 1) {
  if (v == null) return '—'
  if (v >= 60000) return `${(v / 60000).toFixed(decimals)} min`
  if (v >= 1000)  return `${(v / 1000).toFixed(decimals)} s`
  return `${Math.round(v)} ms`
}

function Badge({ children, color }) {
  const colores = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue:    'bg-blue-100 text-blue-700',
    amber:   'bg-amber-100 text-amber-700',
    red:     'bg-red-100 text-red-700',
    slate:   'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colores[color] ?? colores.slate}`}>
      {children}
    </span>
  )
}

function BarraHorizontal({ valor, maximo, color = 'bg-emerald-500', label, sublabel }) {
  const pct = maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600 font-medium">{label}</span>
        <span className="text-xs font-bold text-slate-800">{sublabel}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PanelSUS({ encuestas }) {
  if (!encuestas.length) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
      <Star size={32} className="text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">Aún no hay encuestas SUS registradas.</p>
      <p className="text-xs text-slate-300 mt-1">Se capturan automáticamente al guardar cada consulta.</p>
    </div>
  )

  const promedio = encuestas.reduce((a, e) => a + e.puntaje, 0) / encuestas.length
  const color = promedio >= 80 ? 'text-emerald-600' : promedio >= 70 ? 'text-blue-600' : promedio >= 60 ? 'text-amber-600' : 'text-red-600'
  const badge = promedio >= 90 ? ['Excelente (A)', 'emerald'] : promedio >= 80 ? ['Bueno (B)', 'blue'] : promedio >= 70 ? ['Aceptable (C)', 'amber'] : ['Pobre (D)', 'red']

  // Promedio por pregunta (todas las encuestas)
  const promediosPorPregunta = PREGUNTAS_SUS.map((_, i) =>
    encuestas.reduce((s, e) => s + (e.respuestas[i] ?? 0), 0) / encuestas.length
  )

  return (
    <div className="space-y-4">
      {/* Puntaje global */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">SUS Score Promedio</p>
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-bold ${color}`}>{promedio.toFixed(1)}</span>
              <span className="text-slate-400 text-sm mb-2">/ 100</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge color={badge[1]}>{badge[0]}</Badge>
              <span className="text-xs text-slate-400">{encuestas.length} encuesta{encuestas.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          {/* Medidor circular simple */}
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={promedio >= 80 ? '#10b981' : promedio >= 70 ? '#3b82f6' : promedio >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${promedio} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>
              {Math.round(promedio)}
            </span>
          </div>
        </div>

        {/* Barra 0-100 con rangos */}
        <div className="space-y-1">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
            {/* Zonas de color */}
            <div className="absolute inset-0 flex">
              <div className="bg-red-100"    style={{ width: '60%' }} />
              <div className="bg-amber-100"  style={{ width: '10%' }} />
              <div className="bg-blue-100"   style={{ width: '10%' }} />
              <div className="bg-emerald-100"style={{ width: '20%' }} />
            </div>
            {/* Marcador */}
            <div className="absolute top-0 bottom-0 w-1 bg-slate-800 rounded-full transition-all duration-700"
              style={{ left: `calc(${Math.min(promedio, 99)}% - 2px)` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>0</span><span>Inaceptable</span><span>Aceptable</span><span>Bueno</span><span>100</span>
          </div>
        </div>
      </div>

      {/* Promedio por pregunta */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <BarChart2 size={15} className="text-emerald-600" />
          <span className="font-semibold text-slate-800 text-sm">Respuesta promedio por pregunta</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {PREGUNTAS_SUS.map((pregunta, i) => {
            const val = promediosPorPregunta[i]
            const esPar = (i + 1) % 2 === 0  // par = negativa (menor es mejor)
            const color = esPar
              ? (val <= 2 ? 'bg-emerald-500' : val <= 3 ? 'bg-amber-400' : 'bg-red-400')
              : (val >= 4 ? 'bg-emerald-500' : val >= 3 ? 'bg-amber-400' : 'bg-red-400')
            return (
              <BarraHorizontal
                key={i}
                label={`${i + 1}. ${pregunta}`}
                sublabel={val.toFixed(1)}
                valor={val}
                maximo={5}
                color={color}
              />
            )
          })}
        </div>
      </div>

      {/* Tabla de encuestas individuales */}
      {encuestas.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <FileText size={15} className="text-emerald-600" />
            <span className="font-semibold text-slate-800 text-sm">Puntajes individuales</span>
          </div>
          <div className="divide-y divide-slate-50">
            {encuestas.map((e) => {
              const c = e.puntaje >= 80 ? 'emerald' : e.puntaje >= 70 ? 'blue' : e.puntaje >= 60 ? 'amber' : 'red'
              return (
                <div key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm text-slate-700">Encuesta #{e.id}</span>
                    <span className="text-xs text-slate-400 ml-2">Historia #{e.historia_id}</span>
                  </div>
                  <Badge color={c}>{e.puntaje.toFixed(1)} pts</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PanelTiempos({ historias, resumen }) {
  if (!historias.length) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
      <Clock size={32} className="text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">Aún no hay consultas registradas.</p>
    </div>
  )

  const maxTotal = Math.max(...historias.map(h =>
    (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)
  ))

  return (
    <div className="space-y-4">
      {/* Promedios globales */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Transcripción', val: resumen?.promedio_tiempo_transcripcion_ms, color: 'text-blue-600', bg: 'bg-blue-50', icono: Mic },
          { label: 'Extracción IA', val: resumen?.promedio_tiempo_extraccion_ms,    color: 'text-violet-600', bg: 'bg-violet-50', icono: Zap },
          { label: 'Edición manual', val: resumen?.promedio_tiempo_edicion_ms,      color: 'text-amber-600', bg: 'bg-amber-50', icono: FileText },
          { label: 'Total promedio', val: resumen?.promedio_tiempo_total_ms,        color: 'text-emerald-600', bg: 'bg-emerald-50', icono: Clock },
        ].map(({ label, val, color, bg, icono: Icono }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg} shrink-0`}>
              <Icono size={16} className={color} />
            </div>
            <div>
              <p className={`text-lg font-bold ${color}`}>{ms(val)}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de composición del tiempo */}
      {resumen?.promedio_tiempo_total_ms && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Composición del tiempo total promedio</p>
          <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
            {[
              { val: resumen.promedio_tiempo_transcripcion_ms, color: 'bg-blue-400', label: 'Transcripción' },
              { val: resumen.promedio_tiempo_extraccion_ms,    color: 'bg-violet-400', label: 'Extracción' },
              { val: resumen.promedio_tiempo_edicion_ms,       color: 'bg-amber-400', label: 'Edición' },
            ].filter(s => s.val).map(({ val, color, label }) => {
              const total = (resumen.promedio_tiempo_transcripcion_ms ?? 0)
                          + (resumen.promedio_tiempo_extraccion_ms ?? 0)
                          + (resumen.promedio_tiempo_edicion_ms ?? 0)
              const pct = total > 0 ? (val / total) * 100 : 0
              return (
                <div key={label} className={`${color} flex items-center justify-center`} style={{ width: `${pct}%` }} title={`${label}: ${ms(val)}`}>
                  {pct > 12 && <span className="text-white text-xs font-semibold">{Math.round(pct)}%</span>}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3">
            {[
              { color: 'bg-blue-400',   label: `Transcripción (${ms(resumen.promedio_tiempo_transcripcion_ms)})` },
              { color: 'bg-violet-400', label: `Extracción (${ms(resumen.promedio_tiempo_extraccion_ms)})` },
              { color: 'bg-amber-400',  label: `Edición (${ms(resumen.promedio_tiempo_edicion_ms)})` },
            ].filter(s => !s.label.includes('—')).map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla detalle por consulta */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <TrendingUp size={15} className="text-emerald-600" />
          <span className="font-semibold text-slate-800 text-sm">Detalle por consulta</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-semibold">#</th>
                <th className="text-left px-3 py-2.5 font-semibold">Diagnóstico</th>
                <th className="text-right px-3 py-2.5 font-semibold">Transcripción</th>
                <th className="text-right px-3 py-2.5 font-semibold">Extracción</th>
                <th className="text-right px-3 py-2.5 font-semibold">Edición</th>
                <th className="text-right px-5 py-2.5 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historias.map((h) => {
                const total = (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)
                return (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 font-mono">{h.id}</td>
                    <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate">
                      {h.historia_clinica?.diagnostico?.presuntivo ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">{ms(h.duracion_transcripcion_ms)}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{ms(h.duracion_extraccion_ms)}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{ms(h.tiempo_edicion_ms)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{total > 0 ? ms(total) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── WER / F1 ─────────────────────────────────────────────────────────────────

function calcularWER(referencia, hipotesis) {
  const norm = s => s.toLowerCase().replace(/[.,;:!?¿¡]/g, '').trim()
  const r = norm(referencia).split(/\s+/).filter(Boolean)
  const h = norm(hipotesis).split(/\s+/).filter(Boolean)
  const m = r.length
  if (m === 0) return null
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: h.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= h.length; j++)
      dp[i][j] = r[i-1] === h[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  let i = m, j = h.length, subs = 0, dels = 0, ins = 0
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && r[i-1] === h[j-1]) { i--; j-- }
    else if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + 1) { subs++; i--; j-- }
    else if (j > 0 && dp[i][j] === dp[i][j-1] + 1) { ins++; j-- }
    else { dels++; i-- }
  }
  return { wer: dp[m][h.length] / m * 100, total: m, edits: dp[m][h.length], subs, dels, ins }
}

const CAMPOS_F1 = [
  { id: 'anamnesis.motivo_consulta',                  label: 'Motivo de consulta',    cat: 'Anamnesis',    tipo: 'texto'  },
  { id: 'anamnesis.tiempo_evolucion',                 label: 'Tiempo de evolución',   cat: 'Anamnesis',    tipo: 'texto'  },
  { id: 'anamnesis.anamnesis_detalle',                label: 'Detalle anamnesis',     cat: 'Anamnesis',    tipo: 'texto'  },
  { id: 'examen_objetivo_general.temperatura_c',      label: 'Temperatura (°C)',      cat: 'Ex. General',  tipo: 'numero' },
  { id: 'examen_objetivo_general.peso_kg',            label: 'Peso (kg)',             cat: 'Ex. General',  tipo: 'numero' },
  { id: 'examen_objetivo_general.mucosas',            label: 'Mucosas',               cat: 'Ex. General',  tipo: 'texto'  },
  { id: 'examen_objetivo_general.estado_sensorio',    label: 'Estado sensorio',       cat: 'Ex. General',  tipo: 'texto'  },
  { id: 'examen_objetivo_general.condicion_corporal', label: 'Cond. corporal',        cat: 'Ex. General',  tipo: 'texto'  },
  { id: 'diagnostico.presuntivo',                     label: 'Dx presuntivo',         cat: 'Diagnóstico',  tipo: 'texto'  },
  { id: 'diagnostico.definitivo',                     label: 'Dx definitivo',         cat: 'Diagnóstico',  tipo: 'texto'  },
  { id: 'indicaciones_cierre.indicaciones_casa',      label: 'Indicaciones en casa',  cat: 'Cierre',       tipo: 'texto'  },
  { id: 'indicaciones_cierre.proximo_control_dias',   label: 'Control en días',       cat: 'Cierre',       tipo: 'numero' },
]

function getVal(hc, ruta) {
  const v = ruta.split('.').reduce((o, k) => o?.[k], hc)
  return (v !== null && v !== undefined && v !== '') ? v : null
}

function evalField(ia, ref, tipo) {
  const sI = ia != null ? String(ia).trim() : ''
  const sR = ref != null ? String(ref).trim() : ''
  if (!sI && !sR) return 'na'
  if (sI && !sR) return 'fp'
  if (!sI && sR) return 'fn'
  if (tipo === 'numero') return Math.abs(Number(sI) - Number(sR)) <= 0.1 ? 'tp' : 'fp'
  const a = sI.toLowerCase(), b = sR.toLowerCase()
  if (a === b) return 'tp'
  if (a.includes(b) || b.includes(a)) return 'tp_p'
  const wA = a.split(/\s+/).filter(w => w.length > 3)
  const wB = b.split(/\s+/).filter(w => w.length > 3)
  if (!wB.length) return 'fp'
  const ov = wA.filter(w => wB.some(r => r.includes(w) || w.includes(r)))
  return ov.length / wB.length >= 0.5 ? 'tp_p' : 'fp'
}

function f1Stats(resultados) {
  const tp = resultados.filter(r => r === 'tp' || r === 'tp_p').length
  const fp = resultados.filter(r => r === 'fp').length
  const fn = resultados.filter(r => r === 'fn').length
  const P = tp + fp > 0 ? tp / (tp + fp) : 0
  const R = tp + fn > 0 ? tp / (tp + fn) : 0
  const F = P + R > 0 ? 2 * P * R / (P + R) : 0
  return { tp, fp, fn, P, R, F }
}

function PanelWERF1({ historias, pacientes }) {
  const [historiaId, setHistoriaId] = useState('')
  const [refTx, setRefTx] = useState('')
  const [refCampos, setRefCampos] = useState({})
  const [resultWER, setResultWER] = useState(null)
  const [resultF1, setResultF1] = useState(null)
  const [subtab, setSubtab] = useState('wer')

  const historia = historias.find(h => String(h.id) === historiaId)
  const hc = historia?.historia_clinica
  const paciente = pacientes.find(p => p.id === historia?.paciente_id)

  useEffect(() => {
    if (!historiaId) { setRefTx(''); setRefCampos({}); setResultWER(null); setResultF1(null); return }
    try {
      const d = JSON.parse(localStorage.getItem(`vetia_wf_${historiaId}`) || '{}')
      setRefTx(d.tx || '')
      setRefCampos(d.campos || {})
    } catch { setRefTx(''); setRefCampos({}) }
    setResultWER(null); setResultF1(null)
  }, [historiaId])

  const guardar = (tx, campos) => {
    if (!historiaId) return
    localStorage.setItem(`vetia_wf_${historiaId}`, JSON.stringify({ tx, campos }))
  }

  const hacerWER = () => {
    if (!historia?.transcripcion || !refTx.trim()) return
    setResultWER(calcularWER(refTx, historia.transcripcion))
    guardar(refTx, refCampos)
  }

  const hacerF1 = () => {
    if (!hc) return
    const evaluados = CAMPOS_F1.map(c => ({
      ...c,
      ia: getVal(hc, c.id),
      ref: refCampos[c.id] ?? '',
      res: evalField(getVal(hc, c.id), refCampos[c.id] ?? '', c.tipo),
    }))
    const global = f1Stats(evaluados.map(e => e.res))
    const cats = [...new Set(CAMPOS_F1.map(c => c.cat))].map(cat => ({
      cat, ...f1Stats(evaluados.filter(e => e.cat === cat).map(e => e.res)),
    }))
    setResultF1({ evaluados, global, cats })
    guardar(refTx, refCampos)
  }

  const RES = {
    tp:   { label: 'Correcto',    cls: 'bg-emerald-100 text-emerald-700' },
    tp_p: { label: 'Parcial',     cls: 'bg-blue-100 text-blue-700'       },
    fp:   { label: 'Incorrecto',  cls: 'bg-red-100 text-red-700'         },
    fn:   { label: 'No extraído', cls: 'bg-amber-100 text-amber-700'     },
    na:   { label: 'N/A',         cls: 'bg-slate-100 text-slate-400'     },
  }

  const pct = v => `${(v * 100).toFixed(1)}%`
  const f1Color = f => f >= 0.9 ? 'text-emerald-600' : f >= 0.75 ? 'text-blue-600' : f >= 0.6 ? 'text-amber-600' : 'text-red-600'
  const werColor = w => w <= 5 ? 'text-emerald-600' : w <= 10 ? 'text-blue-600' : w <= 20 ? 'text-amber-600' : 'text-red-600'
  const werLabel = w => w <= 5 ? 'Excelente' : w <= 10 ? 'Bueno' : w <= 20 ? 'Aceptable' : 'Mejorable'
  const yaGuardado = !!localStorage.getItem(`vetia_wf_${historiaId}`)

  return (
    <div className="space-y-4">

      {/* Selector de historia */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historia clínica a evaluar</p>
        <select
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          value={historiaId}
          onChange={e => setHistoriaId(e.target.value)}
        >
          <option value="">Seleccionar historia...</option>
          {historias.map(h => {
            const p = pacientes.find(p => p.id === h.paciente_id)
            const fecha = new Date(h.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
            const saved = !!localStorage.getItem(`vetia_wf_${h.id}`)
            return (
              <option key={h.id} value={h.id}>
                {saved ? '✓ ' : ''}#{h.id} · {p?.nombre ?? '?'} · {h.historia_clinica?.diagnostico?.presuntivo ?? 'Sin dx'} · {fecha}
              </option>
            )
          })}
        </select>
        {historiaId && yaGuardado && (
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
            <CheckCircle size={11} /> Datos de referencia guardados para esta historia
          </p>
        )}
      </div>

      {!historia ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Target size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500 mb-1">Panel WER / F1-Score</p>
          <p className="text-xs text-slate-400">Selecciona una historia para comenzar la evaluación de precisión</p>
        </div>
      ) : (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { id: 'wer', label: 'WER — Precisión de transcripción' },
              { id: 'f1',  label: 'F1-Score — Extracción de campos' },
            ].map(t => (
              <button key={t.id} onClick={() => setSubtab(t.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${subtab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── WER ───────────────────────────────────────────────────────── */}
          {subtab === 'wer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Transcripción del sistema */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <Mic size={13} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deepgram (sistema)</span>
                    <span className="ml-auto text-[10px] text-slate-400">{historia.transcripcion.split(/\s+/).length} palabras</span>
                  </div>
                  <div className="px-4 py-3 h-52 overflow-y-auto">
                    <p className="text-xs text-slate-600 leading-relaxed">{historia.transcripcion}</p>
                  </div>
                </div>
                {/* Transcripción de referencia */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <FileText size={13} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Referencia (transcripción correcta)</span>
                  </div>
                  <textarea
                    className="w-full h-52 px-4 py-3 text-xs text-slate-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 border-0"
                    placeholder="Escribe aquí la transcripción correcta (lo que realmente se dijo en el audio)..."
                    value={refTx}
                    onChange={e => { setRefTx(e.target.value); setResultWER(null) }}
                  />
                </div>
              </div>

              <button onClick={hacerWER} disabled={!refTx.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                Calcular WER
              </button>

              {resultWER && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Word Error Rate</p>
                    <div className="text-right">
                      <p className={`text-5xl font-bold leading-none ${werColor(resultWER.wer)}`}>{resultWER.wer.toFixed(1)}%</p>
                      <p className={`text-xs font-semibold mt-1 ${werColor(resultWER.wer)}`}>{werLabel(resultWER.wer)}</p>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full ${resultWER.wer <= 5 ? 'bg-emerald-500' : resultWER.wer <= 10 ? 'bg-blue-500' : resultWER.wer <= 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(resultWER.wer * 2, 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Palabras ref.',  val: resultWER.total, color: 'text-slate-700' },
                      { label: 'Sustituciones',  val: resultWER.subs,  color: 'text-amber-600' },
                      { label: 'Eliminaciones',  val: resultWER.dels,  color: 'text-red-600'   },
                      { label: 'Inserciones',    val: resultWER.ins,   color: 'text-blue-600'  },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center bg-slate-50 rounded-xl p-3">
                        <p className={`text-2xl font-bold ${color}`}>{val}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-3">WER = (S + D + I) / N · donde N = palabras en referencia</p>
                </div>
              )}
            </div>
          )}

          {/* ── F1-Score ──────────────────────────────────────────────────── */}
          {subtab === 'f1' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comparación campo a campo</span>
                  <span className="ml-auto text-xs text-slate-400">{CAMPOS_F1.length} campos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-500 w-36">Campo</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 w-32">Categoría</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">IA extrajo</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Referencia correcta</th>
                        {resultF1 && <th className="text-center px-3 py-2.5 font-semibold text-slate-500 w-24">Estado</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {CAMPOS_F1.map(c => {
                        const iaVal = getVal(hc, c.id)
                        const evalRes = resultF1?.evaluados.find(e => e.id === c.id)
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-700">{c.label}</td>
                            <td className="px-3 py-2.5 text-slate-400">{c.cat}</td>
                            <td className="px-3 py-2.5">
                              {iaVal != null
                                ? <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">{String(iaVal)}</span>
                                : <span className="text-slate-300 italic">—</span>
                              }
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700 bg-white"
                                placeholder="Valor correcto..."
                                value={refCampos[c.id] ?? ''}
                                onChange={e => {
                                  setRefCampos(v => ({ ...v, [c.id]: e.target.value }))
                                  setResultF1(null)
                                }}
                              />
                            </td>
                            {resultF1 && (
                              <td className="px-3 py-2.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RES[evalRes?.res]?.cls}`}>
                                  {RES[evalRes?.res]?.label}
                                </span>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <button onClick={hacerF1}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                Calcular F1-Score
              </button>

              {resultF1 && (
                <div className="space-y-3">
                  {/* Global */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">F1-Score global</p>
                    <div className="grid grid-cols-3 gap-6 mb-5">
                      {[
                        { label: 'Precisión', val: resultF1.global.P },
                        { label: 'Recall',    val: resultF1.global.R },
                        { label: 'F1-Score',  val: resultF1.global.F },
                      ].map(({ label, val }) => (
                        <div key={label} className="text-center">
                          <p className={`text-4xl font-bold ${f1Color(val)}`}>{pct(val)}</p>
                          <p className="text-xs text-slate-400 mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Verdaderos positivos (TP)', val: resultF1.global.tp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Falsos positivos (FP)',     val: resultF1.global.fp, color: 'text-red-600',     bg: 'bg-red-50'     },
                        { label: 'Falsos negativos (FN)',     val: resultF1.global.fn, color: 'text-amber-600',   bg: 'bg-amber-50'   },
                      ].map(({ label, val, color, bg }) => (
                        <div key={label} className={`text-center rounded-xl p-3 ${bg}`}>
                          <p className={`text-2xl font-bold ${color}`}>{val}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Por categoría */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desglose por categoría</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {resultF1.cats.map(({ cat, F, P, R }) => (
                        <div key={cat} className="flex items-center justify-between px-5 py-3">
                          <span className="text-sm text-slate-700 font-medium w-28">{cat}</span>
                          <div className="flex-1 mx-4">
                            <div className="h-1.5 bg-slate-100 rounded-full">
                              <div className={`h-full rounded-full ${F >= 0.75 ? 'bg-emerald-500' : F >= 0.5 ? 'bg-amber-500' : 'bg-red-400'}`}
                                style={{ width: `${F * 100}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-slate-400 shrink-0">
                            <span>P {pct(P)}</span>
                            <span>R {pct(R)}</span>
                            <span className={`font-bold text-sm w-14 text-right ${f1Color(F)}`}>F1 {pct(F)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    TP incluye coincidencias exactas y parciales (≥50% de palabras clave)
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const PREGUNTAS_TAM = [
  'Usar VetIA mejora mi rendimiento al registrar historias clínicas.',
  'Usar VetIA aumenta mi productividad en el trabajo.',
  'El uso de VetIA me permite ahorrar tiempo en la documentación.',
  'VetIA es útil para mi trabajo como veterinario.',
  'Usar VetIA facilita la documentación de mis consultas veterinarias.',
  'Aprender a usar VetIA es fácil para mí.',
  'Me resulta sencillo usar VetIA para hacer lo que necesito.',
  'Mi interacción con VetIA es clara y comprensible.',
  'En general, encuentro que VetIA es fácil de usar.',
  'Tengo la intención de usar VetIA en mis consultas futuras.',
  'Recomendaría VetIA a otros veterinarios.',
  'Usaría VetIA regularmente si estuviera disponible en mi clínica.',
]

const TAM_DIMS = [
  { label: 'Utilidad Percibida',       indices: [0,1,2,3,4], color: 'text-violet-600', bg: 'bg-violet-500' },
  { label: 'Facilidad de Uso',         indices: [5,6,7,8],   color: 'text-blue-600',   bg: 'bg-blue-500'   },
  { label: 'Intención de Adopción',    indices: [9,10,11],   color: 'text-emerald-600',bg: 'bg-emerald-500'},
]

function tamColor(v) {
  if (v >= 6) return 'text-emerald-600'
  if (v >= 5) return 'text-blue-600'
  if (v >= 4) return 'text-amber-600'
  return 'text-red-600'
}
function tamLabel(v) {
  if (v >= 6) return ['Alta aceptación', 'emerald']
  if (v >= 5) return ['Aceptación moderada', 'blue']
  if (v >= 4) return ['Aceptación neutra', 'amber']
  return ['Baja aceptación', 'red']
}

function GaugeTAM({ valor }) {
  const pct = ((valor - 1) / 6) * 100
  const color = valor >= 6 ? '#10b981' : valor >= 5 ? '#3b82f6' : valor >= 4 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} 100`} strokeLinecap="round"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${tamColor(valor)}`}>
        {valor.toFixed(1)}
      </span>
    </div>
  )
}

function PanelTAM({ encuestas }) {
  if (!encuestas.length) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
      <Brain size={32} className="text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">Aún no hay encuestas TAM registradas.</p>
      <p className="text-xs text-slate-300 mt-1">Se capturan automáticamente al guardar cada consulta.</p>
    </div>
  )

  const promedio = f => encuestas.reduce((a, e) => a + f(e), 0) / encuestas.length
  const pglobal = promedio(e => e.puntaje_global)
  const putil   = promedio(e => e.puntaje_utilidad)
  const pfac    = promedio(e => e.puntaje_facilidad)
  const pint    = promedio(e => e.puntaje_intencion)
  const [etiq, badgeColor] = tamLabel(pglobal)

  // Promedio por pregunta
  const promediosPorPregunta = PREGUNTAS_TAM.map((_, i) =>
    encuestas.reduce((s, e) => s + (e.respuestas[i] ?? 0), 0) / encuestas.length
  )

  return (
    <div className="space-y-4">
      {/* Puntaje global + dimensiones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">TAM Score Promedio</p>
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-bold ${tamColor(pglobal)}`}>{pglobal.toFixed(2)}</span>
              <span className="text-slate-400 text-sm mb-2">/ 7</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge color={badgeColor}>{etiq}</Badge>
              <span className="text-xs text-slate-400">{encuestas.length} encuesta{encuestas.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <GaugeTAM valor={pglobal} />
        </div>

        {/* Barras por dimensión */}
        <div className="space-y-3">
          {[
            { label: 'Utilidad Percibida',    val: putil, color: 'bg-violet-500' },
            { label: 'Facilidad de Uso',       val: pfac,  color: 'bg-blue-500'   },
            { label: 'Intención de Adopción',  val: pint,  color: 'bg-emerald-500'},
          ].map(({ label, val, color }) => (
            <BarraHorizontal key={label} label={label} sublabel={`${val.toFixed(2)} / 7`}
              valor={val} maximo={7} color={color} />
          ))}
        </div>
      </div>

      {/* Promedio por pregunta */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <BarChart2 size={15} className="text-violet-600" />
          <span className="font-semibold text-slate-800 text-sm">Respuesta promedio por ítem</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {TAM_DIMS.map(dim => (
            <div key={dim.label} className="space-y-2">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${dim.color}`}>{dim.label}</p>
              {dim.indices.map(i => (
                <BarraHorizontal
                  key={i}
                  label={`${i + 1}. ${PREGUNTAS_TAM[i]}`}
                  sublabel={promediosPorPregunta[i].toFixed(1)}
                  valor={promediosPorPregunta[i]}
                  maximo={7}
                  color={dim.bg}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla individual */}
      {encuestas.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <FileText size={15} className="text-violet-600" />
            <span className="font-semibold text-slate-800 text-sm">Puntajes individuales</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold">#</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Utilidad</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Facilidad</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Intención</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Global</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {encuestas.map(e => {
                  const [, c] = tamLabel(e.puntaje_global)
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-mono">{e.id}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.puntaje_utilidad.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.puntaje_facilidad.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.puntaje_intencion.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge color={c}>{e.puntaje_global.toFixed(2)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function BarraComparacion({ ia, manual, maximo }) {
  const pctIA     = maximo > 0 ? Math.min((ia / maximo) * 100, 100) : 0
  const pctManual = maximo > 0 ? Math.min((manual / maximo) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 w-6 shrink-0">IA</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctIA}%` }} />
        </div>
        <span className="text-[10px] font-bold text-blue-600 w-14 text-right">{ms(ia)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 w-6 shrink-0">Man.</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pctManual}%` }} />
        </div>
        <span className="text-[10px] font-bold text-amber-600 w-14 text-right">{ms(manual)}</span>
      </div>
    </div>
  )
}

function PanelComparacion({ historias, pacientes, onHistoriaActualizada }) {
  // tiempoInputs: { [historia_id]: string (minutos como texto) }
  const [tiempoInputs, setTiempoInputs] = useState({})
  const [guardando, setGuardando] = useState({})
  const [guardados, setGuardados] = useState({})

  // Inicializar inputs con valores existentes del backend
  useEffect(() => {
    const init = {}
    historias.forEach(h => {
      if (h.tiempo_manual_ms != null) {
        init[h.id] = (h.tiempo_manual_ms / 60000).toFixed(1)
      }
    })
    setTiempoInputs(init)
  }, [historias])

  // Solo historias que pasaron por IA (tienen transcripcion + tiempos IA)
  const conIA = historias.filter(h =>
    h.duracion_transcripcion_ms != null && h.duracion_extraccion_ms != null
  )

  const guardar = async (historiaId) => {
    const minStr = tiempoInputs[historiaId]
    const minutos = parseFloat(minStr)
    if (isNaN(minutos) || minutos <= 0) return
    const ms_val = Math.round(minutos * 60000)
    setGuardando(g => ({ ...g, [historiaId]: true }))
    try {
      const res = await fetch(`/api/historias/${historiaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiempo_manual_ms: ms_val }),
      })
      if (!res.ok) throw new Error()
      const actualizada = await res.json()
      onHistoriaActualizada(actualizada)
      setGuardados(g => ({ ...g, [historiaId]: true }))
      setTimeout(() => setGuardados(g => ({ ...g, [historiaId]: false })), 2000)
    } catch { /* silencioso */ }
    finally { setGuardando(g => ({ ...g, [historiaId]: false })) }
  }

  // Estadísticas globales (solo historias con ambos tiempos)
  const conAmbos = conIA.filter(h => h.tiempo_manual_ms != null)
  const ahorros  = conAmbos.map(h => {
    const tIA = (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)
    return h.tiempo_manual_ms - tIA
  })
  const promedioAhorro  = ahorros.length ? ahorros.reduce((a, b) => a + b, 0) / ahorros.length : null
  const totalAhorro     = ahorros.reduce((a, b) => a + b, 0)
  const pctReducciones  = conAmbos.map(h => {
    const tIA = (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)
    return h.tiempo_manual_ms > 0 ? ((h.tiempo_manual_ms - tIA) / h.tiempo_manual_ms) * 100 : 0
  })
  const promedioPct = pctReducciones.length ? pctReducciones.reduce((a, b) => a + b, 0) / pctReducciones.length : null

  const maxManual = Math.max(...conIA.map(h => h.tiempo_manual_ms ?? 0), 1)

  if (conIA.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <ArrowLeftRight size={32} className="text-slate-200 mx-auto mb-2" />
      <p className="text-sm font-semibold text-slate-500 mb-1">Sin consultas procesadas con IA</p>
      <p className="text-xs text-slate-400">Este panel muestra la comparación entre el tiempo de VetIA y el tiempo que tomaría documentar la misma historia manualmente.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Resumen global */}
      {conAmbos.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Resumen de ahorro — {conAmbos.length} consulta{conAmbos.length !== 1 ? 's' : ''} con datos completos</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Ahorro promedio', val: ms(promedioAhorro), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Tiempo total ahorrado', val: ms(totalAhorro), color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: '% Reducción promedio', val: promedioPct != null ? `${promedioPct.toFixed(1)}%` : '—', color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`rounded-2xl ${bg} p-4 text-center`}>
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Barra global de composición */}
          {promedioAhorro != null && (() => {
            const avgIA = conAmbos.reduce((s, h) => {
              return s + (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)
            }, 0) / conAmbos.length
            const avgManual = conAmbos.reduce((s, h) => s + (h.tiempo_manual_ms ?? 0), 0) / conAmbos.length
            const pctIA_bar = (avgIA / avgManual) * 100
            return (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Comparación promedio: <span className="font-bold text-blue-600">{ms(avgIA)}</span> (VetIA) vs <span className="font-bold text-amber-600">{ms(avgManual)}</span> (manual)</p>
                <div className="h-5 bg-amber-100 rounded-full overflow-hidden relative">
                  <div className="h-full bg-blue-500 rounded-full flex items-center justify-center transition-all duration-700"
                    style={{ width: `${pctIA_bar}%` }}>
                    {pctIA_bar > 15 && <span className="text-[10px] font-bold text-white">VetIA</span>}
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0</span>
                  <span className="text-amber-600 font-semibold">Manual: {ms(avgManual)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Instrucción */}
      {conAmbos.length < conIA.length && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
          Ingresa el tiempo que tomarías en documentar cada historia <strong>completamente a mano</strong> (sin IA) para calcular el ahorro real.
        </div>
      )}

      {/* Tabla de comparación */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <BarChart2 size={15} className="text-emerald-600" />
          <span className="font-semibold text-slate-800 text-sm">Comparación por consulta</span>
          <span className="ml-auto text-xs text-slate-400">{conIA.length} consulta{conIA.length !== 1 ? 's' : ''} con IA</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">#</th>
                <th className="text-left px-3 py-2.5 font-semibold">Paciente / Diagnóstico</th>
                <th className="text-right px-3 py-2.5 font-semibold">Tiempo IA</th>
                <th className="text-center px-3 py-2.5 font-semibold w-40">Tiempo manual (min)</th>
                <th className="text-center px-3 py-2.5 font-semibold w-48">Comparación</th>
                <th className="text-right px-4 py-2.5 font-semibold">Ahorro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {conIA.map((h) => {
                const p = pacientes.find(px => px.id === h.paciente_id)
                const tIA = (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)
                const tManual = h.tiempo_manual_ms
                const ahorro = tManual != null ? tManual - tIA : null
                const pctRed = (tManual != null && tManual > 0) ? ((tManual - tIA) / tManual * 100) : null
                const inputVal = tiempoInputs[h.id] ?? ''
                const yaGuardado = guardados[h.id]
                const estGuardando = guardando[h.id]

                return (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{h.id}</td>
                    <td className="px-3 py-3 max-w-[160px]">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {h.historia_clinica?.diagnostico?.presuntivo ?? '—'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{p?.nombre ?? '?'}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-bold text-blue-600">{ms(tIA)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.5" step="0.5"
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="min"
                          value={inputVal}
                          onChange={e => {
                            setTiempoInputs(t => ({ ...t, [h.id]: e.target.value }))
                            setGuardados(g => ({ ...g, [h.id]: false }))
                          }}
                          onKeyDown={e => e.key === 'Enter' && guardar(h.id)}
                        />
                        <button
                          onClick={() => guardar(h.id)}
                          disabled={!inputVal || isNaN(parseFloat(inputVal)) || estGuardando}
                          className={`p-1.5 rounded-lg transition-colors ${yaGuardado ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30'}`}
                          title="Guardar"
                        >
                          {estGuardando
                            ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            : <Save size={13} />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {tManual != null
                        ? <BarraComparacion ia={tIA} manual={tManual} maximo={maxManual} />
                        : <span className="text-[10px] text-slate-300 italic">Ingresa el tiempo manual</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ahorro != null ? (
                        <div>
                          <p className={`text-xs font-bold ${ahorro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {ahorro >= 0 ? '-' : '+'}{ms(Math.abs(ahorro))}
                          </p>
                          {pctRed != null && (
                            <p className={`text-[10px] font-semibold ${pctRed >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                              {pctRed >= 0 ? '' : '+'}{(-pctRed).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        Ingresa el tiempo estimado de documentación 100% manual para cada consulta. El sistema calcula el ahorro real.
      </p>
    </div>
  )
}

export default function MetricasPage() {
  const [tab, setTab] = useState('tiempos')
  const [historias, setHistorias] = useState([])
  const [encuestas, setEncuestas] = useState([])
  const [encuestasTAM, setEncuestasTAM] = useState([])
  const [resumen, setResumen] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/historias').then(r => r.json()),
      fetch('/api/metricas/sus').then(r => r.json()),
      fetch('/api/metricas/resumen').then(r => r.json()),
      fetch('/api/pacientes').then(r => r.json()),
      fetch('/api/metricas/tam').then(r => r.json()),
    ]).then(([h, s, r, p, t]) => {
      setHistorias(h)
      setEncuestas(s)
      setResumen(r)
      setPacientes(p)
      setEncuestasTAM(t)
      setCargando(false)
    }).catch(() => setCargando(false))
  }, [])

  const handleHistoriaActualizada = (actualizada) => {
    setHistorias(hs => hs.map(h => h.id === actualizada.id ? actualizada : h))
  }

  const tabs = [
    { id: 'tiempos',      label: 'Tiempos de procesamiento', icono: Clock         },
    { id: 'comparacion',  label: 'Manual vs IA',             icono: ArrowLeftRight },
    { id: 'sus',          label: `SUS (${encuestas.length})`,    icono: Star      },
    { id: 'tam',          label: `TAM (${encuestasTAM.length})`, icono: Brain     },
    { id: 'wer_f1',       label: 'WER / F1-Score',           icono: Target        },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Métricas académicas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Resultados de evaluación del sistema — {historias.length} consulta{historias.length !== 1 ? 's' : ''} registrada{historias.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => exportarMetricasExcel({ historias, encuestasSUS: encuestas, encuestasTAM, pacientes })}
          disabled={!historias.length && !encuestas.length && !encuestasTAM.length}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors shrink-0"
        >
          <Download size={15} /> Exportar Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {tabs.map(({ id, label, icono: Icono }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icono size={14} />
            {label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="text-center py-16 text-slate-400 text-sm">Cargando métricas...</div>
      ) : tab === 'tiempos' ? (
        <PanelTiempos historias={historias} resumen={resumen} />
      ) : tab === 'comparacion' ? (
        <PanelComparacion historias={historias} pacientes={pacientes} onHistoriaActualizada={handleHistoriaActualizada} />
      ) : tab === 'sus' ? (
        <PanelSUS encuestas={encuestas} />
      ) : tab === 'tam' ? (
        <PanelTAM encuestas={encuestasTAM} />
      ) : (
        <PanelWERF1 historias={historias} pacientes={pacientes} />
      )}
    </div>
  )
}
