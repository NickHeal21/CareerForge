export function adminError(error, fallback = 'The request could not be completed. Please try again.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

export function AdminPageHeader({ title, description, action }) {
  return <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-indigo-300">Platform management</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p></div>{action}</header>
}

export function AdminAlert({ children }) {
  return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{children}</div>
}

export function AdminSkeleton({ rows = 4 }) {
  return <div className="space-y-3">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-800" />)}</div>
}

export function AdminEmpty({ title, description }) {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700/60 text-xl text-slate-400">⌕</span><h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">{description}</p></div>
}

export function AdminRoleBadge({ role }) {
  const styles = {
    APPLICANT: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    RECRUITER: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
    ADMIN: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${styles[role] || 'border-slate-600 bg-slate-700 text-slate-300'}`}>{role}</span>
}

export function AdminStatusBadge({ status }) {
  const value = (status || 'Applied').toUpperCase()
  const styles = {
    APPLIED: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    SHORTLISTED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    INTERVIEW: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
    REJECTED: 'border-red-500/20 bg-red-500/10 text-red-300',
    HIRED: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${styles[value] || 'border-slate-600 bg-slate-700 text-slate-300'}`}>{value}</span>
}

export function AdminSearch({ value, onChange, placeholder = 'Search…', className = '' }) {
  return <label className={`relative block ${className}`}><span className="sr-only">{placeholder}</span><span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500" /></label>
}

export function AdminTable({ children, headers }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-800/50"><table className="w-full min-w-[720px] border-collapse text-left"><thead className="bg-slate-900/50"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-700/70">{children}</tbody></table></div>
}

export function AdminTableCell({ children, className = '' }) {
  return <td className={`px-4 py-3.5 text-sm text-slate-300 ${className}`}>{children}</td>
}

export function AdminModal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-30 overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" className="mx-auto my-6 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl sm:my-12 sm:p-7"><div className="flex items-start justify-between gap-4"><h2 id="admin-modal-title" className="text-xl font-bold text-white">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-700 hover:text-white">×</button></div><div className="mt-5">{children}</div></section></div>
}
