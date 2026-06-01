// px-3.5 se omite aquí para que callers puedan sobreescribir con pl-* / pr-* sin conflicto
const BASE =
  'w-full border border-slate-200 rounded-xl py-2.5 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 bg-white ' +
  'hover:border-slate-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 ' +
  'transition-all duration-150 ' +
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed'

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`${BASE} px-3.5 ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800
        placeholder:text-slate-400 bg-white resize-none
        hover:border-slate-300
        focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
        transition-all duration-150 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800
        bg-white hover:border-slate-300
        focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
        transition-all duration-150 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
