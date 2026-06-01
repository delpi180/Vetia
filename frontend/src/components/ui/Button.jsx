const variants = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow-md ' +
    'disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 ' +
    'border border-slate-200 shadow-sm hover:border-slate-300',
  ghost:
    'text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm',
}

const sizes = {
  xs:   'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
  sm:   'px-3.5 py-2   text-xs rounded-xl gap-1.5',
  md:   'px-4   py-2.5 text-sm rounded-xl gap-2',
  lg:   'px-5   py-3   text-sm rounded-xl gap-2',
  full: 'w-full px-4   py-3   text-sm rounded-xl gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150
        disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
