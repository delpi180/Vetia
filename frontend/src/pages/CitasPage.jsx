import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Plus, X, Check, Clock, ChevronDown,
  Pencil, Trash2, AlertCircle, CalendarCheck, Filter,
  ArrowRight, Stethoscope, Syringe, Scissors, HelpCircle,
} from 'lucide-react'
import { useToast } from '../components/Toast'

const TIPO_LABEL = {
  control:    { label: 'Control',     color: 'bg-blue-50 text-blue-700',    icono: CalendarCheck },
  consulta:   { label: 'Consulta',    color: 'bg-emerald-50 text-emerald-700', icono: Stethoscope },
  vacunacion: { label: 'Vacunación',  color: 'bg-violet-50 text-violet-700', icono: Syringe },
  cirugia:    { label: 'Cirugía',     color: 'bg-red-50 text-red-700',      icono: Scissors },
  otro:       { label: 'Otro',        color: 'bg-slate-100 text-slate-600', icono: HelpCircle },
}

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmada: { label: 'Confirmada', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  completada: { label: 'Completada', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelada:  { label: 'Cancelada',  color: 'bg-slate-100 text-slate-500 border border-slate-200' },
}

const ESPECIE_EMOJI = { Canino: '🐕', Felino: '🐈', Ave: '🐦', Roedor: '🐹', Reptil: '🦎' }
const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white placeholder-slate-400"

function formatFecha(iso) {
  const d = new Date(iso)
  const hoy = new Date()
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
  const esHoy = d.toDateString() === hoy.toDateString()
  const esManana = d.toDateString() === manana.toDateString()
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  if (esHoy) return `Hoy · ${hora}`
  if (esManana) return `Mañana · ${hora}`
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) + ` · ${hora}`
}

function agruparCitas(citas) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
  const semana = new Date(hoy); semana.setDate(hoy.getDate() + 7)

  const grupos = { vencidas: [], hoy: [], manana: [], semana: [], futuras: [], completadas: [], canceladas: [] }
  for (const c of citas) {
    const f = new Date(c.fecha_hora)
    if (c.estado === 'completada') { grupos.completadas.push(c); continue }
    if (c.estado === 'cancelada')  { grupos.canceladas.push(c); continue }
    const fd = new Date(f); fd.setHours(0, 0, 0, 0)
    if (fd < hoy) grupos.vencidas.push(c)
    else if (fd.getTime() === hoy.getTime()) grupos.hoy.push(c)
    else if (fd.getTime() === manana.getTime()) grupos.manana.push(c)
    else if (fd <= semana) grupos.semana.push(c)
    else grupos.futuras.push(c)
  }
  return grupos
}

// ──────────────────────────────────────────────────────────────
// Formulario de crear / editar cita
// ──────────────────────────────────────────────────────────────
function FormCita({ inicial, pacientes, clientes, onGuardar, onCancelar, guardando }) {
  const ahora = new Date()
  ahora.setMinutes(ahora.getMinutes() + 60 - (ahora.getMinutes() % 30)) // próximo :00 o :30
  const defaultFecha = inicial?.fecha_hora
    ? new Date(inicial.fecha_hora).toISOString().slice(0, 16)
    : ahora.toISOString().slice(0, 16)

  const [form, setForm] = useState({
    paciente_id: inicial?.paciente_id ?? '',
    tipo: inicial?.tipo ?? 'control',
    fecha_hora: defaultFecha,
    motivo: inicial?.motivo ?? '',
    notas: inicial?.notas ?? '',
    estado: inicial?.estado ?? 'pendiente',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const pacienteSeleccionado = pacientes.find(p => p.id === Number(form.paciente_id))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.paciente_id || !form.fecha_hora) return
    const clienteId = pacienteSeleccionado?.cliente_id ?? null
    onGuardar({
      paciente_id: Number(form.paciente_id),
      cliente_id: clienteId,
      fecha_hora: new Date(form.fecha_hora).toISOString(),
      tipo: form.tipo,
      motivo: form.motivo || null,
      notas: form.notas || null,
      estado: form.estado,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Paciente *</label>
        <select value={form.paciente_id} onChange={e => set('paciente_id', e.target.value)}
          className={inputCls} required>
          <option value="">Seleccionar paciente…</option>
          {pacientes.map(p => {
            const c = clientes.find(cl => cl.id === p.cliente_id)
            return (
              <option key={p.id} value={p.id}>
                {ESPECIE_EMOJI[p.especie] ?? '🐾'} {p.nombre} — {c?.nombre ?? 'Sin propietario'}
              </option>
            )
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo *</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
            {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estado</label>
          <select value={form.estado} onChange={e => set('estado', e.target.value)} className={inputCls}>
            {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha y hora *</label>
        <input type="datetime-local" value={form.fecha_hora} onChange={e => set('fecha_hora', e.target.value)}
          className={inputCls} required />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Motivo</label>
        <input type="text" value={form.motivo} onChange={e => set('motivo', e.target.value)}
          placeholder="Ej: Control post-operatorio, revisión de tratamiento…"
          className={inputCls} maxLength={300} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notas internas</label>
        <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
          rows={2} placeholder="Observaciones adicionales…"
          className={`${inputCls} resize-none`} />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={guardando || !form.paciente_id || !form.fecha_hora}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
          {guardando ? 'Guardando…' : inicial ? 'Actualizar cita' : 'Agendar cita'}
        </button>
        <button type="button" onClick={onCancelar}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────────────────────
// Fila de cita
// ──────────────────────────────────────────────────────────────
function FilaCita({ cita, onEstado, onEditar, onEliminar }) {
  const tipo = TIPO_LABEL[cita.tipo] ?? TIPO_LABEL.otro
  const estado = ESTADO_CONFIG[cita.estado] ?? ESTADO_CONFIG.pendiente
  const TipoIcono = tipo.icono
  const vencida = cita.estado === 'pendiente' && new Date(cita.fecha_hora) < new Date()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors
      ${vencida ? 'border-l-2 border-red-400' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tipo.color}`}>
        <TipoIcono size={15} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/pacientes/${cita.paciente_id}`}
            className="text-sm font-semibold text-slate-800 hover:text-emerald-700 truncate">
            {ESPECIE_EMOJI[cita.paciente_especie] ?? '🐾'} {cita.paciente_nombre ?? '—'}
          </Link>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${tipo.color}`}>
            {tipo.label}
          </span>
          {vencida && (
            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full shrink-0">
              Vencida
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock size={10} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500">{formatFecha(cita.fecha_hora)}</span>
          {cita.motivo && <span className="text-xs text-slate-400 truncate">· {cita.motivo}</span>}
        </div>
        {cita.cliente_nombre && (
          <p className="text-[11px] text-slate-400 mt-0.5">Propietario: {cita.cliente_nombre}</p>
        )}
      </div>

      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${estado.color}`}>
        {estado.label}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        {cita.estado === 'pendiente' && (
          <button onClick={() => onEstado(cita.id, 'confirmada')} title="Confirmar"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
            <Check size={13} />
          </button>
        )}
        {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
          <button onClick={() => onEstado(cita.id, 'completada')} title="Completar"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors">
            <CalendarCheck size={13} />
          </button>
        )}
        <button onClick={() => onEditar(cita)} title="Editar"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={() => onEliminar(cita.id)} title="Eliminar"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Grupo de citas con cabecera colapsable
// ──────────────────────────────────────────────────────────────
function GrupoCitas({ titulo, citas, urgente, onEstado, onEditar, onEliminar, defaultOpen = true }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  if (citas.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          {urgente && <AlertCircle size={13} className="text-red-500" />}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{titulo}</span>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${urgente ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
            {citas.length}
          </span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className="divide-y divide-slate-50">
          {citas.map(c => (
            <FilaCita key={c.id} cita={c} onEstado={onEstado} onEditar={onEditar} onEliminar={onEliminar} />
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────────────────
const FILTROS = [
  { id: 'activas',    label: 'Activas' },
  { id: 'hoy',        label: 'Hoy' },
  { id: 'semana',     label: 'Esta semana' },
  { id: 'todas',      label: 'Todas' },
  { id: 'completadas',label: 'Completadas' },
  { id: 'canceladas', label: 'Canceladas' },
]

export default function CitasPage() {
  const { toast } = useToast()
  const [citas, setCitas]         = useState([])
  const [pacientes, setPacientes] = useState([])
  const [clientes, setClientes]   = useState([])
  const [cargando, setCargando]   = useState(true)
  const [filtro, setFiltro]       = useState('activas')
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [editando, setEditando]   = useState(null)   // cita a editar, o null = crear
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [c, p, cl] = await Promise.all([
        fetch('/api/citas').then(r => r.json()),
        fetch('/api/pacientes').then(r => r.json()),
        fetch('/api/clientes').then(r => r.json()),
      ])
      setCitas(c)
      setPacientes(p)
      setClientes(cl)
    } catch { toast('Error al cargar citas', 'error') }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleGuardar = async (datos) => {
    setGuardando(true)
    try {
      if (editando) {
        await fetch(`/api/citas/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        })
        toast('Cita actualizada', 'success')
      } else {
        await fetch('/api/citas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        })
        toast('Cita agendada', 'success')
      }
      setPanelAbierto(false)
      setEditando(null)
      cargar()
    } catch { toast('Error al guardar', 'error') }
    finally { setGuardando(false) }
  }

  const handleEstado = async (id, estado) => {
    try {
      await fetch(`/api/citas/${id}/estado?estado=${estado}`, { method: 'PATCH' })
      setCitas(cs => cs.map(c => c.id === id ? { ...c, estado } : c))
      toast(`Cita ${ESTADO_CONFIG[estado]?.label.toLowerCase() ?? estado}`, 'success')
    } catch { toast('Error al cambiar estado', 'error') }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta cita?')) return
    try {
      await fetch(`/api/citas/${id}`, { method: 'DELETE' })
      setCitas(cs => cs.filter(c => c.id !== id))
      toast('Cita eliminada', 'success')
    } catch { toast('Error al eliminar', 'error') }
  }

  const handleEditar = (cita) => {
    setEditando(cita)
    setPanelAbierto(true)
  }

  const abrirNueva = () => {
    setEditando(null)
    setPanelAbierto(true)
  }

  // ── Filtrado ───────────────────────────────────────────────
  const ahora = new Date()
  const inicioSemana = new Date(ahora)
  inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1)
  const finSemana = new Date(inicioSemana); finSemana.setDate(inicioSemana.getDate() + 6)

  const citasFiltradas = citas.filter(c => {
    const f = new Date(c.fecha_hora)
    if (filtro === 'activas') return c.estado !== 'cancelada' && c.estado !== 'completada'
    if (filtro === 'hoy') return f.toDateString() === ahora.toDateString() && c.estado !== 'cancelada'
    if (filtro === 'semana') return f >= inicioSemana && f <= finSemana && c.estado !== 'cancelada'
    if (filtro === 'completadas') return c.estado === 'completada'
    if (filtro === 'canceladas') return c.estado === 'cancelada'
    return true // todas
  })

  const grupos = agruparCitas(citasFiltradas)
  const totalUrgentes = grupos.vencidas.length + grupos.hoy.length

  // Conteo para badge de "Hoy"
  const totalHoy = citas.filter(c =>
    new Date(c.fecha_hora).toDateString() === ahora.toDateString() && c.estado !== 'cancelada'
  ).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda de citas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada').length} citas activas ·{' '}
            {totalHoy} hoy
          </p>
        </div>
        <button onClick={abrirNueva}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} /> Nueva cita
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              filtro === f.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f.label}
            {f.id === 'hoy' && totalHoy > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filtro === f.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>{totalHoy}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center px-6">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm font-semibold text-slate-600 mb-1">No hay citas en esta vista</p>
          <p className="text-xs text-slate-400 mb-5">Cambia el filtro o agenda una nueva cita</p>
          <button onClick={abrirNueva}
            className="inline-flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus size={15} /> Agendar cita
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <GrupoCitas titulo="Vencidas — requieren atención" citas={grupos.vencidas}
            urgente onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
          <GrupoCitas titulo="Hoy" citas={grupos.hoy}
            urgente={grupos.hoy.length > 0} onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
          <GrupoCitas titulo="Mañana" citas={grupos.manana}
            onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
          <GrupoCitas titulo="Esta semana" citas={grupos.semana}
            onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
          <GrupoCitas titulo="Próximas" citas={grupos.futuras}
            onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
          <GrupoCitas titulo="Completadas" citas={grupos.completadas} defaultOpen={false}
            onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
          <GrupoCitas titulo="Canceladas" citas={grupos.canceladas} defaultOpen={false}
            onEstado={handleEstado} onEditar={handleEditar} onEliminar={handleEliminar} />
        </div>
      )}

      {/* Panel lateral — crear / editar */}
      {panelAbierto && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => { setPanelAbierto(false); setEditando(null) }} />
          <div className="w-full max-w-sm bg-white shadow-xl flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">{editando ? 'Editar cita' : 'Nueva cita'}</h2>
              <button onClick={() => { setPanelAbierto(false); setEditando(null) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex-1">
              <FormCita
                inicial={editando}
                pacientes={pacientes}
                clientes={clientes}
                onGuardar={handleGuardar}
                onCancelar={() => { setPanelAbierto(false); setEditando(null) }}
                guardando={guardando}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
