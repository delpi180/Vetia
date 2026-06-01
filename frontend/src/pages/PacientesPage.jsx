import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PawPrint, Plus, Trash2, Search, X, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white placeholder-slate-400"

const ESPECIES = ['Canino', 'Felino', 'Ave', 'Roedor', 'Reptil', 'Otro']

const ESPECIE_CONFIG = {
  Canino: { color: 'bg-amber-100 text-amber-700',   emoji: '🐕' },
  Felino: { color: 'bg-violet-100 text-violet-700', emoji: '🐈' },
  Ave:    { color: 'bg-sky-100 text-sky-700',       emoji: '🐦' },
  Roedor: { color: 'bg-orange-100 text-orange-700', emoji: '🐹' },
  Reptil: { color: 'bg-green-100 text-green-700',   emoji: '🦎' },
  Otro:   { color: 'bg-slate-100 text-slate-600',   emoji: '🐾' },
}

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

export default function PacientesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [pacientes, setPacientes] = useState([])
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [especieFiltro, setEspecieFiltro] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [form, setForm] = useState({ nombre: '', especie: '', raza: '', edad: '', sexo: '', cliente_id: '' })
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    const [rP, rC] = await Promise.all([fetch('/api/pacientes'), fetch('/api/clientes')])
    setPacientes(await rP.json())
    setClientes(await rC.json())
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const abrirModal = () => {
    setForm({ nombre: '', especie: '', raza: '', edad: '', sexo: '', cliente_id: '' })
    setModalAbierto(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim() || !form.especie || !form.cliente_id) return
    setGuardando(true)
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre, especie: form.especie,
          raza: form.raza || null, edad: form.edad || null, sexo: form.sexo || null,
          cliente_id: Number(form.cliente_id),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.detail ?? 'Error al guardar')
        return
      }
      await cargar()
      setModalAbierto(false)
      toast.success(`Paciente "${form.nombre}" registrado correctamente`)
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!confirmEliminar) return
    try {
      await fetch(`/api/pacientes/${confirmEliminar.id}`, { method: 'DELETE' })
      await cargar()
      toast.success(`Paciente "${confirmEliminar.nombre}" eliminado`)
    } catch {
      toast.error('No se pudo eliminar el paciente')
    } finally {
      setConfirmEliminar(null)
    }
  }

  const nombreCliente = (id) => clientes.find(c => c.id === id)?.nombre ?? '—'

  const filtrados = pacientes.filter(p => {
    const textoOk = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                    (p.raza ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
                    nombreCliente(p.cliente_id).toLowerCase().includes(busqueda.toLowerCase())
    const especieOk = !especieFiltro || p.especie === especieFiltro
    return textoOk && especieOk
  })

  // Conteo por especie
  const conteoEspecie = ESPECIES.reduce((acc, e) => {
    acc[e] = pacientes.filter(p => p.especie === e).length
    return acc
  }, {})

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cargando ? 'Cargando...' : `${pacientes.length} animal${pacientes.length !== 1 ? 'es' : ''} registrado${pacientes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={abrirModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
          <Plus size={16} /> Nuevo paciente
        </button>
      </div>

      {/* Filtros de especie */}
      {!cargando && pacientes.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setEspecieFiltro('')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${!especieFiltro ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            Todos ({pacientes.length})
          </button>
          {ESPECIES.filter(e => conteoEspecie[e] > 0).map(e => (
            <button key={e} onClick={() => setEspecieFiltro(especieFiltro === e ? '' : e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${especieFiltro === e ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
              <span>{ESPECIE_CONFIG[e]?.emoji}</span>
              {e} ({conteoEspecie[e]})
            </button>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={inputCls + ' pl-10'} placeholder="Buscar por nombre, raza o propietario..."
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
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-3xl">
            🐾
          </div>
          <p className="font-semibold text-slate-600 mb-1">{busqueda || especieFiltro ? 'Sin resultados' : 'Aún no hay pacientes'}</p>
          <p className="text-sm text-slate-400 mb-4">
            {busqueda ? `No se encontró "${busqueda}"` : especieFiltro ? `No hay pacientes de especie ${especieFiltro}` : 'Registra el primer animal para empezar'}
          </p>
          {!busqueda && !especieFiltro && (
            <button onClick={abrirModal}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl">
              <Plus size={15} /> Agregar paciente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
          {filtrados.map((p) => {
            const cfg = ESPECIE_CONFIG[p.especie] ?? ESPECIE_CONFIG.Otro
            return (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => navigate(`/pacientes/${p.id}`)}>
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.nombre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${cfg.color}`}>
                      {p.especie}
                    </span>
                    {p.sexo && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium shrink-0 hidden sm:inline">
                        {p.sexo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {[p.raza, p.edad].filter(Boolean).join(' · ')}
                    {(p.raza || p.edad) ? ' · ' : ''}
                    <span className="text-slate-500">{nombreCliente(p.cliente_id)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setConfirmEliminar(p) }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={15} className="text-slate-300" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nuevo paciente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">Nuevo paciente</h2>
                <p className="text-xs text-slate-400 mt-0.5">Registra un animal en el sistema</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre" required>
                  <input className={inputCls} placeholder="Ej: Rocky"
                    value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </Campo>
                <Campo label="Especie" required>
                  <select className={inputCls} value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {ESPECIES.map(e => (
                      <option key={e} value={e}>{ESPECIE_CONFIG[e]?.emoji} {e}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Raza">
                  <input className={inputCls} placeholder="Ej: Labrador"
                    value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} />
                </Campo>
                <Campo label="Edad">
                  <input className={inputCls} placeholder="Ej: 3 años"
                    value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
                </Campo>
                <Campo label="Sexo">
                  <select className={inputCls} value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                    <option value="">No indicado</option>
                    <option>Macho</option><option>Hembra</option>
                    <option>Macho castrado</option><option>Hembra esterilizada</option>
                  </select>
                </Campo>
                <Campo label="Propietario" required>
                  <select className={inputCls} value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </Campo>
              </div>
              <button onClick={guardar} disabled={!form.nombre.trim() || !form.especie || !form.cliente_id || guardando}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-sm">
                {guardando ? 'Guardando...' : 'Guardar paciente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEliminar && (
        <ConfirmModal
          titulo="Eliminar paciente"
          mensaje={`¿Eliminar a "${confirmEliminar.nombre}" y todas sus historias clínicas? Esta acción no se puede deshacer.`}
          onConfirmar={eliminar}
          onCancelar={() => setConfirmEliminar(null)}
        />
      )}
    </div>
  )
}
