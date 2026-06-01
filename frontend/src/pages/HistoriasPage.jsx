import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, ChevronDown, ChevronUp, Search, X, Printer, AlertCircle } from 'lucide-react'

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white placeholder-slate-400"

const SISTEMAS = [
  ['piel','Piel'],['ojos','Ojos'],['oidos','Oídos'],
  ['sistema_digestivo','Digestivo'],['cardiovascular','Cardiovascular'],
  ['respiratorio','Respiratorio'],['sistema_urinario','Urinario'],
  ['nervioso','Nervioso'],['linfatico','Linfático'],
  ['sistema_locomotor','Locomotor'],['reproductor','Reproductor'],
]

function ms(v) {
  if (v == null) return '—'
  if (v >= 60000) return `${(v / 60000).toFixed(1)} min`
  if (v >= 1000)  return `${(v / 1000).toFixed(1)} s`
  return `${Math.round(v)} ms`
}

function Campo({ label, valor }) {
  if (!valor && valor !== 0) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 shrink-0 w-32 text-xs pt-0.5">{label}</span>
      <span className="text-slate-700 text-xs leading-relaxed">{valor}</span>
    </div>
  )
}

function SeccionColapsable({ titulo, children, defaultOpen = false }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{titulo}</span>
        {abierto
          ? <ChevronUp size={13} className="text-slate-400" />
          : <ChevronDown size={13} className="text-slate-400" />}
      </button>
      {abierto && <div className="px-4 py-3 space-y-2 bg-white">{children}</div>}
    </div>
  )
}

function DetalleHistoria({ historia, pacientes, clientes }) {
  const hc = historia.historia_clinica
  const paciente = pacientes.find(p => p.id === historia.paciente_id)
  const cliente = paciente ? clientes.find(c => c.id === paciente.cliente_id) : null
  const sistemasAnormales = SISTEMAS.filter(([k]) => hc.examen_objetivo_particular[k]?.estado === 'ANORMAL')

  const tiempoIA = (historia.duracion_transcripcion_ms ?? 0) + (historia.duracion_extraccion_ms ?? 0)

  return (
    <div className="space-y-3 pt-1">
      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Paciente', val: paciente?.nombre ?? '—' },
          { label: 'Especie',  val: paciente ? `${paciente.especie}${paciente.raza ? ` · ${paciente.raza}` : ''}` : '—' },
          { label: 'Propietario', val: cliente?.nombre ?? '—' },
          { label: 'Tiempo IA',   val: ms(tiempoIA) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-xs font-semibold text-slate-700 truncate">{val}</p>
          </div>
        ))}
      </div>

      {/* Diagnóstico destacado */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-emerald-700 mb-0.5">Diagnóstico presuntivo</p>
        <p className="text-sm text-emerald-900 font-medium">{hc.diagnostico.presuntivo}</p>
        {hc.diagnostico.diferenciales?.length > 0 && (
          <p className="text-xs text-emerald-600 mt-1">
            Dif: {Array.isArray(hc.diagnostico.diferenciales) ? hc.diagnostico.diferenciales.join(', ') : hc.diagnostico.diferenciales}
          </p>
        )}
        {hc.diagnostico.definitivo && (
          <p className="text-xs text-emerald-600 mt-0.5">Definitivo: {hc.diagnostico.definitivo}</p>
        )}
      </div>

      {/* Hallazgos anormales (resaltados) */}
      {sistemasAnormales.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} className="text-red-500" />
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {sistemasAnormales.length} sistema{sistemasAnormales.length !== 1 ? 's' : ''} anormal{sistemasAnormales.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <div className="space-y-1">
            {sistemasAnormales.map(([k, label]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-red-400 shrink-0 w-24">{label}</span>
                <span className="text-red-700">{hc.examen_objetivo_particular[k].descripcion || 'Hallazgo anormal'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SeccionColapsable titulo="Anamnesis">
        <Campo label="Motivo"       valor={hc.anamnesis.motivo_consulta} />
        <Campo label="Evolución"    valor={hc.anamnesis.tiempo_evolucion} />
        <Campo label="Detalle"      valor={hc.anamnesis.anamnesis_detalle} />
        <Campo label="Alimentación" valor={hc.anamnesis.alimentacion?.tipo} />
        <Campo label="Antecedentes" valor={hc.anamnesis.antecedentes} />
      </SeccionColapsable>

      <SeccionColapsable titulo="Examen general">
        <Campo label="Temperatura"  valor={hc.examen_objetivo_general.temperatura_c ? `${hc.examen_objetivo_general.temperatura_c} °C` : null} />
        <Campo label="Peso"         valor={hc.examen_objetivo_general.peso_kg ? `${hc.examen_objetivo_general.peso_kg} kg` : null} />
        <Campo label="Mucosas"      valor={hc.examen_objetivo_general.mucosas} />
        <Campo label="Sensorio"     valor={hc.examen_objetivo_general.estado_sensorio} />
        <Campo label="Hidratación"  valor={hc.examen_objetivo_general.hidratacion?.estado} />
        <Campo label="Cond. corporal" valor={hc.examen_objetivo_general.condicion_corporal} />
      </SeccionColapsable>

      {hc.tratamiento?.length > 0 && (
        <SeccionColapsable titulo={`Tratamiento · ${hc.tratamiento.length} ítem${hc.tratamiento.length !== 1 ? 's' : ''}`}>
          {hc.tratamiento.map((t, i) => (
            <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
              <span className="font-semibold text-slate-800">{t.farmaco}</span>
              {t.presentacion && <span className="text-slate-500"> ({t.presentacion})</span>}
              <span className="text-slate-500"> — {t.dosis} · {t.via} · c/{t.frecuencia}</span>
              {t.duracion_dias && <span className="text-slate-500"> · {t.duracion_dias} días</span>}
              {t.indicaciones && <p className="text-slate-400 mt-0.5">{t.indicaciones}</p>}
            </div>
          ))}
        </SeccionColapsable>
      )}

      {(hc.indicaciones_cierre.indicaciones_casa || hc.indicaciones_cierre.dieta_recomendada || hc.indicaciones_cierre.proximo_control_dias) && (
        <SeccionColapsable titulo="Indicaciones y cierre">
          <Campo label="Indicaciones"  valor={hc.indicaciones_cierre.indicaciones_casa} />
          <Campo label="Dieta"         valor={hc.indicaciones_cierre.dieta_recomendada} />
          <Campo label="Exámenes"      valor={hc.indicaciones_cierre.examenes_solicitados} />
          <Campo label="Control en"    valor={hc.indicaciones_cierre.proximo_control_dias ? `${hc.indicaciones_cierre.proximo_control_dias} días` : null} />
          <Campo label="Observaciones" valor={hc.indicaciones_cierre.observaciones} />
        </SeccionColapsable>
      )}

      {/* Transcripción */}
      <div className="bg-slate-800 rounded-xl p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transcripción original · Deepgram Nova-3</p>
        <p className="text-xs text-slate-300 leading-relaxed">{historia.transcripcion}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Impresión a PDF
// ---------------------------------------------------------------------------
function generarHtmlImpresion(historia, paciente, cliente) {
  const hc = historia.historia_clinica
  const fecha = new Date(historia.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

  const fila = (label, val) => val ? `<tr><td class="label">${label}</td><td>${val}</td></tr>` : ''

  const sistemasRows = SISTEMAS.map(([k, nombre]) => {
    const s = hc.examen_objetivo_particular[k]
    const estado = s?.estado ?? 'NO_EXPLORADO'
    const cls = estado === 'ANORMAL' ? 'anormal' : estado === 'NORMAL' ? 'normal' : 'ne'
    return `<tr><td>${nombre}</td><td class="${cls}">${estado.replace('_', ' ')}</td><td>${s?.descripcion ?? ''}</td></tr>`
  }).join('')

  const tratamientoRows = (hc.tratamiento ?? []).map((t, i) =>
    `<tr><td>${i+1}</td><td><strong>${t.farmaco}</strong>${t.presentacion ? ` (${t.presentacion})` : ''}</td><td>${t.dosis ?? ''}</td><td>${t.via ?? ''}</td><td>${t.frecuencia ?? ''}</td><td>${t.duracion_dias ? t.duracion_dias + ' días' : ''}</td></tr>`
  ).join('')

  const diferenciales = Array.isArray(hc.diagnostico.diferenciales)
    ? hc.diagnostico.diferenciales.join(', ')
    : (hc.diagnostico.diferenciales ?? '')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Historia Clínica — ${paciente?.nombre ?? ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 24px; }
  h1 { font-size: 16px; color: #059669; margin-bottom: 2px; }
  h2 { font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: .05em;
       border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 14px 0 6px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;
            padding-bottom: 10px; border-bottom: 2px solid #059669; }
  .clinic { font-size: 10px; color: #64748b; text-align: right; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  td, th { padding: 3px 6px; border: 1px solid #e2e8f0; vertical-align: top; }
  th { background: #f8fafc; font-weight: bold; font-size: 10px; text-align: left; }
  td.label { color: #64748b; width: 120px; }
  .anormal { color: #dc2626; font-weight: bold; }
  .normal  { color: #16a34a; }
  .ne      { color: #94a3b8; }
  .dx-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;
            padding: 8px 12px; margin: 8px 0; }
  .dx-box strong { color: #059669; }
  .transcripcion { background: #1e293b; color: #cbd5e1; border-radius: 6px;
                   padding: 8px 12px; font-size: 10px; line-height: 1.5; margin: 6px 0; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  .firma { margin-top: 40px; border-top: 1px solid #334155; width: 200px; text-align: center;
           padding-top: 4px; font-size: 10px; color: #475569; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Historia Clínica Veterinaria</h1>
    <div style="font-size:10px;color:#64748b">N.° ${historia.id} &nbsp;·&nbsp; ${fecha}</div>
  </div>
  <div class="clinic">
    <strong>Veterinaria Los Pinos</strong><br>
    Sistema VetIA v0.1.0
  </div>
</div>
<h2>Datos del Paciente y Propietario</h2>
<div class="grid2">
  <table>
    <tr><td class="label">Paciente</td><td><strong>${paciente?.nombre ?? '—'}</strong></td></tr>
    <tr><td class="label">Especie</td><td>${paciente?.especie ?? '—'}</td></tr>
    <tr><td class="label">Raza</td><td>${paciente?.raza ?? '—'}</td></tr>
    <tr><td class="label">Edad</td><td>${paciente?.edad ?? '—'}</td></tr>
  </table>
  <table>
    <tr><td class="label">Propietario</td><td><strong>${cliente?.nombre ?? '—'}</strong></td></tr>
    ${cliente?.dni ? `<tr><td class="label">DNI</td><td>${cliente.dni}</td></tr>` : ''}
    <tr><td class="label">Teléfono</td><td>${cliente?.telefono ?? '—'}</td></tr>
  </table>
</div>
<h2>Anamnesis</h2>
<table>
  ${fila('Motivo de consulta', hc.anamnesis.motivo_consulta)}
  ${fila('Tiempo de evolución', hc.anamnesis.tiempo_evolucion)}
  ${fila('Derivado por', hc.anamnesis.derivado_por)}
  ${fila('Detalle', hc.anamnesis.anamnesis_detalle)}
  ${fila('Alimentación', hc.anamnesis.alimentacion?.tipo)}
  ${fila('Antecedentes', hc.anamnesis.antecedentes)}
</table>
<h2>Examen Objetivo General</h2>
<div class="grid3">
  <table>${fila('Temperatura', hc.examen_objetivo_general.temperatura_c ? hc.examen_objetivo_general.temperatura_c + ' °C' : null)}</table>
  <table>${fila('Peso', hc.examen_objetivo_general.peso_kg ? hc.examen_objetivo_general.peso_kg + ' kg' : null)}</table>
  <table>${fila('Cond. corporal', hc.examen_objetivo_general.condicion_corporal)}</table>
</div>
<table style="margin-top:6px">
  ${fila('Mucosas', hc.examen_objetivo_general.mucosas)}
  ${fila('Estado sensorio', hc.examen_objetivo_general.estado_sensorio)}
  ${fila('Hidratación', hc.examen_objetivo_general.hidratacion?.estado)}
  ${fila('Descripción hidrat.', hc.examen_objetivo_general.hidratacion?.descripcion)}
</table>
<h2>Examen Objetivo Particular (11 Sistemas)</h2>
<table>
  <thead><tr><th>Sistema</th><th>Estado</th><th>Descripción</th></tr></thead>
  <tbody>${sistemasRows}</tbody>
</table>
<h2>Diagnóstico</h2>
<div class="dx-box">
  <strong>Presuntivo:</strong> ${hc.diagnostico.presuntivo ?? '—'}<br>
  ${diferenciales ? `<strong>Diferenciales:</strong> ${diferenciales}<br>` : ''}
  ${hc.diagnostico.definitivo ? `<strong>Definitivo:</strong> ${hc.diagnostico.definitivo}` : ''}
</div>
${(hc.tratamiento ?? []).length > 0 ? `
<h2>Tratamiento</h2>
<table>
  <thead><tr><th>#</th><th>Fármaco</th><th>Dosis</th><th>Vía</th><th>Frecuencia</th><th>Duración</th></tr></thead>
  <tbody>${tratamientoRows}</tbody>
</table>` : ''}
${(hc.indicaciones_cierre.indicaciones_casa || hc.indicaciones_cierre.dieta_recomendada || hc.indicaciones_cierre.proximo_control_dias) ? `
<h2>Indicaciones y Cierre</h2>
<table>
  ${fila('Indicaciones', hc.indicaciones_cierre.indicaciones_casa)}
  ${fila('Dieta', hc.indicaciones_cierre.dieta_recomendada)}
  ${fila('Exámenes solicitados', hc.indicaciones_cierre.examenes_solicitados)}
  ${fila('Control en', hc.indicaciones_cierre.proximo_control_dias ? hc.indicaciones_cierre.proximo_control_dias + ' días' : null)}
  ${fila('Observaciones', hc.indicaciones_cierre.observaciones)}
</table>` : ''}
<div class="transcripcion">
  <strong style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Transcripción original (Deepgram Nova-3)</strong><br><br>
  ${historia.transcripcion}
</div>
<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px">
  <div class="firma">Firma y sello del Médico Veterinario</div>
  <div class="footer">
    <span>Generado por VetIA · ${fecha}</span>
    <span>Transcripción: ${historia.duracion_transcripcion_ms?.toFixed(0) ?? '—'} ms · Extracción IA: ${historia.duracion_extraccion_ms?.toFixed(0) ?? '—'} ms</span>
  </div>
</div>
</body></html>`
}

function imprimirHistoria(historia, pacientes, clientes) {
  const paciente = pacientes.find(p => p.id === historia.paciente_id)
  const cliente = paciente ? clientes.find(c => c.id === paciente.cliente_id) : null
  const html = generarHtmlImpresion(historia, paciente, cliente)
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

// ---------------------------------------------------------------------------

export default function HistoriasPage() {
  const [historias, setHistorias] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [expandida, setExpandida] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/historias').then(r => r.json()),
      fetch('/api/pacientes').then(r => r.json()),
      fetch('/api/clientes').then(r => r.json()),
    ]).then(([h, p, c]) => {
      setHistorias(h)
      setPacientes(p)
      setClientes(c)
      setCargando(false)
    }).catch(() => setCargando(false))
  }, [])

  const nombrePaciente = (id) => {
    const p = pacientes.find(p => p.id === id)
    return p ? p.nombre : '—'
  }
  const especiePaciente = (id) => pacientes.find(p => p.id === id)?.especie ?? ''
  const nombreCliente = (pacienteId) => {
    const p = pacientes.find(p => p.id === pacienteId)
    if (!p) return '—'
    return clientes.find(c => c.id === p.cliente_id)?.nombre ?? '—'
  }

  const filtradas = historias.filter(h => {
    if (!busqueda) return true
    const texto = busqueda.toLowerCase()
    const paciente = pacientes.find(p => p.id === h.paciente_id)
    const cliente = paciente ? clientes.find(c => c.id === paciente.cliente_id) : null
    return (
      (paciente?.nombre ?? '').toLowerCase().includes(texto) ||
      (cliente?.nombre ?? '').toLowerCase().includes(texto) ||
      (h.historia_clinica?.diagnostico?.presuntivo ?? '').toLowerCase().includes(texto)
    )
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historias Clínicas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cargando ? 'Cargando...' : `${historias.length} historia${historias.length !== 1 ? 's' : ''} registrada${historias.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={inputCls + ' pl-10'} placeholder="Buscar por paciente, propietario o diagnóstico..."
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600 mb-1">
            {busqueda ? 'Sin resultados' : 'Aún no hay historias'}
          </p>
          <p className="text-sm text-slate-400">
            {busqueda ? `No se encontró "${busqueda}"` : 'Las historias aparecerán aquí tras completar una consulta'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((h) => {
            const isOpen = expandida === h.id
            const tiempoIA = (h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0)
            return (
              <div key={h.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Fila principal */}
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-emerald-600" />
                  </div>

                  {/* Info — clic para expandir */}
                  <div
                    onClick={() => setExpandida(isOpen ? null : h.id)}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/pacientes/${h.paciente_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-slate-800 hover:text-emerald-600 truncate transition-colors"
                      >
                        {nombrePaciente(h.paciente_id)}
                      </Link>
                      {especiePaciente(h.paciente_id) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold shrink-0">
                          {especiePaciente(h.paciente_id)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {nombreCliente(h.paciente_id)}
                      {' · '}
                      <span className="text-emerald-600 font-medium">{h.historia_clinica?.diagnostico?.presuntivo ?? 'Sin diagnóstico'}</span>
                    </p>
                  </div>

                  {/* Metadata + acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">
                        {new Date(h.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-300">{ms(tiempoIA)} IA</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); imprimirHistoria(h, pacientes, clientes) }}
                      title="Imprimir / Guardar PDF"
                      className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      onClick={() => setExpandida(isOpen ? null : h.id)}
                      className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-50">
                    <DetalleHistoria historia={h} pacientes={pacientes} clientes={clientes} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
