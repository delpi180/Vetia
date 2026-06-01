import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardPlus, Users, PawPrint, Syringe,
  ArrowRight, Mic, Calendar, CalendarCheck, Clock,
  Stethoscope, Scissors, HelpCircle, Plus, Check, Bell,
} from 'lucide-react'

const ESPECIE_EMOJI = { Canino: '🐕', Felino: '🐈', Ave: '🐦', Roedor: '🐹', Reptil: '🦎' }
const ESPECIE_COLOR = {
  Canino: 'bg-amber-100 text-amber-700',
  Felino: 'bg-violet-100 text-violet-700',
  Ave:    'bg-sky-100 text-sky-700',
  Roedor: 'bg-orange-100 text-orange-700',
  Reptil: 'bg-green-100 text-green-700',
}

const TIPO_CITA = {
  control:    { label: 'Control',    badge: 'bg-blue-50 text-blue-700',       borde: 'border-l-blue-400',    punto: 'bg-blue-400',    Icono: CalendarCheck },
  consulta:   { label: 'Consulta',   badge: 'bg-emerald-50 text-emerald-700', borde: 'border-l-emerald-400', punto: 'bg-emerald-400', Icono: Stethoscope },
  vacunacion: { label: 'Vacunación', badge: 'bg-violet-50 text-violet-700',   borde: 'border-l-violet-400',  punto: 'bg-violet-400',  Icono: Syringe },
  cirugia:    { label: 'Cirugía',    badge: 'bg-red-50 text-red-700',         borde: 'border-l-red-400',     punto: 'bg-red-400',     Icono: Scissors },
  otro:       { label: 'Otro',       badge: 'bg-slate-100 text-slate-500',    borde: 'border-l-slate-300',   punto: 'bg-slate-300',   Icono: HelpCircle },
}

const ESTADO_BADGE = {
  pendiente:  'bg-amber-50 text-amber-700 border border-amber-200',
  confirmada: 'bg-blue-50 text-blue-700 border border-blue-200',
  completada: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function fechaHoy() {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function labelDia(fechaIso) {
  const d  = new Date(fechaIso)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fd  = new Date(d); fd.setHours(0, 0, 0, 0)
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
  if (fd.getTime() === manana.getTime()) return 'Mañana'
  return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })
}

function agruparProximas(citas) {
  const grupos = {}
  for (const c of citas) {
    const key = new Date(c.fecha_hora).toDateString()
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(c)
  }
  return Object.entries(grupos).sort((a, b) => new Date(a[0]) - new Date(b[0]))
}

function StatCard({ icono: Icono, valor, label, sublabel, color, bg, to }) {
  const card = (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icono size={18} className={color} />
      </div>
      <p className="text-3xl font-bold text-slate-800 leading-none">{valor ?? '—'}</p>
      <p className="text-sm font-semibold text-slate-600 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

// ──────────────────────────────────────────────────────────────
// Panel unificado: Agenda + pendientes clínicos
// ──────────────────────────────────────────────────────────────
function PanelAgenda({ citasHoy, citasProximas, alertas, onConfirmar, onCompletar }) {
  const ahora = new Date()
  const totalUrgentes = alertas.filter(a => a.diasRestantes <= 2).length
  const gruposProximas = agruparProximas(citasProximas)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          <span className="font-bold text-slate-800">Agenda y seguimiento</span>
          {(citasHoy.length + citasProximas.length) > 0 && (
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {citasHoy.length + citasProximas.length}
            </span>
          )}
        </div>
        <Link to="/citas" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">
          Ver agenda <ArrowRight size={11} />
        </Link>
      </div>

      {/* ── HOY ──────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hoy</span>
          {citasHoy.length > 0 && (
            <span className="text-[11px] text-slate-400">{citasHoy.length} cita{citasHoy.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {citasHoy.length === 0 ? (
          <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Calendar size={14} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500">Sin citas para hoy</p>
            </div>
            <Link to="/citas"
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 shrink-0">
              <Plus size={11} /> Agendar
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {citasHoy.map(cita => {
              const cfg = TIPO_CITA[cita.tipo] ?? TIPO_CITA.otro
              const { Icono } = cfg
              const hora = new Date(cita.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
              const completada = cita.estado === 'completada'

              return (
                <div key={cita.id}
                  className={`flex gap-0 rounded-xl overflow-hidden border border-slate-100 ${completada ? 'opacity-50' : ''}`}>
                  {/* Franja de color lateral */}
                  <div className={`w-1 shrink-0 border-l-4 rounded-l-xl ${cfg.borde}`} />

                  <div className="flex items-center gap-3 flex-1 px-3 py-3">
                    {/* Hora */}
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-base font-bold text-slate-700 leading-none">{hora}</p>
                    </div>

                    {/* Icono tipo */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.badge}`}>
                      <Icono size={13} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/pacientes/${cita.paciente_id}`}
                        className="text-sm font-bold text-slate-800 hover:text-emerald-700 truncate block leading-tight">
                        {ESPECIE_EMOJI[cita.paciente_especie] ?? '🐾'} {cita.paciente_nombre ?? '—'}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {cita.estado !== 'completada' && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ESTADO_BADGE[cita.estado] ?? ''}`}>
                            {cita.estado === 'pendiente' ? 'Pendiente' : 'Confirmada'}
                          </span>
                        )}
                      </div>
                      {cita.motivo && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{cita.motivo}</p>
                      )}
                    </div>

                    {/* Acciones */}
                    {!completada && (
                      <div className="flex gap-1 shrink-0">
                        {cita.estado === 'pendiente' && (
                          <button onClick={() => onConfirmar(cita.id)} title="Confirmar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                            <Check size={13} />
                          </button>
                        )}
                        <button onClick={() => onCompletar(cita.id)} title="Marcar completada"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <CalendarCheck size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── PRÓXIMOS 7 DÍAS ──────────────────────────────────── */}
      {gruposProximas.length > 0 && (
        <>
          <div className="mx-5 my-3 border-t border-dashed border-slate-200" />
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Próximos 7 días</span>
              <span className="text-[11px] text-slate-400">{citasProximas.length} cita{citasProximas.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {gruposProximas.slice(0, 3).map(([dateKey, citas]) => (
                <div key={dateKey}>
                  <p className="text-[11px] font-bold text-slate-500 capitalize mb-1.5">
                    {labelDia(citas[0].fecha_hora)}
                    <span className="text-slate-300 ml-1.5">·</span>
                    <span className="text-slate-400 font-normal ml-1.5">{citas.length} cita{citas.length !== 1 ? 's' : ''}</span>
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {citas.map(c => {
                      const cfg = TIPO_CITA[c.tipo] ?? TIPO_CITA.otro
                      const hora = new Date(c.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <Link key={c.id} to={`/pacientes/${c.paciente_id}`}
                          className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2 transition-colors group">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.punto}`} />
                          <span className="text-[11px] font-bold text-slate-600">{hora}</span>
                          <span className="text-xs font-semibold text-slate-700 truncate flex-1">
                            {ESPECIE_EMOJI[c.paciente_especie] ?? '🐾'} {c.paciente_nombre}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
              {gruposProximas.length > 3 && (
                <Link to="/citas"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:underline py-1">
                  <ArrowRight size={12} />
                  Ver {citasProximas.length - gruposProximas.slice(0,3).reduce((s, [,cs]) => s + cs.length, 0)} citas más
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── PENDIENTES CLÍNICOS ──────────────────────────────── */}
      <div className="mx-5 my-3 border-t border-dashed border-slate-200" />
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Bell size={11} className={totalUrgentes > 0 ? 'text-red-400' : 'text-slate-400'} />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pendientes clínicos</span>
          {totalUrgentes > 0 && (
            <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full ml-auto">
              {totalUrgentes} urgente{totalUrgentes !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="flex items-center gap-2.5 bg-emerald-50 rounded-xl px-3.5 py-3">
            <span className="text-base">✅</span>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Todo al día</p>
              <p className="text-[11px] text-emerald-600 opacity-75">Sin controles ni vacunas pendientes</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {alertas.slice(0, 6).map(alerta => {
              const vencida  = alerta.diasRestantes < 0
              const hoyAlerta = alerta.diasRestantes === 0
              const urgente  = alerta.diasRestantes > 0 && alerta.diasRestantes <= 3
              const esVacuna = alerta.tipo === 'vacuna'

              return (
                <Link key={alerta.id} to={`/pacientes/${alerta.paciente?.id}`}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:brightness-95
                    ${vencida    ? 'bg-red-50'
                    : hoyAlerta  ? 'bg-amber-50'
                    : urgente    ? 'bg-orange-50'
                    :              'bg-slate-50'}`}>

                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-sm
                    ${vencida ? 'bg-red-100' : hoyAlerta || urgente ? 'bg-amber-100' : 'bg-white'}`}>
                    {esVacuna
                      ? <Syringe size={11} className={vencida ? 'text-red-500' : hoyAlerta || urgente ? 'text-amber-500' : 'text-violet-400'} />
                      : <span className="text-xs">{ESPECIE_EMOJI[alerta.paciente?.especie] ?? '🐾'}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate leading-tight">
                      {alerta.paciente?.nombre ?? '—'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{alerta.motivo}</p>
                  </div>

                  <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-full
                    ${vencida    ? 'bg-red-100 text-red-700'
                    : hoyAlerta  ? 'bg-amber-100 text-amber-700'
                    : urgente    ? 'bg-orange-100 text-orange-700'
                    :              'bg-white text-slate-500'}`}>
                    {vencida    ? `Hace ${Math.abs(alerta.diasRestantes)}d`
                     : hoyAlerta ? 'Hoy'
                     :             `En ${alerta.diasRestantes}d`}
                  </span>
                </Link>
              )
            })}

            {alertas.length > 6 && (
              <p className="text-[11px] text-slate-400 text-center pt-1">
                +{alertas.length - 6} pendiente{alertas.length - 6 !== 1 ? 's' : ''} más
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Dashboard principal
// ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [historias,       setHistorias]       = useState([])
  const [pacientes,       setPacientes]       = useState([])
  const [clientes,        setClientes]        = useState([])
  const [vacunasProximas, setVacunasProximas] = useState([])
  const [citasHoy,        setCitasHoy]        = useState([])
  const [citasProximas,   setCitasProximas]   = useState([])

  useEffect(() => {
    Promise.all([
      fetch('/api/historias').then(r => r.json()),
      fetch('/api/clientes').then(r => r.json()),
      fetch('/api/pacientes').then(r => r.json()),
      fetch('/api/vacunas/proximas?dias=30').then(r => r.json()),
      fetch('/api/citas/hoy').then(r => r.json()),
      fetch('/api/citas/proximas?dias=7').then(r => r.json()),
    ]).then(([h, c, p, v, ch, cp]) => {
      setHistorias(h); setClientes(c); setPacientes(p)
      setVacunasProximas(v); setCitasHoy(ch); setCitasProximas(cp)
    }).catch(() => {})
  }, [])

  // ── Actividad ───────────────────────────────────────────────
  const ahora        = new Date()
  const inicioHoy    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const diaSemana    = inicioHoy.getDay()
  const inicioSemana = new Date(inicioHoy)
  inicioSemana.setDate(inicioHoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))

  const consultasHoy    = historias.filter(h => new Date(h.fecha) >= inicioHoy).length
  const consultasSemana = historias.filter(h => new Date(h.fecha) >= inicioSemana).length

  // ── Alertas clínicas (controles + vacunas) ──────────────────
  const proximosControles = historias
    .filter(h => h.historia_clinica?.indicaciones_cierre?.proximo_control_dias)
    .map(h => {
      const dias   = h.historia_clinica.indicaciones_cierre.proximo_control_dias
      const fecha  = new Date(new Date(h.fecha).getTime() + dias * 86400000)
      const diasR  = Math.round((fecha - ahora) / 86400000)
      const paciente = pacientes.find(p => p.id === h.paciente_id)
      return { id: `ctrl_${h.id}`, tipo: 'control', diasRestantes: diasR, paciente, motivo: 'Control programado' }
    })
    .filter(c => c.diasRestantes >= -7 && c.diasRestantes <= 30)

  const alertasVacunas = vacunasProximas.map(v => ({
    id: `vac_${v.vacuna_id}`,
    tipo: 'vacuna',
    diasRestantes: v.dias_restantes,
    paciente: { nombre: v.paciente_nombre, especie: v.paciente_especie, id: v.paciente_id },
    motivo: `${v.nombre} · ${v.tipo === 'vacuna' ? 'Vacuna' : 'Desparasitación'}`,
  }))

  const todasAlertas = [...proximosControles, ...alertasVacunas]
    .sort((a, b) => a.diasRestantes - b.diasRestantes)

  // ── Handlers ────────────────────────────────────────────────
  const handleConfirmar = async (id) => {
    try {
      await fetch(`/api/citas/${id}/estado?estado=confirmada`, { method: 'PATCH' })
      setCitasHoy(cs => cs.map(c => c.id === id ? { ...c, estado: 'confirmada' } : c))
    } catch { /* silencioso */ }
  }

  const handleCompletar = async (id) => {
    try {
      await fetch(`/api/citas/${id}/estado?estado=completada`, { method: 'PATCH' })
      setCitasHoy(cs => cs.map(c => c.id === id ? { ...c, estado: 'completada' } : c))
    } catch { /* silencioso */ }
  }

  const citasPendHoy  = citasHoy.filter(c => c.estado !== 'completada').length
  const citasSemana   = citasProximas.length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-200 text-sm font-medium capitalize">{fechaHoy()}</p>
            <h1 className="text-2xl font-bold mt-1">{saludo()}, Veterinaria Los Pinos 🐾</h1>
            <p className="text-emerald-100 text-sm mt-1.5">
              {citasPendHoy > 0
                ? `${citasPendHoy} cita${citasPendHoy !== 1 ? 's' : ''} pendiente${citasPendHoy !== 1 ? 's' : ''} hoy`
                : 'Sin citas pendientes hoy'
              }
              {consultasHoy > 0 && ` · ${consultasHoy} consulta${consultasHoy !== 1 ? 's' : ''} registrada${consultasHoy !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <ClipboardPlus size={28} className="text-white" />
          </div>
        </div>
        <div className="mt-5 flex gap-3 flex-wrap">
          <Link to="/consulta"
            className="flex items-center gap-2 bg-white text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-sm">
            <Mic size={15} /> Nueva consulta
          </Link>
          <Link to="/citas"
            className="flex items-center gap-2 bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-colors">
            <Calendar size={14} /> Ver agenda
          </Link>
          <Link to="/pacientes"
            className="flex items-center gap-2 bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-colors">
            Buscar paciente <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icono={Calendar}
          valor={citasPendHoy}
          label="Citas hoy"
          sublabel={citasSemana > 0 ? `${citasSemana} próximos 7d` : 'sin citas próximas'}
          color="text-blue-600" bg="bg-blue-50"
          to="/citas"
        />
        <StatCard
          icono={CalendarCheck}
          valor={consultasHoy}
          label="Consultas hoy"
          sublabel={`${consultasSemana} esta semana`}
          color="text-emerald-600" bg="bg-emerald-50"
        />
        <StatCard
          icono={PawPrint}
          valor={pacientes.length}
          label="Pacientes"
          sublabel="registrados"
          color="text-violet-600" bg="bg-violet-50"
          to="/pacientes"
        />
        <StatCard
          icono={Users}
          valor={clientes.length}
          label="Propietarios"
          sublabel="registrados"
          color="text-amber-600" bg="bg-amber-50"
          to="/clientes"
        />
      </div>

      {/* ── Contenido principal ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* Últimas consultas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Últimas consultas</h2>
            <Link to="/historias" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          {historias.length === 0 ? (
            <div className="py-12 text-center px-6">
              <div className="text-5xl mb-3">🐾</div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Sin consultas registradas aún</p>
              <p className="text-xs text-slate-400 mb-5">Crea tu primera consulta para comenzar</p>
              <Link to="/consulta"
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                <ClipboardPlus size={15} /> Nueva consulta
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {historias.slice(0, 8).map(h => {
                const p = pacientes.find(px => px.id === h.paciente_id)
                const emoji = ESPECIE_EMOJI[p?.especie] ?? '🐾'
                const especieColor = ESPECIE_COLOR[p?.especie] ?? 'bg-slate-100 text-slate-500'
                const esHoy = new Date(h.fecha) >= inicioHoy
                const fechaLabel = esHoy
                  ? 'Hoy · ' + new Date(h.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                  : new Date(h.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

                return (
                  <Link key={h.id} to={p ? `/pacientes/${p.id}` : '/historias'}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p?.nombre ?? 'Paciente'}</p>
                        {p?.especie && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${especieColor}`}>
                            {p.especie}
                          </span>
                        )}
                        {esHoy && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                            Hoy
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {h.historia_clinica?.diagnostico?.presuntivo ?? 'Sin diagnóstico'}
                        <span className="mx-1.5 text-slate-200">·</span>
                        {fechaLabel}
                      </p>
                    </div>
                    <ArrowRight size={13} className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel unificado: Agenda + pendientes clínicos */}
        <PanelAgenda
          citasHoy={citasHoy}
          citasProximas={citasProximas}
          alertas={todasAlertas}
          onConfirmar={handleConfirmar}
          onCompletar={handleCompletar}
        />

      </div>

      {/* ── Accesos rápidos ───────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/consulta',  icono: ClipboardPlus, label: 'Nueva Consulta',  desc: 'Graba y genera historia automáticamente', color: 'from-emerald-500 to-emerald-600' },
            { to: '/citas',     icono: Calendar,      label: 'Nueva Cita',      desc: 'Agenda control, consulta o vacunación',   color: 'from-blue-500 to-blue-600' },
            { to: '/pacientes', icono: PawPrint,      label: 'Nuevo Paciente',  desc: 'Registra un animal',                     color: 'from-violet-500 to-violet-600' },
          ].map(({ to, icono: Icono, label, desc, color }) => (
            <Link key={to} to={to}
              className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 hover:opacity-90 transition-opacity shadow-sm`}>
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Icono size={18} />
              </div>
              <p className="font-bold text-sm">{label}</p>
              <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
