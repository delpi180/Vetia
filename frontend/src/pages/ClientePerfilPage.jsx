import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, X, Phone, CreditCard, Mail, MapPin,
  ClipboardPlus, ChevronRight, Pencil,
} from 'lucide-react'
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

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',   'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',       'bg-cyan-100 text-cyan-700',
]

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

export default function ClientePerfilPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [cliente, setCliente] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalEditCliente, setModalEditCliente] = useState(false)
  const [modalEditPaciente, setModalEditPaciente] = useState(null) // paciente objeto
  const [confirmEliminarPaciente, setConfirmEliminarPaciente] = useState(null)
  const [form, setForm] = useState({ nombre: '', especie: '', raza: '', edad: '', sexo: '' })
  const [formCliente, setFormCliente] = useState({ dni: '', nombre: '', telefono: '', email: '', direccion: '' })
  const [formPaciente, setFormPaciente] = useState({ nombre: '', especie: '', raza: '', edad: '', sexo: '' })
  const [guardando, setGuardando] = useState(false)
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const cargar = async () => {
    try {
      const c = await fetch(`/api/clientes/${id}`).then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      const p = await fetch(`/api/pacientes?cliente_id=${id}`).then(r => r.json())
      setCliente(c)
      setPacientes(p)
    } catch {
      navigate('/clientes')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const abrirModal = () => {
    setForm({ nombre: '', especie: '', raza: '', edad: '', sexo: '' })
    setModalAbierto(true)
  }

  const guardarPaciente = async () => {
    if (!form.nombre.trim() || !form.especie) return
    setGuardando(true)
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre, especie: form.especie,
          raza: form.raza || null, edad: form.edad || null, sexo: form.sexo || null,
          cliente_id: Number(id),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.detail ?? 'Error al guardar')
        return
      }
      await cargar()
      setModalAbierto(false)
      toast.success(`Mascota "${form.nombre}" registrada`)
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarPaciente = async () => {
    if (!confirmEliminarPaciente) return
    try {
      await fetch(`/api/pacientes/${confirmEliminarPaciente.id}`, { method: 'DELETE' })
      await cargar()
      toast.success(`Paciente "${confirmEliminarPaciente.nombre}" eliminado`)
    } catch {
      toast.error('No se pudo eliminar el paciente')
    } finally {
      setConfirmEliminarPaciente(null)
    }
  }

  const abrirEditCliente = () => {
    setFormCliente({
      dni: cliente.dni ?? '', nombre: cliente.nombre,
      telefono: cliente.telefono ?? '', email: cliente.email ?? '', direccion: cliente.direccion ?? '',
    })
    setModalEditCliente(true)
  }

  const guardarCliente = async () => {
    if (!formCliente.nombre.trim()) return
    setGuardandoEdit(true)
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: formCliente.dni || null,
          nombre: formCliente.nombre,
          telefono: formCliente.telefono || null,
          email: formCliente.email || null,
          direccion: formCliente.direccion || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.detail ?? 'Error al guardar')
        return
      }
      await cargar()
      setModalEditCliente(false)
      toast.success('Datos del cliente actualizados')
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const abrirEditPaciente = (p) => {
    setFormPaciente({
      nombre: p.nombre, especie: p.especie,
      raza: p.raza ?? '', edad: p.edad ?? '', sexo: p.sexo ?? '',
    })
    setModalEditPaciente(p)
  }

  const guardarPacienteEdit = async () => {
    if (!formPaciente.nombre.trim() || !formPaciente.especie) return
    setGuardandoEdit(true)
    try {
      const res = await fetch(`/api/pacientes/${modalEditPaciente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formPaciente.nombre, especie: formPaciente.especie,
          raza: formPaciente.raza || null, edad: formPaciente.edad || null, sexo: formPaciente.sexo || null,
        }),
      })
      if (!res.ok) {
        toast.error('Error al guardar')
        return
      }
      await cargar()
      setModalEditPaciente(null)
      toast.success(`Datos de ${formPaciente.nombre} actualizados`)
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const irAConsulta = (paciente) => {
    navigate('/consulta', {
      state: {
        clienteId: cliente.id,
        pacienteId: paciente.id,
        nombreCliente: cliente.nombre,
        nombrePaciente: paciente.nombre,
        especie: paciente.especie,
        raza: paciente.raza ?? '',
        edad: paciente.edad ?? '',
      },
    })
  }

  if (cargando) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-36 bg-slate-100 rounded-3xl animate-pulse" />
        {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!cliente) return null

  const avatarColor = AVATAR_COLORS[cliente.nombre.charCodeAt(0) % AVATAR_COLORS.length]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Volver */}
      <button onClick={() => navigate('/clientes')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Todos los clientes
      </button>

      {/* Header del cliente */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${avatarColor} flex items-center justify-center font-bold text-xl shrink-0`}>
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800 truncate">{cliente.nombre}</h1>
              <button onClick={abrirEditCliente}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                <Pencil size={12} /> Editar
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {cliente.dni && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <CreditCard size={14} className="text-slate-400" /> {cliente.dni}
                </span>
              )}
              {cliente.telefono && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Phone size={14} /> {cliente.telefono}
                </span>
              )}
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Mail size={14} /> {cliente.email}
                </span>
              )}
              {cliente.direccion && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin size={14} /> {cliente.direccion}
                </span>
              )}
              {!cliente.dni && !cliente.telefono && !cliente.email && !cliente.direccion && (
                <span className="text-sm text-slate-300">Sin contacto registrado</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{pacientes.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Mascota{pacientes.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-center border-l border-slate-100">
            <p className="text-sm font-bold text-slate-700">
              {new Date(cliente.creado_en).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Cliente desde</p>
          </div>
        </div>
      </div>

      {/* Mascotas */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mascotas</h2>
        <button onClick={abrirModal}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors">
          <Plus size={13} /> Nueva mascota
        </button>
      </div>

      {pacientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            🐾
          </div>
          <p className="font-semibold text-slate-600 mb-1">Sin mascotas registradas</p>
          <p className="text-sm text-slate-400 mb-4">Agrega la primera mascota de este propietario</p>
          <button onClick={abrirModal}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">
            <Plus size={14} /> Agregar mascota
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
          {pacientes.map((p) => {
            const cfg = ESPECIE_CONFIG[p.especie] ?? ESPECIE_CONFIG.Otro
            return (
              <div key={p.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group cursor-pointer"
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
                  <p className="text-xs text-slate-400 mt-0.5">
                    {[p.raza, p.edad].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); irAConsulta(p) }}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <ClipboardPlus size={13} /> Consulta
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); abrirEditPaciente(p) }}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Pencil size={12} /> Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nueva mascota */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">Nueva mascota</h2>
                <p className="text-xs text-slate-400 mt-0.5">Para {cliente.nombre}</p>
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
              </div>
              <button onClick={guardarPaciente} disabled={!form.nombre.trim() || !form.especie || guardando}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-sm">
                {guardando ? 'Guardando...' : 'Guardar mascota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar cliente */}
      {modalEditCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalEditCliente(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">Editar cliente</h2>
                <p className="text-xs text-slate-400 mt-0.5">Modifica los datos del propietario</p>
              </div>
              <button onClick={() => setModalEditCliente(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Campo label="Nombre completo" required>
                <input className={inputCls} value={formCliente.nombre}
                  onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="DNI">
                  <div className="relative">
                    <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className={inputCls + ' pl-9'} maxLength={8} placeholder="45123678"
                      value={formCliente.dni}
                      onChange={(e) => setFormCliente({ ...formCliente, dni: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </Campo>
                <Campo label="Teléfono">
                  <input className={inputCls} placeholder="944 123 456"
                    value={formCliente.telefono}
                    onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })} />
                </Campo>
              </div>
              <Campo label="Email">
                <input className={inputCls} type="email" placeholder="correo@email.com"
                  value={formCliente.email}
                  onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })} />
              </Campo>
              <Campo label="Dirección">
                <input className={inputCls} placeholder="Av. Los Pinos 123"
                  value={formCliente.direccion}
                  onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })} />
              </Campo>
              <button onClick={guardarCliente} disabled={!formCliente.nombre.trim() || guardandoEdit}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-sm">
                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar mascota */}
      {modalEditPaciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalEditPaciente(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">Editar mascota</h2>
                <p className="text-xs text-slate-400 mt-0.5">{modalEditPaciente.nombre}</p>
              </div>
              <button onClick={() => setModalEditPaciente(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre" required>
                  <input className={inputCls} value={formPaciente.nombre}
                    onChange={(e) => setFormPaciente({ ...formPaciente, nombre: e.target.value })} />
                </Campo>
                <Campo label="Especie" required>
                  <select className={inputCls} value={formPaciente.especie}
                    onChange={(e) => setFormPaciente({ ...formPaciente, especie: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {ESPECIES.map(e => <option key={e} value={e}>{ESPECIE_CONFIG[e]?.emoji} {e}</option>)}
                  </select>
                </Campo>
                <Campo label="Raza">
                  <input className={inputCls} placeholder="Ej: Labrador"
                    value={formPaciente.raza}
                    onChange={(e) => setFormPaciente({ ...formPaciente, raza: e.target.value })} />
                </Campo>
                <Campo label="Edad">
                  <input className={inputCls} placeholder="Ej: 3 años"
                    value={formPaciente.edad}
                    onChange={(e) => setFormPaciente({ ...formPaciente, edad: e.target.value })} />
                </Campo>
                <div className="col-span-2">
                  <Campo label="Sexo">
                    <select className={inputCls} value={formPaciente.sexo}
                      onChange={(e) => setFormPaciente({ ...formPaciente, sexo: e.target.value })}>
                      <option value="">No indicado</option>
                      <option>Macho</option><option>Hembra</option>
                      <option>Macho castrado</option><option>Hembra esterilizada</option>
                    </select>
                  </Campo>
                </div>
              </div>
              <button onClick={guardarPacienteEdit} disabled={!formPaciente.nombre.trim() || !formPaciente.especie || guardandoEdit}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-sm">
                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEliminarPaciente && (
        <ConfirmModal
          titulo="Eliminar mascota"
          mensaje={`¿Eliminar a "${confirmEliminarPaciente.nombre}" y todas sus historias clínicas? Esta acción no se puede deshacer.`}
          onConfirmar={eliminarPaciente}
          onCancelar={() => setConfirmEliminarPaciente(null)}
        />
      )}
    </div>
  )
}
