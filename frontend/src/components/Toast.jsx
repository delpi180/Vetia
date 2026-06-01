import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
  error:   <XCircle    size={16} className="text-red-500 shrink-0" />,
  warning: <AlertCircle size={16} className="text-amber-500 shrink-0" />,
  info:    <Info        size={16} className="text-blue-500 shrink-0" />,
}

const BARS = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
}

function ToastItem({ id, type = 'info', message, onRemove }) {
  return (
    <div className="animate-slide-in relative bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden max-w-sm w-full pointer-events-auto">
      <div className="flex items-start gap-3 px-4 py-3.5">
        {ICONS[type]}
        <p className="text-sm text-slate-700 font-medium flex-1 leading-snug">{message}</p>
        <button onClick={() => onRemove(id)} className="text-slate-300 hover:text-slate-500 ml-1 shrink-0">
          <X size={14} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-100">
        <div
          className={`h-full ${BARS[type]} rounded-full`}
          style={{ animation: 'progress-shrink 3.5s linear forwards' }}
        />
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const add = useCallback((message, type = 'info') => {
    const id = ++counter.current
    setToasts(t => [...t.slice(-3), { id, message, type }])
    setTimeout(() => remove(id), 3600)
  }, [remove])

  const toast = {
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error'),
    warning: (m) => add(m, 'warning'),
    info:    (m) => add(m, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
