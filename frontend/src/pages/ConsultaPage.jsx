import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, AlertCircle, PawPrint, Calendar, X } from 'lucide-react'
import PasoPaciente from '../components/steps/PasoPaciente'
import PasoGrabacion from '../components/steps/PasoGrabacion'
import PasoProcesando from '../components/steps/PasoProcesando'
import PasoRevision from '../components/steps/PasoRevision'
import CuestionarioSUS from '../components/CuestionarioSUS'
import CuestionarioTAM from '../components/CuestionarioTAM'

const PASOS = [
  { label: 'Paciente',  desc: 'Datos del propietario y animal' },
  { label: 'Grabación', desc: 'Graba la consulta' },
  { label: 'Procesando',desc: 'Análisis con IA' },
  { label: 'Revisión',  desc: 'Revisa y guarda' },
]

const DATOS_INICIALES = {
  dni: '', nombreCliente: '', telefono: '',
  nombrePaciente: '', especie: '', raza: '', edad: '',
  clienteId: null, pacienteId: null,
}

const SISTEMAS_VACIOS = ['piel','ojos','oidos','sistema_digestivo','cardiovascular','respiratorio',
  'sistema_urinario','nervioso','linfatico','sistema_locomotor','reproductor']
  .reduce((acc, s) => ({ ...acc, [s]: { estado: 'NO_EXPLORADO', descripcion: '' } }), {})

const HISTORIA_VACIA = {
  anamnesis: { motivo_consulta: '', tiempo_evolucion: '', derivado_por: '', anamnesis_detalle: '',
    alimentacion: { tipo: '', cantidad_gr: null, veces_al_dia: null, observaciones: '' }, antecedentes: '' },
  examen_objetivo_general: { mucosas: '', temperatura_c: null, peso_kg: null, condicion_corporal: '',
    estado_sensorio: '', hidratacion: { estado: 'NO_EXPLORADO', descripcion: '' } },
  examen_objetivo_particular: SISTEMAS_VACIOS,
  diagnostico: { presuntivo: '', diferenciales: [], definitivo: '' },
  tratamiento: [],
  indicaciones_cierre: { indicaciones_casa: '', dieta_recomendada: '', examenes_solicitados: '',
    observaciones: '', proximo_control_dias: null },
}

function ModalSugerirCita({ dias, pacienteId, clienteId, onCerrar }) {
  const fechaSugerida = new Date()
  fechaSugerida.setDate(fechaSugerida.getDate() + dias)
  fechaSugerida.setHours(9, 0, 0, 0)

  const [fecha, setFecha] = useState(fechaSugerida.toISOString().slice(0, 16))
  const [motivo, setMotivo] = useState(`Control programado (${dias} días)`)
  const [agendando, setAgendando] = useState(false)
  const [agendado, setAgendado] = useState(false)
  const [errorCita, setErrorCita] = useState(null)

  const agendar = async () => {
    setAgendando(true)
    setErrorCita(null)
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteId,
          cliente_id: clienteId ?? null,
          fecha_hora: new Date(fecha).toISOString(),
          tipo: 'control',
          motivo: motivo || null,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setAgendado(true)
    } catch {
      setErrorCita('No se pudo agendar la cita. Puedes intentarlo desde la agenda.')
    } finally {
      setAgendando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {agendado ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
              <Calendar size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">¡Cita agendada!</h3>
            <p className="text-sm text-slate-500">
              Control programado para el{' '}
              <strong>{new Date(fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </p>
            <button onClick={onCerrar}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              Ir al perfil del paciente
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Agendar control</h3>
                  <p className="text-xs text-slate-500">El veterinario indicó control en {dias} días</p>
                </div>
              </div>
              <button onClick={onCerrar} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha y hora</label>
                <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Motivo</label>
                <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>

            {errorCita && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">
                {errorCita}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={agendar} disabled={agendando}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {agendando ? 'Agendando…' : 'Agendar cita'}
              </button>
              <button onClick={onCerrar}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                Omitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConsultaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const precargado = location.state  // { clienteId, pacienteId, nombreCliente, nombrePaciente, especie, raza, edad }

  const [paso, setPaso] = useState(precargado?.pacienteId ? 1 : 0)
  const [datosPaciente, setDatosPaciente] = useState(() =>
    precargado?.pacienteId
      ? {
          ...DATOS_INICIALES,
          clienteId: precargado.clienteId ?? null,
          pacienteId: precargado.pacienteId,
          nombreCliente: precargado.nombreCliente ?? '',
          nombrePaciente: precargado.nombrePaciente ?? '',
          especie: precargado.especie ?? '',
          raza: precargado.raza ?? '',
          edad: precargado.edad ?? '',
        }
      : DATOS_INICIALES
  )
  const [audioBlob, setAudioBlob] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [modoManual, setModoManual] = useState(false)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [historiaGuardadaId, setHistoriaGuardadaId] = useState(null)
  const [mostrarTAM, setMostrarTAM] = useState(false)
  const [sugerirCita, setSugerirCita] = useState(null)   // { dias, pacienteId, clienteId }

  const handleManual = () => {
    setModoManual(true)
    setResultado({ historia_clinica: HISTORIA_VACIA, transcripcion: '', duracion_transcripcion_ms: null, duracion_extraccion_ms: null, duracion_total_ms: 0 })
    setPaso(3)
  }

  const handleGuardar = async ({ historia, tiempo_edicion_ms }) => {
    setGuardando(true)
    setError(null)
    try {
      let clienteId = datosPaciente.clienteId
      if (!clienteId) {
        const rCliente = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni: datosPaciente.dni || null, nombre: datosPaciente.nombreCliente, telefono: datosPaciente.telefono || null }),
        })
        const cliente = await rCliente.json()
        clienteId = cliente.id
      }

      let pacienteId = datosPaciente.pacienteId
      if (!pacienteId) {
        const rPaciente = await fetch('/api/pacientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: datosPaciente.nombrePaciente, especie: datosPaciente.especie,
            raza: datosPaciente.raza || null, edad: datosPaciente.edad || null,
            cliente_id: clienteId,
          }),
        })
        const paciente = await rPaciente.json()
        pacienteId = paciente.id
      }

      const rHistoria = await fetch('/api/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteId,
          transcripcion: modoManual ? null : resultado.transcripcion,
          historia_clinica: historia,
          duracion_transcripcion_ms: modoManual ? null : resultado.duracion_transcripcion_ms,
          duracion_extraccion_ms: modoManual ? null : resultado.duracion_extraccion_ms,
          tiempo_edicion_ms: tiempo_edicion_ms ?? null,
        }),
      })
      const historiaGuardada = await rHistoria.json()
      setHistoriaGuardadaId(historiaGuardada.id)
      // Guardar sugerencia de cita si el vet indicó proximo_control_dias
      const dias = historia?.indicaciones_cierre?.proximo_control_dias
      if (dias && dias > 0) {
        setSugerirCita({ dias, pacienteId, clienteId })
      }
    } catch (e) {
      setError(`Error al guardar: ${e.message}`)
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-50">
      {historiaGuardadaId && !mostrarTAM && (
        <CuestionarioSUS
          historiaId={historiaGuardadaId}
          onCerrar={() => setMostrarTAM(true)}
        />
      )}
      {mostrarTAM && (
        <CuestionarioTAM
          historiaId={historiaGuardadaId}
          onCerrar={() => {
            setMostrarTAM(false)
            if (sugerirCita) return   // el modal de cita se encarga de navegar
            datosPaciente.pacienteId
              ? navigate(`/pacientes/${datosPaciente.pacienteId}`)
              : navigate('/')
          }}
        />
      )}
      {sugerirCita && !mostrarTAM && (
        <ModalSugerirCita
          {...sugerirCita}
          onCerrar={() => {
            setSugerirCita(null)
            datosPaciente.pacienteId
              ? navigate(`/pacientes/${datosPaciente.pacienteId}`)
              : navigate('/')
          }}
        />
      )}
      {/* Header con steps — sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center">
            {PASOS.map((p, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                    ${i < paso  ? 'bg-emerald-600 text-white'
                    : i === paso ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : 'bg-slate-200 text-slate-400'}`}
                  >
                    {i < paso ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-semibold leading-tight ${i === paso ? 'text-emerald-700' : i < paso ? 'text-slate-500' : 'text-slate-400'}`}>
                      {p.label}
                    </p>
                    <p className={`text-xs leading-tight ${i === paso ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {p.desc}
                    </p>
                  </div>
                </div>
                {i < PASOS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${i < paso ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {precargado?.pacienteId && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <PawPrint size={15} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">{precargado.nombrePaciente}{precargado.especie ? ` · ${precargado.especie}` : ''}</p>
                {precargado.nombreCliente && <p className="text-xs text-emerald-600">Propietario: {precargado.nombreCliente}</p>}
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
              <AlertCircle size={15} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-base leading-none">×</button>
            </div>
          )}

          {paso === 0 && (
            <PasoPaciente datos={datosPaciente} onChange={setDatosPaciente} onSiguiente={() => setPaso(1)} />
          )}
          {paso === 1 && (
            <PasoGrabacion datosPaciente={datosPaciente} onGrabacionLista={(b) => { setAudioBlob(b); setPaso(2) }}
              onAnterior={precargado?.pacienteId ? () => navigate(`/pacientes/${precargado.pacienteId}`) : () => setPaso(0)}
              onManual={handleManual} />
          )}
          {paso === 2 && (
            <PasoProcesando audioBlob={audioBlob} onResultado={(d) => { setResultado(d); setPaso(3) }} onError={(m) => { setError(m); setPaso(1) }} />
          )}
          {paso === 3 && resultado && (
            <PasoRevision resultado={resultado} datosPaciente={datosPaciente} onGuardar={handleGuardar} guardando={guardando} modoManual={modoManual} />
          )}
        </div>
      </div>
    </div>
  )
}
