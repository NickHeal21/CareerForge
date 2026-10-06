import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { deleteRecruiterJob, getRecruiterProfile, getRecruiterJob, listRecruiterJobs } from '../api/recruiter'
import RecruiterJobForm from './RecruiterJobForm'

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

function skillsFor(job) {
  return (job.required_skills || '').split(',').map((skill) => skill.trim()).filter(Boolean)
}

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState([])
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formJob, setFormJob] = useState(undefined)
  const [detailJob, setDetailJob] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function refreshJobs() {
    const { data } = await listRecruiterJobs()
    setJobs(data)
  }

  useEffect(() => {
    Promise.all([listRecruiterJobs(), getRecruiterProfile()])
      .then(([jobsResponse, profileResponse]) => {
        setJobs(jobsResponse.data)
        setCompanyName(profileResponse.data.company_name || '')
      })
      .catch((err) => setError(friendlyError(err, 'Your jobs could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaved(job) {
    setFormJob(undefined)
    setSuccess(`“${job.title}” has been ${jobs.some((item) => item.id === job.id) ? 'updated' : 'created'}.`)
    setError('')
    try {
      await refreshJobs()
    } catch (err) {
      setError(friendlyError(err, 'The job saved, but the list could not be refreshed.'))
    }
  }

  async function handleDelete(job) {
    if (!window.confirm(`Delete “${job.title}”? Applicants’ saved applications or readiness data can prevent deletion.`)) return
    setBusyId(job.id)
    setError('')
    setSuccess('')
    try {
      await deleteRecruiterJob(job.id)
      setJobs((items) => items.filter((item) => item.id !== job.id))
      setSuccess(`“${job.title}” was deleted.`)
    } catch (err) {
      setError(friendlyError(err, 'This job could not be deleted. Please try again.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleView(job) {
    setError('')
    try {
      const { data } = await getRecruiterJob(job.id)
      setDetailJob(data)
    } catch (err) {
      setError(friendlyError(err, 'Job details could not be loaded.'))
    }
  }

  return <AppLayout>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-indigo-300">Recruiter workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">My Jobs</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Create and manage the opportunities your company shares with CareerForge applicants.</p></div>
        <button type="button" onClick={() => { setFormJob(null); setError(''); setSuccess('') }} className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500"><span className="text-lg leading-none">+</span> Create Job</button>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>}

      {loading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}</div> : jobs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-300">▤</div><h2 className="mt-4 text-lg font-semibold text-white">Your job board starts here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Create your first opening to make it visible to applicants in the CareerForge jobs directory.</p><button type="button" onClick={() => setFormJob(null)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">Create your first job</button></div> : <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => <article key={job.id} className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 transition hover:border-slate-600">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-lg font-bold text-indigo-300">{job.company_name?.charAt(0) || 'J'}</div><div className="min-w-0 flex-1"><h2 className="font-semibold text-white">{job.title}</h2><p className="mt-1 text-sm text-indigo-200">{job.company_name}</p><p className="mt-1 text-xs text-slate-500">⌖ {job.location}</p></div><span className="shrink-0 rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300">{job.application_count} {job.application_count === 1 ? 'application' : 'applications'}</span></div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{job.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">{skillsFor(job).slice(0, 5).map((skill) => <span key={skill} className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">{skill}</span>)}{skillsFor(job).length > 5 && <span className="px-1 py-1 text-[11px] text-slate-500">+{skillsFor(job).length - 5}</span>}</div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80 pt-4 mt-5"><span className="text-[11px] text-slate-500">Created {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span><div className="flex flex-wrap gap-1"><Link to={`/recruiter/jobs/${job.id}/applications`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10">View Applicants</Link><button type="button" onClick={() => handleView(job)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/10">View details</button><button type="button" onClick={() => { setFormJob(job); setError(''); setSuccess('') }} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700">Edit</button><button type="button" disabled={busyId === job.id} onClick={() => handleDelete(job)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">{busyId === job.id ? 'Deleting…' : 'Delete'}</button></div></div>
        </article>)}
      </div>}
    </div>

    {formJob !== undefined && <RecruiterJobForm key={formJob?.id || 'new'} job={formJob} companyName={companyName} onCancel={() => setFormJob(undefined)} onSaved={handleSaved} />}
    {detailJob && <div className="fixed inset-0 z-20 overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailJob(null) }}><section role="dialog" aria-modal="true" aria-labelledby="recruiter-job-detail" className="mx-auto my-6 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl sm:my-12 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-indigo-300">{detailJob.company_name}</p><h2 id="recruiter-job-detail" className="mt-1 text-2xl font-bold text-white">{detailJob.title}</h2><p className="mt-2 text-sm text-slate-400">{detailJob.location}</p></div><button aria-label="Close job details" onClick={() => setDetailJob(null)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-700 hover:text-white">×</button></div><div className="mt-6 border-t border-slate-700 pt-5"><h3 className="font-semibold text-white">Job description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">{detailJob.description}</p></div><div className="mt-5"><h3 className="font-semibold text-white">Required skills</h3><div className="mt-2 flex flex-wrap gap-2">{skillsFor(detailJob).map((skill) => <span key={skill} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">{skill}</span>)}</div></div><div className="mt-6 border-t border-slate-700 pt-5"><a href={detailJob.application_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">Application link ↗</a><p className="mt-1 text-xs text-slate-500">{detailJob.application_count} applications received</p></div></section></div>}
  </AppLayout>
}
