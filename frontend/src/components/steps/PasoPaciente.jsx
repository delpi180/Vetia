import { useState, useEffect } from 'react'
import {
  Search, Plus, ArrowRight, X, CreditCard, Phone,
  Loader2, Check, User, PawPrint, ArrowLeft,
} from 'lucide-react'

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white placeholder-slate-400"

const ESPECIE_CONFIG = {
  Canino: { color: 'bg-amber-100 text-amber-700',   emoji: '🐕' },
  Felino: { color: 'bg-violet-100 text-violet-700', emoji: '🐈' },
  Ave:    { color: 'bg-sky-100 text-sky-700',       emoji: '🐦' },
  Roedor: { color: 'bg-orange-100 text-orange-700', emoji: '🐹' },
  Reptil: { color: 'bg-green-100 text-green-700',   emoji: '🦎' },
  Otro:   { color: 'bg-slate-100 text-slate-600',   emoji: '🐾' },
}
const ESPECIES = ['Canino', 'Felino', 'Ave', 'Roedor', 'Reptil', 'Otro']

function Campo({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Modo búsqueda ────────────────────────────────────────────────────────────
function ModoBusqueda({ onSeleccionar, onNuevo }) {
  const [busqueda, setBusqueda] = useState('')
  const [todos, setTodos] = useState([])   // [{ paciente, cliente }]
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/pacientes').then(r => r.json()),
      fetch('/api/clientes').then(r => r.json()),
    ]).then(([pacs, clis]) => {
      setTodos(pacs.map(p => ({
        paciente: p,
        cliente: clis.find(c => c.id === p.cliente_id) ?? null,
      })))
      setCargando(false)
    }).catch(() => setCargando(false))
  }, [])

  const q = busqueda.trim().toLowerCase()
  const filtrados = q
    ? todos.filter(({ paciente, cliente }) =>
        paciente.nombre.toLowerCase().includes(q) ||
        (paciente.raza ?? '').toLowerCase().includes(q) ||
        (cliente?.nombre ?? '').toLowerCase().includes(q) ||
        (cliente?.dni ?? '').includes(busqueda.trim())
      )
    : todos

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          ¿A quién atendemos hoy?
        </p>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            className={inputCls + ' pl-10'}
            placeholder="Buscar por nombre de mascota, propietario o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Cargando pacientes...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">🐾</div>
            <p className="text-sm font-semibold text-slate-500">
              {q ? `Sin resultados para "${busqueda}"` : 'No hay pacientes registrados'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {q ? 'Prueba con otro nombre o DNI' : 'Regístralos en la sección Clientes o Pacientes'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {!q && (
              <div className="px-4 py-2 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {todos.length} paciente{todos.length !== 1 ? 's' : ''} registrado{todos.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {filtrados.map(({ paciente, cliente }) => {
              const cfg = ESPECIE_CONFIG[paciente.especie] ?? ESPECIE_CONFIG.Otro
              return (
                <button
                  key={paciente.id}
                  onClick={() => onSeleccionar({ paciente, cliente })}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-emerald-50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:border-emerald-200 transition-colors">
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{paciente.nombre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${cfg.color}`}>
                        {paciente.especie}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      {(paciente.raza || paciente.edad) && (
                        <span>{[paciente.raza, paciente.edad].filter(Boolean).join(' · ')}</span>
                      )}
                      {(paciente.raza || paciente.edad) && cliente && <span>·</span>}
                      {cliente && (
                        <span className="flex items-center gap-1">
                          <User size={10} /> {cliente.nombre}
                          {cliente.dni && <span className="text-slate-300">· {cliente.dni}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-slate-200 group-hover:text-emerald-500 shrink-0 transition-colors" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Registrar nuevo */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 shrink-0">¿Paciente no registrado?</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <button
        onClick={onNuevo}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 text-sm font-semibold transition-colors"
      >
        <Plus size={16} /> Registrar nuevo cliente y mascota
      </button>
    </div>
  )
}

// ─── Modo nuevo cliente/mascota ───────────────────────────────────────────────
function ModoNuevo({ datos, onChange, onSiguiente, onVolver }) {
  const [dni, setDni] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [clienteObj, setClienteObj] = useState(null)
  const [pacientesExistentes, setPacientesExistentes] = useState([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [modoPaciente, setModoPaciente] = useState('nuevo')
  const [modoCliente, setModoCliente] = useState('buscar')

  const set = (campo, val) => onChange({ ...datos, [campo]: val })

  const clienteListo = modoCliente === 'buscar' ? !!clienteObj : !!datos.nombreCliente?.trim()
  const mascotaLista = pacienteSeleccionado
    ? true
    : (!!datos.nombrePaciente?.trim() && !!datos.especie)
  const valido = clienteListo && mascotaLista

  useEffect(() => {
    if (!clienteObj) { setPacientesExistentes([]); return }
    fetch(`/api/pacientes?cliente_id=${clienteObj.id}`)
      .then(r => r.json())
      .then(p => {
        setPacientesExistentes(p)
        setModoPaciente(p.length > 0 ? 'existente' : 'nuevo')
        setPacienteSeleccionado(null)
        onChange({
          ...datos,
          clienteId: clienteObj.id,
          nombreCliente: clienteObj.nombre,
          telefono: clienteObj.telefono ?? '',
          pacienteId: null, nombrePaciente: '', especie: '', raza: '', edad: '',
        })
      }).catch(() => {})
  }, [clienteObj])

  const buscarPorDni = async () => {
    const d = dni.trim()
    if (!/^\d{8}$/.test(d)) return
    setBuscando(true)
    setNoEncontrado(false)
    setClienteObj(null)
    try {
      const res = await fetch(`/api/clientes/buscar-dni/${d}`)
      if (res.ok) {
        setClienteObj(await res.json())
        setModoCliente('buscar')
      } else {
        setNoEncontrado(true)
      }
    } catch {
      setNoEncontrado(true)
    } finally {
      setBuscando(false)
    }
  }

  const irAFormNuevo = () => {
    setModoCliente('formulario')
    setClienteObj(null)
    setNoEncontrado(false)
    setPacienteSeleccionado(null)
    setModoPaciente('nuevo')
    onChange({ nombreCliente: '', telefono: '', dni: '', nombrePaciente: '', especie: '', raza: '', edad: '', clienteId: null, pacienteId: null })
  }

  const seleccionarPaciente = (p) => {
    setPacienteSeleccionado(p)
    onChange({ ...datos, pacienteId: p.id, nombrePaciente: p.nombre, especie: p.especie, raza: p.raza ?? '', edad: p.edad ?? '' })
  }

  const mostrarMascota = clienteObj || modoCliente === 'formulario'

  return (
    <div className="space-y-4">

      {/* Cabecera: volver + indicador de pasos */}
      <div className="flex items-center gap-3">
        <button onClick={onVolver}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 group shrink-0">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </button>
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          {/* Paso 1 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
              ${clienteListo ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white ring-4 ring-emerald-100'}`}>
              {clienteListo ? <Check size={11} /> : '1'}
            </div>
            <span className="text-xs font-semibold text-emerald-700 hidden sm:block">Propietario</span>
          </div>
          <div className={`flex-1 h-px transition-colors ${clienteListo ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          {/* Paso 2 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
              ${mascotaLista ? 'bg-emerald-600 text-white' : mostrarMascota ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-400'}`}>
              {mascotaLista ? <Check size={11} /> : '2'}
            </div>
            <span className={`text-xs font-semibold hidden sm:block transition-colors ${mostrarMascota ? 'text-emerald-700' : 'text-slate-400'}`}>
              Mascota
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD PROPIETARIO ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors
              ${clienteListo ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <User size={15} className={clienteListo ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 leading-none">Propietario</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Datos del dueño de la mascota</p>
            </div>
            {clienteListo && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                <Check size={9} /> Listo
              </span>
            )}
          </div>
          {modoCliente !== 'formulario'
            ? <button onClick={irAFormNuevo}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                <Plus size={12} /> Nuevo
              </button>
            : <button onClick={() => { setModoCliente('buscar'); setClienteObj(null); setDni('') }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
                <Search size={12} /> Buscar DNI
              </button>
          }
        </div>

        {/* Body */}
        <div className="p-5">
          {modoCliente !== 'formulario' ? (
            /* ── Modo búsqueda por DNI ── */
            <div className="space-y-3">
              {!clienteObj && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    DNI del propietario
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className={inputCls + ' pl-10'}
                        placeholder="Ej: 45123678"
                        maxLength={8}
                        value={dni}
                        onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setNoEncontrado(false) }}
                        onKeyDown={(e) => e.key === 'Enter' && buscarPorDni()}
                      />
                    </div>
                    <button
                      onClick={buscarPorDni}
                      disabled={dni.length !== 8 || buscando}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold shrink-0 transition-colors">
                      {buscando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      Buscar
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Ingresa 8 dígitos y presiona Buscar o Enter</p>
                </div>
              )}
              {clienteObj && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-base shrink-0">
                    {clienteObj.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-800 truncate">{clienteObj.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {clienteObj.dni && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CreditCard size={10} /> {clienteObj.dni}
                        </span>
                      )}
                      {clienteObj.telefono && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <Phone size={10} /> {clienteObj.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center">
                      <Check size={12} className="text-emerald-700" />
                    </div>
                    <button
                      onClick={() => { setClienteObj(null); setDni('') }}
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold underline underline-offset-2">
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
              {noEncontrado && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">DNI no encontrado</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        No hay propietario con DNI <span className="font-mono font-bold">{dni}</span>
                      </p>
                    </div>
                    <button onClick={irAFormNuevo}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                      <Plus size={12} /> Registrar nuevo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Formulario nuevo propietario ── */
            <div className="space-y-3">
              {/* Nombre — full width */}
              <Campo label="Nombre completo" required>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className={inputCls + ' pl-10'}
                    placeholder="Ej: María García López"
                    autoFocus
                    value={datos.nombreCliente}
                    onChange={(e) => set('nombreCliente', e.target.value)}
                  />
                </div>
              </Campo>

              {/* DNI + Teléfono en fila */}
              <div className="grid grid-cols-2 gap-3">
                <Campo label="DNI">
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={inputCls + ' pl-10'}
                      placeholder="45123678"
                      maxLength={8}
                      value={datos.dni ?? ''}
                      onChange={(e) => set('dni', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </Campo>
                <Campo label="Teléfono">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={inputCls + ' pl-10'}
                      placeholder="944 123 456"
                      value={datos.telefono}
                      onChange={(e) => set('telefono', e.target.value)}
                    />
                  </div>
                </Campo>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conector visual */}
      {mostrarMascota && (
        <div className="flex items-center justify-center">
          <div className="w-px h-4 bg-slate-200" />
        </div>
      )}

      {/* ── CARD MASCOTA ── */}
      {mostrarMascota && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${mascotaLista ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <PawPrint size={15} className={mascotaLista ? 'text-amber-600' : 'text-slate-400'} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-none">Mascota</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Datos del animal a atender</p>
              </div>
              {mascotaLista && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  <Check size={9} /> Listo
                </span>
              )}
            </div>
            {clienteObj && pacientesExistentes.length > 0 && (
              modoPaciente === 'existente'
                ? <button
                    onClick={() => { setModoPaciente('nuevo'); setPacienteSeleccionado(null); onChange({ ...datos, pacienteId: null, nombrePaciente: '', especie: '', raza: '', edad: '' }) }}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> Nueva
                  </button>
                : <button onClick={() => setModoPaciente('existente')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
                    Ver registradas
                  </button>
            )}
          </div>

          <div className="p-5">
            {clienteObj && modoPaciente === 'existente' && pacientesExistentes.length > 0 ? (
              /* ── Selector de mascota existente ── */
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-2">Selecciona la mascota de esta consulta:</p>
                {pacientesExistentes.map((p) => {
                  const cfg = ESPECIE_CONFIG[p.especie] ?? ESPECIE_CONFIG.Otro
                  const sel = pacienteSeleccionado?.id === p.id
                  return (
                    <button key={p.id} onClick={() => seleccionarPaciente(p)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                        ${sel ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}>
                      <span className="text-2xl">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{[p.especie, p.raza, p.edad].filter(Boolean).join(' · ')}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${sel ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                        {sel && <Check size={11} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* ── Formulario nueva mascota ── */
              <div className="space-y-4">
                {/* Selector visual de especie */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Especie <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {ESPECIES.map(esp => {
                      const cfg = ESPECIE_CONFIG[esp]
                      const sel = datos.especie === esp
                      return (
                        <button key={esp} type="button" onClick={() => set('especie', esp)}
                          className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all
                            ${sel
                              ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                          <span className="text-xl leading-none">{cfg.emoji}</span>
                          <span className={`text-[10px] font-bold leading-none ${sel ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {esp}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Nombre + Raza en fila */}
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Nombre de la mascota" required>
                    <input
                      className={inputCls}
                      placeholder="Ej: Rocky"
                      value={datos.nombrePaciente}
                      onChange={(e) => set('nombrePaciente', e.target.value)}
                    />
                  </Campo>
                  <Campo label="Raza">
                    <input
                      className={inputCls}
                      placeholder="Ej: Labrador"
                      value={datos.raza}
                      onChange={(e) => set('raza', e.target.value)}
                    />
                  </Campo>
                </div>

                {/* Edad — full width */}
                <Campo label="Edad">
                  <input
                    className={inputCls}
                    placeholder="Ej: 3 años, 6 meses, 2 años y medio…"
                    value={datos.edad}
                    onChange={(e) => set('edad', e.target.value)}
                  />
                </Campo>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón continuar */}
      <button
        onClick={onSiguiente}
        disabled={!valido}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
        Continuar a grabación <ArrowRight size={16} />
      </button>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PasoPaciente({ datos, onChange, onSiguiente }) {
  const [modoNuevo, setModoNuevo] = useState(false)

  const handleSeleccionar = ({ paciente, cliente }) => {
    onChange({
      ...datos,
      clienteId: cliente?.id ?? null,
      pacienteId: paciente.id,
      nombreCliente: cliente?.nombre ?? '',
      nombrePaciente: paciente.nombre,
      especie: paciente.especie,
      raza: paciente.raza ?? '',
      edad: paciente.edad ?? '',
      telefono: cliente?.telefono ?? '',
    })
    onSiguiente()
  }

  if (modoNuevo) {
    return (
      <ModoNuevo
        datos={datos}
        onChange={onChange}
        onSiguiente={onSiguiente}
        onVolver={() => setModoNuevo(false)}
      />
    )
  }

  return (
    <ModoBusqueda
      onSeleccionar={handleSeleccionar}
      onNuevo={() => setModoNuevo(true)}
    />
  )
}
