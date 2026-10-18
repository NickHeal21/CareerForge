import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getAdminDashboard } from '../api/admin'
import { AdminAlert, AdminPageHeader, AdminSkeleton, AdminRoleBadge, AdminStatusBadge, adminError } from '../components/AdminUI'

const metrics = [
  { key: 'total_users', label: 'Total users', icon: '♙', tone: 'indigo' },
  { key: 'total_applicants', label: 'Applicants', icon: '◎', tone: 'sky' },
  { key: 'total_recruiters', label: 'Recruiters', icon: '▣', tone: 'emerald' },
  { key: 'total_jobs', label: 'Jobs', icon: '▤', tone: 'amber' },
  { key: 'total_applications', label: 'Applications', icon: '↗', tone: 'violet' },
]

function MetricCard({ label, value, icon, tone }) {
  const iconTones = { indigo: 'bg-indigo-500/10 text-indigo-300', sky: 'bg-sky-500/10 text-sky-300', emerald: 'bg-emerald-500/10 text-emerald-300', amber: 'bg-amber-500/10 text-amber-200', violet: 'bg-violet-500/10 text-violet-300' }
  return <section className="rounded-2xl border border-slate-700/80 bg-slate-800/65 p-4 shadow-lg shadow-black/5 sm:p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTones[tone]}`}>{icon}</span></div><p className="mt-4 text-3xl font-extrabold tracking-tight text-white">{value.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">Live count from CareerForge data</p></section>
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminDashboard()
      .then(({ data }) => setDashboard(data))
      .catch((err) => setError(adminError(err, 'Platform overview could not be loaded.')))
      .finally(() => setLoading(false))
  }, [])

  return <AppLayout><div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
    <AdminPageHeader title="Platform overview" description="A live snapshot of CareerForge accounts, listings, and applications." action={<span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-300"/>Administrator workspace</span>} />
    {error && <div className="mb-5"><AdminAlert>{error}</AdminAlert></div>}
    {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((item) => <div key={item.key} className="h-32 animate-pulse rounded-2xl bg-slate-800" />)}</div> : dashboard && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((item) => <MetricCard key={item.key} {...item} value={dashboard[item.key]} />)}</div>}

    <div className="mt-5 grid items-start gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-slate-700/80 bg-slate-800/55 p-4 sm:p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Recent users</h2><p className="mt-1 text-xs text-slate-500">Latest accounts registered</p></div><Link to="/admin/users" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">All users →</Link></div>{loading ? <div className="mt-4"><AdminSkeleton rows={3}/></div> : dashboard?.recent_users?.length ? <div className="mt-3 divide-y divide-slate-700/70">{dashboard.recent_users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-100">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div><AdminRoleBadge role={user.role}/></div>)}</div> : !error && <p className="mt-5 text-sm text-slate-500">No recent users to show.</p>}</section>
      <section className="rounded-2xl border border-slate-700/80 bg-slate-800/55 p-4 sm:p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Recently posted jobs</h2><p className="mt-1 text-xs text-slate-500">Listings across the platform</p></div><Link to="/admin/jobs" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">All jobs →</Link></div>{loading ? <div className="mt-4"><AdminSkeleton rows={3}/></div> : dashboard?.recent_jobs?.length ? <div className="mt-3 divide-y divide-slate-700/70">{dashboard.recent_jobs.map((job) => <div key={job.id} className="py-3"><p className="truncate text-sm font-medium text-slate-100">{job.title}</p><p className="mt-1 truncate text-xs text-slate-500">{job.company_name} · {job.location}</p><p className="mt-1 text-[10px] text-slate-600">{dateLabel(job.created_at)} · {job.application_count} applications</p></div>)}</div> : !error && <p className="mt-5 text-sm text-slate-500">No jobs to show.</p>}</section>
      <section className="rounded-2xl border border-slate-700/80 bg-slate-800/55 p-4 sm:p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Recent applications</h2><p className="mt-1 text-xs text-slate-500">Latest applicant activity</p></div><Link to="/admin/applications" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">All applications →</Link></div>{loading ? <div className="mt-4"><AdminSkeleton rows={3}/></div> : dashboard?.recent_applications?.length ? <div className="mt-3 divide-y divide-slate-700/70">{dashboard.recent_applications.map((application) => <div key={application.id} className="py-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-100">{application.applicant_name}</p><AdminStatusBadge status={application.status}/></div><p className="mt-1 truncate text-xs text-slate-500">{application.job_title} · {application.company_name}</p><p className="mt-1 text-[10px] text-slate-600">{dateLabel(application.applied_at)}</p></div>)}</div> : !error && <p className="mt-5 text-sm text-slate-500">No applications to show.</p>}</section>
    </div>
  </div></AppLayout>
}
