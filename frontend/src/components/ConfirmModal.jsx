import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ titulo, mensaje, labelConfirmar = 'Eliminar', onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{titulo}</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">{mensaje}</p>
          <div className="flex gap-3">
            <button onClick={onCancelar}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={onConfirmar}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm">
              {labelConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
