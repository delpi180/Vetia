import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Trash2, Search, X, CreditCard, Phone, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ children }) {
  return children ? <p className="text-xs text-red-500 mt-1">{children}</p> : null
}

function AvatarLetra({ nombre, size = 'md' }) {
  const COLORES = [
    'bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',   'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',       'bg-cyan-100 text-cyan-700',
  ]
  const idx = nombre.charCodeAt(0) % COLORES.length
  const sz  = size === 'lg' ? 'w-11 h-11 text-lg' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full ${COLORES[idx]} flex items-center justify-center font-bold shrink-0`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ClientesPage() {
  const navigate = useNavigate()
  const toast    = useToast()

  const [clientes,      setClientes]      = useState([])
  const [busqueda,      setBusqueda]      = useState('')
  const [modalAbierto,  setModalAbierto]  = useState(false)
  const [confirmElim,   setConfirmElim]   = useState(null)
  const [form,          setForm]          = useState({ dni: '', nombre: '', telefono: '', email: '', direccion: '' })
  const [errores,       setErrores]       = useState({})
  const [guardando,     setGuardando]     = useState(false)
  const [cargando,      setCargando]      = useState(true)

  const cargar = async () => {
    const r = await fetch('/api/clientes')
    setClientes(await r.json())
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (form.dni && !/^\d{8}$/.test(form.dni)) e.dni = 'El DNI debe tener 8 dígitos'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const abrirModal = () => {
    setForm({ dni: '', nombre: '', telefono: '', email: '', direccion: '' })
    setErrores({})
    setModalAbierto(true)
  }

  const guardar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: form.dni || null, nombre: form.nombre,
          telefono: form.telefono || null, email: form.email || null,
          direccion: form.direccion || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409) setErrores({ dni: err.detail })
        else toast.error(err.detail ?? 'Error al guardar')
        return
      }
      await cargar()
      setModalAbierto(false)
      toast.success(`Cliente "${form.nombre}" registrado correctamente`)
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!confirmElim) return
    try {
      await fetch(`/api/clientes/${confirmElim.id}`, { method: 'DELETE' })
      await cargar()
      toast.success(`Cliente "${confirmElim.nombre}" eliminado`)
    } catch {
      toast.error('No se pudo eliminar el cliente')
    } finally {
      setConfirmElim(null)
    }
  }

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.dni ?? '').includes(busqueda)
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cargando
              ? 'Cargando...'
              : `${clientes.length} propietario${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={abrirModal} size="md">
          <Plus size={15} /> Nuevo cliente
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          className="w-full border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-800
            placeholder:text-slate-400 bg-white hover:border-slate-300
            focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
            transition-all duration-150"
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600 mb-1">
            {busqueda ? 'Sin resultados' : 'Aún no hay clientes'}
          </p>
          <p className="text-sm text-slate-400 mb-5">
            {busqueda
              ? `No se encontró "${busqueda}"`
              : 'Registra el primer propietario para empezar'}
          </p>
          {!busqueda && (
            <Button onClick={abrirModal} size="sm">
              <Plus size={14} /> Agregar cliente
            </Button>
          )}
        </Card>
      ) : (
        <Card className="divide-y divide-slate-50 overflow-hidden">
          {filtrados.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors group cursor-pointer"
              onClick={() => navigate(`/clientes/${c.id}`)}
            >
              {/* Avatar — no puede encoger */}
              <AvatarLetra nombre={c.nombre} />

              {/* Info — ocupa el espacio disponible, trunca si es necesario */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{c.nombre}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {c.dni && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                      <CreditCard size={12} className="text-slate-400 shrink-0" />
                      <span>{c.dni}</span>
                    </span>
                  )}
                  {c.telefono && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <Phone size={12} className="shrink-0" />
                      <span>{c.telefono}</span>
                    </span>
                  )}
                  {!c.dni && !c.telefono && (
                    <span className="text-xs text-slate-300">Sin contacto registrado</span>
                  )}
                </div>
              </div>

              {/* Acciones — no puede encoger ni empujar el texto */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); setConfirmElim(c) }}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Modal nuevo cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalAbierto(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 tracking-tight">Nuevo cliente</h2>
                <p className="text-xs text-slate-400 mt-0.5">Registra un propietario en el sistema</p>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div>
                <Label>DNI</Label>
                <div className="relative">
                  <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    className="pl-10"
                    placeholder="45123678"
                    maxLength={8}
                    value={form.dni}
                    onChange={e => { setErrores({}); setForm({ ...form, dni: e.target.value.replace(/\D/g, '') }) }}
                  />
                </div>
                <FieldError>{errores.dni}</FieldError>
              </div>

              <div>
                <Label required>Nombre completo</Label>
                <Input
                  placeholder="Ej: María García López"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
                <FieldError>{errores.nombre}</FieldError>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    placeholder="944 123 456"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="correo@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Dirección</Label>
                <Input
                  placeholder="Av. Los Pinos 123"
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                />
              </div>

              <Button
                size="full"
                onClick={guardar}
                disabled={guardando}
                className="mt-2"
              >
                {guardando ? 'Guardando...' : 'Guardar cliente'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm eliminar */}
      {confirmElim && (
        <ConfirmModal
          titulo="Eliminar cliente"
          mensaje={`¿Eliminar a "${confirmElim.nombre}" y todos sus pacientes e historias clínicas? Esta acción no se puede deshacer.`}
          onConfirmar={eliminar}
          onCancelar={() => setConfirmElim(null)}
        />
      )}
    </div>
  )
}
