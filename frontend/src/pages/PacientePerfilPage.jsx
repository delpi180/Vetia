import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, ChevronUp, Download,
  FileText, Clock, Calendar, AlertCircle, ClipboardPlus,
  Phone, CreditCard, Mail, MapPin, Pencil, X,
  TrendingUp, MessageCircle, Copy, Check,
  Syringe, Plus, Trash2, ShieldCheck, CalendarCheck, Stethoscope,
} from 'lucide-react'
import { exportarHistoriaPDF } from '../utils/exportPDF'
import { useToast } from '../components/Toast'

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white placeholder-slate-400"
const ESPECIES = ['Canino', 'Felino', 'Ave', 'Roedor', 'Reptil', 'Otro']

function FormCampo({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const ESPECIE_CONFIG = {
  Canino: { color: 'bg-amber-100 text-amber-700',   emoji: '🐕' },
  Felino: { color: 'bg-violet-100 text-violet-700', emoji: '🐈' },
  Ave:    { color: 'bg-sky-100 text-sky-700',       emoji: '🐦' },
  Roedor: { color: 'bg-orange-100 text-orange-700', emoji: '🐹' },
  Reptil: { color: 'bg-green-100 text-green-700',   emoji: '🦎' },
  Otro:   { color: 'bg-slate-100 text-slate-600',   emoji: '🐾' },
}

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

function SeccionColapsable({ titulo, children, defaultOpen = false }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{titulo}</span>
        {abierto ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
      </button>
      {abierto && <div className="px-4 py-3 space-y-2 bg-white">{children}</div>}
    </div>
  )
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

function MiniChart({ datos, color, min: minFijo, max: maxFijo }) {
  if (datos.length < 2) return null
  const vals = datos.map(d => d.v)
  const minV = minFijo ?? Math.min(...vals)
  const maxV = maxFijo ?? Math.max(...vals)
  const rango = maxV - minV || 1
  const W = 220, H = 52, PX = 6, PY = 8
  const pts = datos.map((d, i) => {
    const x = PX + (i / (datos.length - 1)) * (W - PX * 2)
    const y = PY + (1 - (d.v - minV) / rango) * (H - PY * 2)
    return { x, y, v: d.v, label: d.label }
  })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          {i === pts.length - 1 && (
            <text x={p.x + 6} y={p.y + 4} fontSize="9" fill={color} fontWeight="bold">{p.v}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

function SignosVitales({ historias }) {
  const datos = [...historias]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .map(h => ({
      label: new Date(h.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
      peso: h.historia_clinica?.examen_objetivo_general?.peso_kg ?? null,
      temp: h.historia_clinica?.examen_objetivo_general?.temperatura_c ?? null,
    }))

  const pesoData  = datos.filter(d => d.peso != null).map(d => ({ v: d.peso,  label: d.label }))
  const tempData  = datos.filter(d => d.temp != null).map(d => ({ v: d.temp,  label: d.label }))

  if (!pesoData.length && !tempData.length) return null

  const ultimo = datos[datos.length - 1]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-emerald-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evolución de signos vitales</p>
        <span className="text-xs text-slate-300 ml-auto">{pesoData.length || tempData.length} registro{(pesoData.length || tempData.length) !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Peso */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-blue-500">kg</span>
            </div>
            <span className="text-xs font-semibold text-slate-600">Peso</span>
            {pesoData.length > 0 && (
              <span className="ml-auto text-sm font-bold text-blue-600">
                {pesoData[pesoData.length - 1].v} kg
              </span>
            )}
          </div>
          {pesoData.length >= 2
            ? <MiniChart datos={pesoData} color="#3b82f6" />
            : pesoData.length === 1
              ? <p className="text-xs text-slate-400 py-2">Solo un registro aún</p>
              : <p className="text-xs text-slate-300 py-2">Sin datos</p>
          }
        </div>

        {/* Temperatura */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded bg-orange-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-orange-500">°C</span>
            </div>
            <span className="text-xs font-semibold text-slate-600">Temperatura</span>
            {tempData.length > 0 && (
              <span className="ml-auto text-sm font-bold text-orange-500">
                {tempData[tempData.length - 1].v} °C
              </span>
            )}
          </div>
          {tempData.length >= 2
            ? <MiniChart datos={tempData} color="#f97316" min={37} max={41} />
            : tempData.length === 1
              ? <p className="text-xs text-slate-400 py-2">Solo un registro aún</p>
              : <p className="text-xs text-slate-300 py-2">Sin datos</p>
          }
        </div>
      </div>
    </div>
  )
}

function DetalleConsulta({ historia }) {
  const hc = historia.historia_clinica
  const sistemasAnormales = SISTEMAS.filter(([k]) => hc.examen_objetivo_particular[k]?.estado === 'ANORMAL')

  return (
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Transcripción', val: ms(historia.duracion_transcripcion_ms) },
          { label: 'Extracción IA',  val: ms(historia.duracion_extraccion_ms) },
          { label: 'Edición manual', val: ms(historia.tiempo_edicion_ms) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-xs font-semibold text-slate-700">{val}</p>
          </div>
        ))}
      </div>

      {sistemasAnormales.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} className="text-red-500" />
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {sistemasAnormales.length} sistema{sistemasAnormales.length !== 1 ? 's' : ''} anormal{sistemasAnormales.length !== 1 ? 'es' : ''}
            </p>
          </div>
          {sistemasAnormales.map(([k, label]) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className="text-red-400 shrink-0 w-24">{label}</span>
              <span className="text-red-700">{hc.examen_objetivo_particular[k].descripcion || 'Hallazgo anormal'}</span>
            </div>
          ))}
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
        <Campo label="Temperatura"    valor={hc.examen_objetivo_general.temperatura_c ? `${hc.examen_objetivo_general.temperatura_c} °C` : null} />
        <Campo label="Peso"           valor={hc.examen_objetivo_general.peso_kg ? `${hc.examen_objetivo_general.peso_kg} kg` : null} />
        <Campo label="Mucosas"        valor={hc.examen_objetivo_general.mucosas} />
        <Campo label="Sensorio"       valor={hc.examen_objetivo_general.estado_sensorio} />
        <Campo label="Hidratación"    valor={hc.examen_objetivo_general.hidratacion?.estado} />
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
            </div>
          ))}
        </SeccionColapsable>
      )}

      {(hc.indicaciones_cierre.indicaciones_casa || hc.indicaciones_cierre.proximo_control_dias) && (
        <SeccionColapsable titulo="Indicaciones y cierre">
          <Campo label="Indicaciones"  valor={hc.indicaciones_cierre.indicaciones_casa} />
          <Campo label="Dieta"         valor={hc.indicaciones_cierre.dieta_recomendada} />
          <Campo label="Control en"    valor={hc.indicaciones_cierre.proximo_control_dias ? `${hc.indicaciones_cierre.proximo_control_dias} días` : null} />
          <Campo label="Observaciones" valor={hc.indicaciones_cierre.observaciones} />
        </SeccionColapsable>
      )}

      <div className="bg-slate-800 rounded-xl p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transcripción · Deepgram Nova-3</p>
        <p className="text-xs text-slate-300 leading-relaxed">{historia.transcripcion}</p>
      </div>
    </div>
  )
}

function generarMensajeHistoria(historia, paciente) {
  const hc = historia.historia_clinica
  const fecha = new Date(historia.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const lineas = []

  lineas.push(`*Historia Clínica — Veterinaria Los Pinos* 🐾`)
  lineas.push(`📋 *Paciente:* ${paciente.nombre} (${paciente.especie}${paciente.raza ? ` · ${paciente.raza}` : ''})`)
  lineas.push(`📅 *Fecha:* ${fecha}`)
  lineas.push('')

  if (hc.diagnostico?.presuntivo) {
    lineas.push(`*🔍 Diagnóstico*`)
    lineas.push(hc.diagnostico.presuntivo)
    if (hc.diagnostico.definitivo) lineas.push(`Definitivo: ${hc.diagnostico.definitivo}`)
    lineas.push('')
  }

  if (hc.tratamiento?.length > 0) {
    lineas.push(`*💊 Tratamiento*`)
    hc.tratamiento.forEach(t => {
      let item = `• ${t.farmaco}`
      if (t.dosis) item += ` ${t.dosis}`
      if (t.via) item += ` — ${t.via}`
      if (t.frecuencia) item += ` — c/${t.frecuencia}`
      if (t.duracion_dias) item += ` — ${t.duracion_dias} días`
      lineas.push(item)
      if (t.indicaciones) lineas.push(`  _${t.indicaciones}_`)
    })
    lineas.push('')
  }

  if (hc.indicaciones_cierre?.indicaciones_casa) {
    lineas.push(`*📝 Indicaciones en casa*`)
    lineas.push(hc.indicaciones_cierre.indicaciones_casa)
    lineas.push('')
  }

  if (hc.indicaciones_cierre?.dieta_recomendada) {
    lineas.push(`*🥗 Dieta:* ${hc.indicaciones_cierre.dieta_recomendada}`)
    lineas.push('')
  }

  if (hc.indicaciones_cierre?.proximo_control_dias) {
    const dias = hc.indicaciones_cierre.proximo_control_dias
    const fechaCtrl = new Date(new Date(historia.fecha).getTime() + dias * 86400000)
      .toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })
    lineas.push(`*⏰ Control:* en ${dias} días (${fechaCtrl})`)
    lineas.push('')
  }

  lineas.push(`_Generado por VetIA · Veterinaria Los Pinos_`)
  return lineas.join('\n')
}

function PanelWhatsApp({ paciente, cliente, historias }) {
  const [plantilla, setPlantilla] = useState('seguimiento')
  const [mensaje, setMensaje] = useState('')
  const [copiado, setCopiado] = useState(false)

  const ultimaConsulta = historias[0]
  const proximoControl = ultimaConsulta?.historia_clinica?.indicaciones_cierre?.proximo_control_dias
  const fechaControl = proximoControl
    ? new Date(new Date(ultimaConsulta.fecha).getTime() + proximoControl * 86400000)
        .toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })
    : null
  const diagnostico = ultimaConsulta?.historia_clinica?.diagnostico?.presuntivo
  const primerNombre = cliente?.nombre?.split(' ')[0] ?? 'estimado(a)'

  const plantillas = {
    seguimiento: {
      label: 'Seguimiento post-consulta',
      texto: `Hola ${primerNombre}, le escribimos de Veterinaria Los Pinos 🐾\n\n¿Cómo se encuentra ${paciente.nombre}? Queremos saber cómo va respondiendo al tratamiento${diagnostico ? ` para ${diagnostico.toLowerCase()}` : ''}.\n\nEstamos a su disposición ante cualquier consulta. 😊`,
    },
    control: {
      label: 'Recordatorio de control',
      texto: `Hola ${primerNombre}, le escribimos de Veterinaria Los Pinos 🐾\n\nLe recordamos que ${paciente.nombre} tiene pendiente su consulta de control${fechaControl ? ` para el ${fechaControl}` : ''}.\n\n¿Podría confirmar su asistencia? Muchas gracias 🙏`,
    },
    medicamento: {
      label: 'Recordatorio de medicamento',
      texto: `Hola ${primerNombre}, equipo de Veterinaria Los Pinos 🐾\n\nLe recordamos continuar con el medicamento indicado para ${paciente.nombre} según las indicaciones del médico veterinario.\n\nSi tiene alguna pregunta, con gusto le ayudamos.`,
    },
    personalizado: {
      label: 'Mensaje personalizado',
      texto: `Hola ${primerNombre}, le escribimos de Veterinaria Los Pinos 🐾\n\n`,
    },
  }

  useEffect(() => {
    setMensaje(plantillas[plantilla]?.texto ?? '')
  }, [plantilla, paciente.id, cliente?.id])

  const telefonoLimpio = cliente?.telefono?.replace(/\D/g, '') ?? ''
  const telefonoWa = telefonoLimpio.length === 9
    ? `51${telefonoLimpio}`
    : telefonoLimpio.length >= 10
      ? telefonoLimpio
      : null

  const abrirWhatsApp = () => {
    if (!telefonoWa || !mensaje.trim()) return
    window.open(`https://wa.me/${telefonoWa}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const copiarMensaje = async () => {
    await navigator.clipboard.writeText(mensaje)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header estilo WhatsApp */}
      <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ background: '#075E54' }}>
        <MessageCircle size={14} className="text-white" />
        <p className="text-sm font-bold text-white">Seguimiento WhatsApp</p>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Teléfono */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl">
          <Phone size={13} className="text-slate-400 shrink-0" />
          {telefonoWa ? (
            <span className="text-sm font-medium text-slate-700">{cliente?.telefono}</span>
          ) : (
            <span className="text-sm text-slate-400 italic">Sin número registrado</span>
          )}
        </div>

        {/* Plantilla */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plantilla</p>
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-700"
            value={plantilla}
            onChange={(e) => setPlantilla(e.target.value)}
          >
            {Object.entries(plantillas).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Editor de mensaje */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mensaje</p>
          <textarea
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed text-slate-700"
            rows={8}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
          <p className="text-[10px] text-slate-300 text-right mt-0.5">{mensaje.length} car.</p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={copiarMensaje}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            {copiado
              ? <><Check size={12} className="text-emerald-500" /> Copiado</>
              : <><Copy size={12} /> Copiar</>
            }
          </button>
          <button
            onClick={abrirWhatsApp}
            disabled={!telefonoWa || !mensaje.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl text-white disabled:bg-slate-100 disabled:text-slate-400 transition-colors shadow-sm"
            style={{ background: telefonoWa ? '#25D366' : undefined }}
          >
            <MessageCircle size={13} /> Abrir WhatsApp
          </button>
        </div>

        {!telefonoWa && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <p className="text-xs text-amber-700 leading-relaxed">
              Registra el teléfono del propietario para enviar mensajes directamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const VACUNA_NOMBRES = {
  vacuna: ['Rabia', 'Parvovirus', 'Distemper', 'Leptospirosis', 'Bordetella', 'Leucemia felina', 'Panleucopenia', 'Herpesvirus felino', 'Calicivirus', 'Triple felina', 'Quíntuple canina', 'Séxtuple canina', 'Otra'],
  desparasitacion: ['Ivermectina', 'Praziquantel', 'Milbemicina', 'Selamectina', 'Fenbendazol', 'Moxidectina', 'Otro producto'],
}

function diasRestantesInfo(v) {
  if (!v.proxima_dosis_dias) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaApl = new Date(v.fecha_aplicacion + 'T00:00:00')
  const fechaProx = new Date(fechaApl.getTime() + v.proxima_dosis_dias * 86400000)
  const diff = Math.round((fechaProx - hoy) / 86400000)
  return { diff, fechaProx }
}

function BadgeVacuna({ v }) {
  const info = diasRestantesInfo(v)
  if (!info) return null
  const { diff, fechaProx } = info
  const fecha = fechaProx.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  if (diff < 0) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
      Vencida hace {Math.abs(diff)}d
    </span>
  )
  if (diff === 0) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Hoy</span>
  )
  if (diff <= 14) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">En {diff}d</span>
  )
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{fecha}</span>
  )
}

// ──────────────────────────────────────────────────────────────
// Historial clínico unificado: consultas + vacunas + citas
// ──────────────────────────────────────────────────────────────
const TIPO_CITA_CFG = {
  control:    { label: 'Control',    color: 'bg-blue-50 text-blue-700',       borde: 'border-l-blue-400',    Icono: CalendarCheck },
  consulta:   { label: 'Consulta',   color: 'bg-emerald-50 text-emerald-700', borde: 'border-l-emerald-400', Icono: Stethoscope },
  vacunacion: { label: 'Vacunación', color: 'bg-violet-50 text-violet-700',   borde: 'border-l-violet-400',  Icono: Syringe },
  cirugia:    { label: 'Cirugía',    color: 'bg-red-50 text-red-700',         borde: 'border-l-red-400',     Icono: X },
  otro:       { label: 'Otro',       color: 'bg-slate-100 text-slate-500',    borde: 'border-l-slate-300',   Icono: Calendar },
}

function HistorialClinico({ historias, pacienteId, clienteId, paciente, cliente, toast, onEnviarWa, onEnviarPdf, onExportarPDF, telefonoDisponible }) {
  const navigate = useNavigate()
  const [vacunas,   setVacunas]   = useState([])
  const [citas,     setCitas]     = useState([])
  const [expandida, setExpandida] = useState(null)
  const [formActivo, setFormActivo] = useState(null)   // 'cita' | 'vacuna' | null
  const [guardando, setGuardando] = useState(false)
  const [formCita,  setFormCita]  = useState({ tipo: 'control', fecha_hora: '', motivo: '', notas: '' })
  const [formVacuna,setFormVacuna]= useState({ tipo: 'vacuna', nombre: '', fecha_aplicacion: '', proxima_dosis_dias: '', lote: '', notas: '' })

  const cargar = () =>
    Promise.all([
      fetch(`/api/vacunas?paciente_id=${pacienteId}`).then(r => r.json()),
      fetch(`/api/citas?paciente_id=${pacienteId}`).then(r => r.json()),
    ]).then(([v, c]) => { setVacunas(v); setCitas(c) }).catch(() => {})

  useEffect(() => { cargar() }, [pacienteId])

  const defaultFechaCita = () => {
    const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }
  const abrirForm = (tipo) => {
    setFormActivo(f => f === tipo ? null : tipo)
    if (tipo === 'cita')   setFormCita(f => ({ ...f, fecha_hora: defaultFechaCita() }))
    if (tipo === 'vacuna') setFormVacuna({ tipo: 'vacuna', nombre: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis_dias: '', lote: '', notas: '' })
  }

  const guardarCita = async (e) => {
    e.preventDefault()
    if (!formCita.fecha_hora) return
    setGuardando(true)
    try {
      await fetch('/api/citas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteId, cliente_id: clienteId ?? null,
          fecha_hora: new Date(formCita.fecha_hora).toISOString(),
          tipo: formCita.tipo, motivo: formCita.motivo || null, notas: formCita.notas || null,
        }),
      })
      toast.success('Cita agendada'); setFormActivo(null); cargar()
    } catch { toast.error('Error al agendar') }
    finally { setGuardando(false) }
  }

  const guardarVacuna = async (e) => {
    e.preventDefault()
    if (!formVacuna.nombre.trim() || !formVacuna.fecha_aplicacion) return
    setGuardando(true)
    try {
      await fetch('/api/vacunas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteId, tipo: formVacuna.tipo,
          nombre: formVacuna.nombre, fecha_aplicacion: formVacuna.fecha_aplicacion,
          proxima_dosis_dias: formVacuna.proxima_dosis_dias ? Number(formVacuna.proxima_dosis_dias) : null,
          lote: formVacuna.lote || null, notas: formVacuna.notas || null,
        }),
      })
      toast.success('Registro guardado'); setFormActivo(null); cargar()
    } catch { toast.error('Error al guardar') }
    finally { setGuardando(false) }
  }

  const cambiarEstadoCita = async (id, estado) => {
    try {
      await fetch(`/api/citas/${id}/estado?estado=${estado}`, { method: 'PATCH' })
      setCitas(cs => cs.map(c => c.id === id ? { ...c, estado } : c))
      toast.success(estado === 'completada' ? 'Cita completada' : 'Estado actualizado')
    } catch { toast.error('Error') }
  }

  const eliminarCita = async (id) => {
    try {
      await fetch(`/api/citas/${id}`, { method: 'DELETE' })
      setCitas(cs => cs.filter(c => c.id !== id)); toast.success('Cita eliminada')
    } catch { toast.error('Error') }
  }

  const eliminarVacuna = async (id) => {
    try {
      await fetch(`/api/vacunas/${id}`, { method: 'DELETE' })
      setVacunas(vs => vs.filter(v => v.id !== id)); toast.success('Registro eliminado')
    } catch { toast.error('Error') }
  }

  const setFC = (k, v) => setFormCita(f => ({ ...f, [k]: v }))
  const setFV = (k, v) => setFormVacuna(f => ({ ...f, [k]: v }))

  const fmtFecha = (iso, conHora = false) => {
    const d = new Date(iso)
    const base = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    return conHora ? base + ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : base
  }

  // ── Timeline ─────────────────────────────────────────────────
  const citasProximas = citas
    .filter(c => c.estado === 'pendiente' || c.estado === 'confirmada')
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))

  const eventos = [
    ...historias.map((h, idx) => ({
      _tipo: 'consulta', _fecha: new Date(h.fecha), _id: `h_${h.id}`, _esUltima: idx === 0, ...h,
    })),
    ...vacunas.map(v => ({
      _tipo: 'vacuna', _fecha: new Date(v.fecha_aplicacion + 'T12:00:00'), _id: `v_${v.id}`, ...v,
    })),
    ...citas
      .filter(c => c.estado === 'completada' || c.estado === 'cancelada')
      .map(c => ({ _tipo: 'cita_hist', _fecha: new Date(c.fecha_hora), _id: `c_${c.id}`, ...c })),
  ].sort((a, b) => b._fecha - a._fecha)

  const navNuevaConsulta = () => navigate('/consulta', {
    state: {
      clienteId: cliente?.id, pacienteId: paciente.id,
      nombreCliente: cliente?.nombre ?? '', nombrePaciente: paciente.nombre,
      especie: paciente.especie, raza: paciente.raza ?? '', edad: paciente.edad ?? '',
    },
  })

  const inputCls2 = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"

  return (
    <div>
      {/* Cabecera con acciones */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historial clínico</h2>
        <div className="flex gap-2">
          <button onClick={() => abrirForm('cita')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${formActivo === 'cita' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
            <Calendar size={12} /> Agendar cita
          </button>
          <button onClick={() => abrirForm('vacuna')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${formActivo === 'vacuna' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
            <Syringe size={12} /> Vacuna / Desparasitación
          </button>
        </div>
      </div>

      {/* Formulario inline: nueva cita */}
      {formActivo === 'cita' && (
        <form onSubmit={guardarCita}
          className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-3 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Nueva cita</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
              <select value={formCita.tipo} onChange={e => setFC('tipo', e.target.value)} className={inputCls2}>
                {Object.entries(TIPO_CITA_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha y hora *</label>
              <input type="datetime-local" value={formCita.fecha_hora} onChange={e => setFC('fecha_hora', e.target.value)}
                className={inputCls2} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Motivo</label>
            <input type="text" value={formCita.motivo} onChange={e => setFC('motivo', e.target.value)}
              placeholder="Ej: Control post-tratamiento…" className={inputCls2} maxLength={300} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={guardando}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl">
              {guardando ? 'Guardando…' : 'Confirmar cita'}
            </button>
            <button type="button" onClick={() => setFormActivo(null)}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white rounded-xl">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Formulario inline: vacuna / desparasitación */}
      {formActivo === 'vacuna' && (
        <form onSubmit={guardarVacuna}
          className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 mb-3 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Nueva vacuna / desparasitación</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
              <select value={formVacuna.tipo} onChange={e => setFV('tipo', e.target.value)} className={inputCls2}>
                <option value="vacuna">Vacuna</option>
                <option value="desparasitacion">Desparasitación</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha de aplicación *</label>
              <input type="date" value={formVacuna.fecha_aplicacion} onChange={e => setFV('fecha_aplicacion', e.target.value)}
                className={inputCls2} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre / producto *</label>
            <input type="text" list="vacuna-nombres" value={formVacuna.nombre} onChange={e => setFV('nombre', e.target.value)}
              placeholder="Ej: Triple felina, Milbemax…" className={inputCls2} required />
            <datalist id="vacuna-nombres">
              {(VACUNA_NOMBRES[formVacuna.tipo] ?? []).map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Próxima dosis (días)</label>
              <input type="number" min="1" value={formVacuna.proxima_dosis_dias} onChange={e => setFV('proxima_dosis_dias', e.target.value)}
                placeholder="365" className={inputCls2} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Lote</label>
              <input type="text" value={formVacuna.lote} onChange={e => setFV('lote', e.target.value)}
                placeholder="Opcional" className={inputCls2} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={guardando}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl">
              {guardando ? 'Guardando…' : 'Guardar registro'}
            </button>
            <button type="button" onClick={() => setFormActivo(null)}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white rounded-xl">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ── Citas próximas ────────────────────────────────────── */}
      {citasProximas.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Citas programadas</p>
          {citasProximas.map(cita => {
            const cfg = TIPO_CITA_CFG[cita.tipo] ?? TIPO_CITA_CFG.otro
            const { Icono } = cfg
            const vencida = new Date(cita.fecha_hora) < new Date()
            return (
              <div key={cita.id}
                className={`flex gap-0 rounded-2xl overflow-hidden border shadow-sm
                  ${cita.estado === 'confirmada' ? 'border-emerald-100' : vencida ? 'border-red-100' : 'border-blue-100'}`}>
                <div className={`w-1 shrink-0 ${cita.estado === 'confirmada' ? 'bg-emerald-400' : vencida ? 'bg-red-400' : 'bg-blue-400'}`} />
                <div className={`flex-1 flex items-center gap-3 px-4 py-3
                  ${cita.estado === 'confirmada' ? 'bg-emerald-50' : vencida ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icono size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">{fmtFecha(cita.fecha_hora, true)}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {vencida && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Vencida</span>}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cita.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                    {cita.motivo && <p className="text-xs text-slate-500 mt-0.5 truncate">{cita.motivo}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {cita.estado === 'pendiente' && (
                      <button onClick={() => cambiarEstadoCita(cita.id, 'confirmada')} title="Confirmar"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-100">
                        <Check size={13} />
                      </button>
                    )}
                    <button onClick={() => cambiarEstadoCita(cita.id, 'completada')} title="Completar"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100">
                      <CalendarCheck size={13} />
                    </button>
                    <button onClick={() => eliminarCita(cita.id)} title="Eliminar"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Timeline de eventos pasados ───────────────────────── */}
      {eventos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <FileText size={20} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600 mb-1">Sin registros aún</p>
          <p className="text-sm text-slate-400 mb-4">Registra la primera consulta para este paciente</p>
          <button onClick={navNuevaConsulta}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl">
            <ClipboardPlus size={14} /> Nueva consulta
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Línea vertical de tiempo */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-100" />

          <div className="space-y-2">
            {eventos.map(ev => {
              if (ev._tipo === 'consulta') {
                const isOpen = expandida === ev._id
                const hc = ev.historia_clinica
                const tiempoIA = (ev.duracion_transcripcion_ms ?? 0) + (ev.duracion_extraccion_ms ?? 0)
                return (
                  <div key={ev._id}
                    className="relative flex gap-3">
                    {/* Nodo en la línea */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 border-2
                      ${ev._esUltima ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200'}`}>
                      <Stethoscope size={15} className={ev._esUltima ? 'text-white' : 'text-slate-400'} />
                    </div>

                    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      {/* Cabecera clickeable */}
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => setExpandida(isOpen ? null : ev._id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {hc?.diagnostico?.presuntivo ?? 'Sin diagnóstico'}
                            </p>
                            {ev._esUltima && (
                              <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                Última
                              </span>
                            )}
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">
                              Consulta
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock size={10} /> {fmtFecha(ev.fecha, true)}
                            </span>
                            {tiempoIA > 0 && (
                              <>
                                <span className="text-slate-200">·</span>
                                <span className="text-xs text-slate-400">{ms(tiempoIA)} IA</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={e => { e.stopPropagation(); onExportarPDF(ev) }} title="Descargar PDF"
                            className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Download size={14} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); onEnviarWa(ev) }}
                            title={telefonoDisponible ? 'WhatsApp' : 'Copiar resumen'}
                            className="p-1.5 text-slate-300 hover:text-green-500 hover:bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <MessageCircle size={14} />
                          </button>
                          <div className="p-1.5 text-slate-300 group-hover:text-slate-500 rounded-lg transition-colors">
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-slate-50">
                          <DetalleConsulta historia={ev} />
                          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Compartir</span>
                            <button onClick={() => onEnviarWa(ev)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors">
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button onClick={() => onExportarPDF(ev)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm">
                              <Download size={12} /> PDF
                            </button>
                            <button onClick={() => onEnviarPdf(ev)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors shadow-sm"
                              style={{ background: '#25D366' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1ebe5d'}
                              onMouseLeave={e => e.currentTarget.style.background = '#25D366'}>
                              <MessageCircle size={12} /> PDF + chat
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              if (ev._tipo === 'vacuna') {
                const esDespara = ev.tipo === 'desparasitacion'
                return (
                  <div key={ev._id} className="relative flex gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 border-2 bg-white
                      ${esDespara ? 'border-teal-200' : 'border-violet-200'}`}>
                      <Syringe size={14} className={esDespara ? 'text-teal-500' : 'text-violet-500'} />
                    </div>
                    <div className={`flex-1 flex items-center gap-3 bg-white rounded-2xl border shadow-sm px-4 py-3
                      ${esDespara ? 'border-teal-100' : 'border-violet-100'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 truncate">{ev.nombre}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0
                            ${esDespara ? 'bg-teal-50 text-teal-700' : 'bg-violet-50 text-violet-700'}`}>
                            {esDespara ? 'Desparasitación' : 'Vacuna'}
                          </span>
                          <BadgeVacuna v={ev} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={10} /> {fmtFecha(ev.fecha_aplicacion + 'T00:00:00')}
                          </span>
                          {ev.lote && <span className="text-xs text-slate-400">Lote: {ev.lote}</span>}
                        </div>
                        {ev.notas && <p className="text-xs text-slate-400 mt-0.5 truncate">{ev.notas}</p>}
                      </div>
                      <button onClick={() => eliminarVacuna(ev.id)} title="Eliminar"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-200 hover:bg-red-50 hover:text-red-500 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              }

              if (ev._tipo === 'cita_hist') {
                const cfg = TIPO_CITA_CFG[ev.tipo] ?? TIPO_CITA_CFG.otro
                const { Icono } = cfg
                const cancelada = ev.estado === 'cancelada'
                return (
                  <div key={ev._id} className={`relative flex gap-3 ${cancelada ? 'opacity-50' : ''}`}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 border-2 bg-white border-slate-200">
                      <Icono size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cancelada ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            {cancelada ? 'Cancelada' : 'Completada'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={10} /> {fmtFecha(ev.fecha_hora, true)}
                          </span>
                        </div>
                        {ev.motivo && <p className="text-xs text-slate-400 mt-0.5 truncate">{ev.motivo}</p>}
                      </div>
                      <button onClick={() => eliminarCita(ev.id)} title="Eliminar"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-200 hover:bg-red-50 hover:text-red-500 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}


export default function PacientePerfilPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [paciente, setPaciente] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [historias, setHistorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalEdit, setModalEdit] = useState(false)
  const [formPaciente, setFormPaciente] = useState({ nombre: '', especie: '', raza: '', edad: '', sexo: '' })
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const p = await fetch(`/api/pacientes/${id}`).then(r => {
          if (!r.ok) throw new Error('not found')
          return r.json()
        })
        const [c, h] = await Promise.all([
          fetch(`/api/clientes/${p.cliente_id}`).then(r => r.json()),
          fetch(`/api/historias?paciente_id=${id}`).then(r => r.json()),
        ])
        setPaciente(p)
        setCliente(c)
        setHistorias(h)
      } catch {
        navigate('/pacientes')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, navigate])

  const abrirEdit = () => {
    setFormPaciente({
      nombre: paciente.nombre, especie: paciente.especie,
      raza: paciente.raza ?? '', edad: paciente.edad ?? '', sexo: paciente.sexo ?? '',
    })
    setModalEdit(true)
  }

  const guardarEdicion = async () => {
    if (!formPaciente.nombre.trim() || !formPaciente.especie) return
    setGuardandoEdit(true)
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formPaciente.nombre, especie: formPaciente.especie,
          raza: formPaciente.raza || null, edad: formPaciente.edad || null, sexo: formPaciente.sexo || null,
        }),
      })
      if (!res.ok) { toast.error('Error al guardar'); return }
      const actualizado = await res.json()
      setPaciente(actualizado)
      setModalEdit(false)
      toast.success('Datos actualizados correctamente')
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setGuardandoEdit(false)
    }
  }

  if (cargando) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-36 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!paciente) return null

  const cfg = ESPECIE_CONFIG[paciente.especie] ?? ESPECIE_CONFIG.Otro
  const ultimaVisita = historias[0]
    ? new Date(historias[0].fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : null
  const primeraVisita = historias.length > 0
    ? new Date(historias[historias.length - 1].fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const telLimpio = cliente?.telefono?.replace(/\D/g, '') ?? ''
  const telefonoWaGlobal = telLimpio.length === 9 ? `51${telLimpio}` : telLimpio.length >= 10 ? telLimpio : null

  const enviarHistoriaWa = (h) => {
    const msg = generarMensajeHistoria(h, paciente)
    if (telefonoWaGlobal) {
      window.open(`https://wa.me/${telefonoWaGlobal}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      navigator.clipboard.writeText(msg)
      toast.success('Historia copiada al portapapeles (sin número de teléfono registrado)')
    }
  }

  const enviarPdfYWa = (h) => {
    exportarHistoriaPDF(h, paciente, cliente)
    const fecha = new Date(h.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    const dx = h.historia_clinica?.diagnostico?.presuntivo
    const primerNombre = cliente?.nombre?.split(' ')[0] ?? 'estimado(a)'
    const msg = [
      `Hola ${primerNombre}, le compartimos la historia clínica de *${paciente.nombre}* de la consulta del ${fecha}.`,
      dx ? `\nDiagnóstico: ${dx}` : '',
      `\n_Adjuntamos el PDF con todos los detalles._\n\n— Veterinaria Los Pinos 🐾`,
    ].join('')
    if (telefonoWaGlobal) {
      setTimeout(() => {
        window.open(`https://wa.me/${telefonoWaGlobal}?text=${encodeURIComponent(msg)}`, '_blank')
      }, 1200)
    } else {
      toast.success('PDF generado — registra el teléfono del propietario para abrir WhatsApp automáticamente')
    }
  }

  const printHistoria = (h) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Historia Clínica — ${paciente.nombre}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 24px; }
  h1 { font-size: 16px; color: #059669; } h2 { font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 14px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; } td, th { padding: 3px 6px; border: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-weight: bold; font-size: 10px; } td.label { color: #64748b; width: 120px; }
  .anormal { color: #dc2626; font-weight: bold; } .normal { color: #16a34a; } .ne { color: #94a3b8; }
  .dx-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; margin: 8px 0; }
  .transcripcion { background: #1e293b; color: #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 10px; line-height: 1.5; margin: 6px 0; }
  @media print { body { padding: 12px; } }
</style></head><body>
<h1>Historia Clínica — ${paciente.nombre} (${paciente.especie})</h1>
<p style="font-size:10px;color:#64748b">N.° ${h.id} · ${new Date(h.fecha).toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })} · Veterinaria Los Pinos</p>
<h2>Propietario</h2>
<table><tr><td class="label">Nombre</td><td>${cliente?.nombre ?? '—'}</td></tr>${cliente?.dni ? `<tr><td class="label">DNI</td><td>${cliente.dni}</td></tr>` : ''}${cliente?.telefono ? `<tr><td class="label">Teléfono</td><td>${cliente.telefono}</td></tr>` : ''}</table>
<h2>Diagnóstico</h2>
<div class="dx-box"><strong>Presuntivo:</strong> ${h.historia_clinica.diagnostico.presuntivo ?? '—'}</div>
<div class="transcripcion"><strong style="color:#94a3b8;font-size:9px;text-transform:uppercase">Transcripción original</strong><br><br>${h.transcripcion}</div>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(htmlContent)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Volver */}
      <button onClick={() => navigate('/pacientes')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Todos los pacientes
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
      {/* Columna izquierda */}
      <div>

      {/* Header del paciente */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0">
            {cfg.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{paciente.nombre}</h1>
              <button onClick={abrirEdit}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                <Pencil size={12} /> Editar
              </button>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${cfg.color}`}>
                {paciente.especie}
              </span>
              {paciente.sexo && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                  {paciente.sexo}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {[paciente.raza, paciente.edad].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
            </p>
          </div>
          <button
            onClick={() => navigate('/consulta', {
              state: {
                clienteId: cliente?.id,
                pacienteId: paciente.id,
                nombreCliente: cliente?.nombre ?? '',
                nombrePaciente: paciente.nombre,
                especie: paciente.especie,
                raza: paciente.raza ?? '',
                edad: paciente.edad ?? '',
              },
            })}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors">
            <ClipboardPlus size={14} /> Nueva consulta
          </button>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{historias.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Consulta{historias.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-sm font-bold text-slate-700 leading-tight">
              {ultimaVisita ?? '—'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Última visita</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700 leading-tight">
              {primeraVisita ?? '—'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Primera visita</p>
          </div>
        </div>
      </div>

      {/* Propietario */}
      {cliente && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Propietario</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{cliente.nombre}</p>
              <div className="flex flex-wrap items-center gap-3 mt-0.5">
                {cliente.dni && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <CreditCard size={11} className="text-slate-400" /> {cliente.dni}
                  </span>
                )}
                {cliente.telefono && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Phone size={11} /> {cliente.telefono}
                  </span>
                )}
                {cliente.email && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Mail size={11} /> {cliente.email}
                  </span>
                )}
                {cliente.direccion && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} /> {cliente.direccion}
                  </span>
                )}
                {!cliente.dni && !cliente.telefono && !cliente.email && (
                  <span className="text-xs text-slate-300">Sin contacto registrado</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evolución de signos vitales */}
      {historias.length > 0 && <SignosVitales historias={historias} />}

      {/* Historial clínico unificado: consultas + vacunas + citas */}
      <HistorialClinico
        historias={historias}
        pacienteId={Number(id)}
        clienteId={paciente?.cliente_id}
        paciente={paciente}
        cliente={cliente}
        toast={toast}
        onEnviarWa={enviarHistoriaWa}
        onEnviarPdf={enviarPdfYWa}
        onExportarPDF={(h) => exportarHistoriaPDF(h, paciente, cliente)}
        telefonoDisponible={!!telefonoWaGlobal}
      />

      </div>{/* fin columna izquierda */}

      {/* Columna derecha — WhatsApp */}
      <div className="xl:sticky xl:top-6">
        <PanelWhatsApp paciente={paciente} cliente={cliente} historias={historias} />
      </div>

      </div>{/* fin grid */}

      {/* Modal editar paciente */}
      {modalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalEdit(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">Editar paciente</h2>
                <p className="text-xs text-slate-400 mt-0.5">Modifica los datos de {paciente.nombre}</p>
              </div>
              <button onClick={() => setModalEdit(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormCampo label="Nombre" required>
                  <input className={inputCls} value={formPaciente.nombre}
                    onChange={(e) => setFormPaciente({ ...formPaciente, nombre: e.target.value })} />
                </FormCampo>
                <FormCampo label="Especie" required>
                  <select className={inputCls} value={formPaciente.especie}
                    onChange={(e) => setFormPaciente({ ...formPaciente, especie: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {ESPECIES.map(e => <option key={e} value={e}>{ESPECIE_CONFIG[e]?.emoji} {e}</option>)}
                  </select>
                </FormCampo>
                <FormCampo label="Raza">
                  <input className={inputCls} placeholder="Ej: Labrador"
                    value={formPaciente.raza}
                    onChange={(e) => setFormPaciente({ ...formPaciente, raza: e.target.value })} />
                </FormCampo>
                <FormCampo label="Edad">
                  <input className={inputCls} placeholder="Ej: 3 años"
                    value={formPaciente.edad}
                    onChange={(e) => setFormPaciente({ ...formPaciente, edad: e.target.value })} />
                </FormCampo>
                <div className="col-span-2">
                  <FormCampo label="Sexo">
                    <select className={inputCls} value={formPaciente.sexo}
                      onChange={(e) => setFormPaciente({ ...formPaciente, sexo: e.target.value })}>
                      <option value="">No indicado</option>
                      <option>Macho</option><option>Hembra</option>
                      <option>Macho castrado</option><option>Hembra esterilizada</option>
                    </select>
                  </FormCampo>
                </div>
              </div>
              <button onClick={guardarEdicion}
                disabled={!formPaciente.nombre.trim() || !formPaciente.especie || guardandoEdit}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-sm">
                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
