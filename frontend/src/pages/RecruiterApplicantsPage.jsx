import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getRecruiterJob, listRecruiterJobApplications } from '../api/recruiter'

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

function statusStyle(status) {
  const styles = {
    APPLIED: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    SHORTLISTED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    INTERVIEW: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
    REJECTED: 'border-red-500/20 bg-red-500/10 text-red-300',
    HIRED: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  }
  return styles[status?.toUpperCase()] || 'border-slate-600 bg-slate-700/60 text-slate-300'
}

export default function RecruiterApplicantsPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getRecruiterJob(jobId), listRecruiterJobApplications(jobId)])
      .then(([jobResponse, applicationResponse]) => {
        setJob(jobResponse.data)
        setApplicants(applicationResponse.data)
      })
      .catch((err) => setError(friendlyError(err, 'Applicants could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [jobId])

  const filtered = useMemo(() => applicants.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || item.applicant_name.toLowerCase().includes(query) || item.applicant_email.toLowerCase().includes(query)
    return matchesSearch && (status === 'ALL' || item.status.toUpperCase() === status)
  }), [applicants, search, status])

  return <AppLayout><div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
    <Link to="/recruiter/jobs" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">← Back to My Jobs</Link>
    <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-indigo-300">Recruiter workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Applicants</h1><p className="mt-2 text-sm text-slate-400">{job ? <>{job.title} · {job.company_name}</> : 'Candidates who applied to your job'}</p></div>
      {!loading && !error && <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-300"><span className="text-xl font-bold text-white">{applicants.length}</span> <span className="ml-1">{applicants.length === 1 ? 'applicant' : 'applicants'}</span></div>}
    </header>
    {error && <div role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
    {loading ? <div className="mt-8 space-y-3">{[1, 2, 3].map((x) => <div key={x} className="h-24 animate-pulse rounded-2xl bg-slate-800" />)}</div> : !error && <>
      <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_220px]"><label className="sr-only" htmlFor="candidate-search">Search applicants</label><input id="candidate-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by candidate name or email" className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500" /><label className="sr-only" htmlFor="candidate-status">Filter by status</label><select id="candidate-status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"><option value="ALL">All statuses</option><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="INTERVIEW">Interview</option><option value="REJECTED">Rejected</option><option value="HIRED">Hired</option></select></div>
      {applicants.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-14 text-center"><div className="text-3xl">♙</div><h2 className="mt-4 font-semibold text-white">No applicants yet</h2><p className="mt-2 text-sm text-slate-400">When applicants apply to this job, they will appear here.</p></div> : filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/40 px-6 py-10 text-center text-sm text-slate-400">No applicants match those filters.</div> : <div className="mt-5 space-y-3">{filtered.map((candidate) => <article key={candidate.id} className="flex flex-col gap-4 rounded-2xl border border-slate-700/80 bg-slate-800/70 p-4 sm:flex-row sm:items-center sm:p-5"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 font-bold text-indigo-200">{candidate.applicant_name.charAt(0).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate font-semibold text-white">{candidate.applicant_name}</h2><p className="truncate text-sm text-slate-400">{candidate.applicant_email}</p></div></div><div className="flex flex-wrap items-center gap-3 sm:justify-end"><span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(candidate.status)}`}>{candidate.status}</span>{candidate.readiness_percentage != null && <span className="text-sm font-semibold text-indigo-200">{candidate.readiness_percentage}% readiness</span>}<span className="text-xs text-slate-500">Applied {new Date(candidate.applied_at).toLocaleDateString()}</span><Link to={`/recruiter/applications/${candidate.id}`} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">View Details</Link></div></article>)}</div>}
    </>}
  </div></AppLayout>
}
