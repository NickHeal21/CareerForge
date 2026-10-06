import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { listApplications } from '../api/jobs'

function responseMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const message = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean).join('. ')
    if (message) return message
  }
  return fallback
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listApplications()
      .then(({ data }) => setApplications(data))
      .catch((err) => setError(responseMessage(err, 'Your applications could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-indigo-300">Your progress</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">My Applications</h1><p className="mt-2 text-sm text-slate-400">A simple view of the roles you’ve applied to.</p></div>
          <Link to="/jobs" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">Browse jobs →</Link>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}</div> : applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">✉</div>
            <h2 className="text-lg font-semibold text-white">Your application list starts here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">When you apply to a role, you’ll see the job, resume, and current status here.</p>
            <Link to="/jobs" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Explore jobs</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/60">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_130px_130px] gap-4 border-b border-slate-700 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Role</span><span>Company</span><span>Resume</span><span>Status</span><span>Applied</span></div>
            <div className="divide-y divide-slate-700/80">
              {applications.map((application) => <article key={application.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr_130px_130px] md:items-center md:gap-4">
                <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">Role</span><p className="font-semibold text-white">{application.job.title}</p></div>
                <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">Company</span><p className="text-sm text-slate-300">{application.job.company_name}</p></div>
                <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">Resume</span><p className="truncate text-sm text-slate-400">{application.resume?.name || 'Resume no longer available'}</p></div>
                <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">Status</span><span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">{application.status}</span></div>
                <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">Applied</span><time className="text-sm text-slate-400">{new Date(application.applied_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time></div>
              </article>)}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
