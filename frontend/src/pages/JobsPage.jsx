import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { listResumes } from '../api/resumes'
import { applyToJob, listJobs } from '../api/jobs'

function responseMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const message = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean).join('. ')
    if (message) return message
  }
  return fallback
}

function skillsFor(job) {
  return job.required_skills.split(',').map((skill) => skill.trim()).filter(Boolean)
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('All locations')
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedResume, setSelectedResume] = useState('')
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([listJobs(), listResumes()])
      .then(([jobResponse, resumeResponse]) => {
        setJobs(jobResponse.data)
        setResumes(resumeResponse.data)
        const defaultResume = resumeResponse.data.find((resume) => resume.is_default)
        setSelectedResume(defaultResume ? String(defaultResume.id) : resumeResponse.data[0] ? String(resumeResponse.data[0].id) : '')
      })
      .catch((err) => setError(responseMessage(err, 'Jobs could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [])

  const locations = useMemo(() => ['All locations', ...new Set(jobs.map((job) => job.location))], [jobs])
  const visibleJobs = useMemo(() => {
    const term = search.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesText = !term || [job.title, job.company_name, job.location, job.required_skills].some((value) => value.toLowerCase().includes(term))
      const matchesLocation = location === 'All locations' || job.location === location
      return matchesText && matchesLocation
    })
  }, [jobs, search, location])

  async function handleApply(event) {
    event.preventDefault()
    if (!selectedJob || !selectedResume) return
    setError('')
    setSuccess('')
    setApplying(true)
    try {
      await applyToJob(selectedJob.id, Number(selectedResume))
      setSuccess(`Application submitted for ${selectedJob.title}.`)
      setSelectedJob(null)
    } catch (err) {
      setError(responseMessage(err, 'Your application could not be submitted. Please try again.'))
    } finally {
      setApplying(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-300">Opportunities</p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Find your next step</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">Explore sample early-career roles and keep track of the ones you apply to.</p>
            </div>
            <Link to="/applications" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">My Applications →</Link>
          </div>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>}

        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:grid-cols-[1fr_240px] sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Search roles</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, company, skill…" className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Location</span>
            <select value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {loading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}</div> : visibleJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">No roles match that search</h2>
            <p className="mt-2 text-sm text-slate-400">Try another title, company, skill, or location.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleJobs.map((job) => <article key={job.id} className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 transition hover:border-slate-600">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-lg font-bold text-indigo-300">{job.company_name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-white">{job.title}</h2>
                  <p className="mt-1 text-sm text-indigo-200">{job.company_name}</p>
                  <p className="mt-1 text-xs text-slate-500">⌖ {job.location}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{job.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {skillsFor(job).slice(0, 4).map((skill) => <span key={skill} className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">{skill}</span>)}
                {skillsFor(job).length > 4 && <span className="px-1 py-1 text-[11px] text-slate-500">+{skillsFor(job).length - 4}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-700/80 pt-4 mt-5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{job.recruiter_id ? 'Company listing' : 'Sample listing'}</span>
                <button onClick={() => { setSelectedJob(job); setError('') }} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">View details</button>
              </div>
            </article>)}
          </div>
        )}
      </div>

      {selectedJob && <div className="fixed inset-0 z-20 overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="job-detail-title" className="mx-auto my-6 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl sm:my-12 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-medium text-indigo-300">{selectedJob.company_name}</p><h2 id="job-detail-title" className="mt-1 text-2xl font-bold text-white">{selectedJob.title}</h2><p className="mt-2 text-sm text-slate-400">{selectedJob.location}</p></div>
            <button aria-label="Close job details" onClick={() => setSelectedJob(null)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-700 hover:text-white">×</button>
          </div>
          <div className="mt-6 border-t border-slate-700 pt-5">
            <h3 className="font-semibold text-white">About this role</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">{selectedJob.description}</p>
          </div>
          <div className="mt-5">
            <h3 className="font-semibold text-white">Required skills</h3>
            <div className="mt-2 flex flex-wrap gap-2">{skillsFor(selectedJob).map((skill) => <span key={skill} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">{skill}</span>)}</div>
          </div>
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-700 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <a href={selectedJob.application_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">External application link ↗</a>
              <span className="text-xs text-slate-500">Demo listing · link is illustrative</span>
            </div>
            {resumes.length === 0 ? <Link to="/resumes" onClick={() => setSelectedJob(null)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">Add a resume to apply</Link> : (
              <form onSubmit={handleApply} className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-64">
                <label htmlFor="application-resume" className="text-xs font-medium text-slate-400">Apply with resume</label>
                <div className="flex gap-2">
                  <select id="application-resume" value={selectedResume} onChange={(event) => setSelectedResume(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-2 text-sm text-slate-100">
                    {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}{resume.is_default ? ' · Default' : ''}</option>)}
                  </select>
                  <button type="submit" disabled={applying || !selectedResume} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">{applying ? 'Applying…' : 'Apply'}</button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>}
    </AppLayout>
  )
}
