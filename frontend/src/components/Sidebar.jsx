import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardPlus, Users,
  PawPrint, FileText, BarChart2, Settings, Stethoscope, Calendar,
} from 'lucide-react'

const GRUPOS = [
  {
    label: 'Principal',
    items: [
      { to: '/',         icono: LayoutDashboard, etiqueta: 'Dashboard' },
      { to: '/consulta', icono: ClipboardPlus,   etiqueta: 'Nueva consulta' },
      { to: '/citas',    icono: Calendar,        etiqueta: 'Agenda' },
    ],
  },
  {
    label: 'Registros',
    items: [
      { to: '/clientes',  icono: Users,    etiqueta: 'Clientes' },
      { to: '/pacientes', icono: PawPrint, etiqueta: 'Pacientes' },
      { to: '/historias', icono: FileText, etiqueta: 'Historias' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/metricas', icono: BarChart2, etiqueta: 'Métricas' },
    ],
  },
]

const itemCls = ({ isActive }) =>
  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ' +
  (isActive
    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
    : 'text-slate-500 font-medium hover:bg-slate-200/70 hover:text-slate-800')

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 h-screen bg-slate-50 border-r border-slate-200/80 flex flex-col select-none">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shrink-0">
            <Stethoscope size={15} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-[13px] leading-tight tracking-tight">VetIA</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Los Pinos</p>
          </div>
        </div>
      </div>

      {/* Navegación agrupada */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {GRUPOS.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, icono: Icono, etiqueta }) => (
                <NavLink key={to} to={to} end={to === '/'} className={itemCls}>
                  <Icono size={15} className="shrink-0" />
                  <span className="truncate">{etiqueta}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Ajustes */}
      <div className="px-2.5 pb-2">
        <NavLink to="/ajustes" className={itemCls}>
          <Settings size={15} className="shrink-0" />
          <span>Ajustes</span>
        </NavLink>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-emerald-700">V</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-700 truncate leading-tight">Vet. Los Pinos</p>
            <p className="text-[10px] text-slate-400 leading-tight">v0.1.0</p>
          </div>
        </div>
      </div>

    </aside>
  )
}
