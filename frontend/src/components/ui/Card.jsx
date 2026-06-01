export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 border-b border-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }) {
  return (
    <h2 className={`font-bold text-slate-800 text-sm ${className}`}>{children}</h2>
  )
}
