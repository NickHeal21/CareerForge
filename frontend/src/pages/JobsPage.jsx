import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import CompanyLogo from '../components/CompanyLogo'
import { listResumes } from '../api/resumes'
import { applyToJob, listJobs, searchExternalJobs } from '../api/jobs'

function responseMessage(error, fallback) {
  const status = error?.response?.status
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 429) return 'External job search is temporarily rate limited. Please try again later.'
  if (status === 502 || status === 503 || status === 504) return 'External job search is temporarily unavailable. Your CareerForge jobs are still available.'
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const message = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean).join('. ')
    if (message) return message
  }
  return fallback
}

function safeHttpUrl(value) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function postedDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString()
}

function skillsFor(job) {
  return job.required_skills.split(',').map((skill) => skill.trim()).filter(Boolean)
}

export default function JobsPage() {
  const [source, setSource] = useState('internal')
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
  const [externalQuery, setExternalQuery] = useState('')
  const [externalLocation, setExternalLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [externalJobs, setExternalJobs] = useState([])
  const [externalLoading, setExternalLoading] = useState(false)
  const [externalSearched, setExternalSearched] = useState(false)
  const [externalError, setExternalError] = useState('')
  const [nextCursor, setNextCursor] = useState(null)
  const [selectedExternalJob, setSelectedExternalJob] = useState(null)
  const externalRequestInFlight = useRef(false)
  const externalRequestNumber = useRef(0)

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

  async function searchExternal(event, cursor = null) {
    event?.preventDefault()
    if (externalRequestInFlight.current) return
    const query = externalQuery.trim()
    if (!query) {
      setExternalError('Enter a job title or keyword to search.')
      return
    }

    externalRequestInFlight.current = true
    const requestNumber = ++externalRequestNumber.current
    setExternalError('')
    setExternalLoading(true)
    setExternalSearched(true)
    if (!cursor) {
      setExternalJobs([])
      setNextCursor(null)
    }
    try {
      const { data } = await searchExternalJobs({
        query,
        location: externalLocation.trim() || undefined,
        cursor: cursor || undefined,
        employment_type: employmentType || undefined,
      })
      if (requestNumber !== externalRequestNumber.current) return
      const returnedJobs = Array.isArray(data?.jobs) ? data.jobs.filter((job) => job && typeof job === 'object') : null
      if (!returnedJobs) throw new Error('The external jobs response was not in the expected format.')
      setExternalJobs((current) => {
        if (!cursor) return returnedJobs
        const merged = [...current]
        const known = new Set(current.map((job) => job.external_job_id).filter(Boolean))
        returnedJobs.forEach((job) => {
          if (!job.external_job_id || !known.has(job.external_job_id)) merged.push(job)
        })
        return merged
      })
      setNextCursor(typeof data.next_cursor === 'string' && data.next_cursor ? data.next_cursor : null)
    } catch (err) {
      if (requestNumber === externalRequestNumber.current) {
        setExternalError(responseMessage(err, 'External jobs could not be loaded. Please try again.'))
      }
    } finally {
      if (requestNumber === externalRequestNumber.current) {
        externalRequestInFlight.current = false
        setExternalLoading(false)
      }
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
              <p className="mt-2 max-w-xl text-sm text-slate-400">Browse CareerForge opportunities or search public listings from JSearch.</p>
            </div>
            <Link to="/applications" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">My Applications →</Link>
          </div>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>}

        <div role="tablist" aria-label="Job source" className="mb-5 inline-flex rounded-xl border border-slate-700 bg-slate-800/60 p-1">
          <button role="tab" aria-selected={source === 'internal'} onClick={() => setSource('internal')} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${source === 'internal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>CareerForge Jobs</button>
          <button role="tab" aria-selected={source === 'external'} onClick={() => setSource('external')} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${source === 'external' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>External Jobs</button>
        </div>

        {source === 'internal' && <div className="mb-6 grid gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:grid-cols-[1fr_240px] sm:p-5">
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
        </div>}

        {source === 'external' && <form onSubmit={searchExternal} className="mb-6 grid gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.3fr_1fr_220px_auto] lg:items-end">
          <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Keyword or job title</span><input value={externalQuery} onChange={(event) => setExternalQuery(event.target.value)} maxLength={200} placeholder="e.g. frontend developer" className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Location</span><input value={externalLocation} onChange={(event) => setExternalLocation(event.target.value)} maxLength={200} placeholder="City, region, or country" className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Employment type</span><select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"><option value="">Any type</option><option value="FULLTIME">Full-time</option><option value="CONTRACTOR">Contract</option><option value="PARTTIME">Part-time</option><option value="INTERN">Internship</option></select></label>
          <button type="submit" disabled={externalLoading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{externalLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{externalLoading ? 'Searching…' : 'Search jobs'}</button>
        </form>}

        {source === 'external' && externalError && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{externalError}</div>}

        {source === 'internal' && (loading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}</div> : visibleJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">No roles match that search</h2>
            <p className="mt-2 text-sm text-slate-400">Try another title, company, skill, or location.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleJobs.map((job) => <article key={job.id} className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 transition hover:border-slate-600">
              <div className="flex items-start gap-3">
                <CompanyLogo value={job.company_logo} name={job.company_name} />
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
        ))}

        {source === 'external' && (externalLoading && !externalJobs.length ? <div role="status" className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}</div> : !externalSearched ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-300">⌕</div><h2 className="mt-3 font-semibold text-white">Search public job listings</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">Enter a role and optional location to search current external opportunities.</p></div>
        ) : externalJobs.length === 0 && !externalLoading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-6 py-14 text-center"><h2 className="text-lg font-semibold text-white">No external roles found</h2><p className="mt-2 text-sm text-slate-400">Try broader keywords or another location.</p></div>
        ) : <>
          <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">External listings from JSearch · apply on the employer’s website</p>{externalLoading && <span role="status" className="text-xs text-indigo-300">Loading more…</span>}</div>
          <div className="grid gap-4 md:grid-cols-2">{externalJobs.map((job, index) => <article key={job.external_job_id || `${job.title}-${job.company_name}-${index}`} className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 transition hover:border-slate-600">
            <div className="flex items-start gap-3"><CompanyLogo value={safeHttpUrl(job.company_logo_url)} name={job.company_name || 'Company'} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{job.title || 'Title unavailable'}</h2><span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">External</span></div><p className="mt-1 text-sm text-indigo-200">{job.company_name || 'Company not listed'}</p><p className="mt-1 text-xs text-slate-500">⌖ {job.location || 'Location not listed'}</p></div></div>
            <div className="mt-3 flex flex-wrap gap-2">{job.employment_type && <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">{job.employment_type}</span>}{postedDate(job.posted_at) && <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-400">Posted {postedDate(job.posted_at)}</span>}</div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{job.description || 'No description provided.'}</p>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-700/80 pt-4 mt-5"><span className="text-[11px] font-medium uppercase tracking-wide text-cyan-300">JSearch listing</span><button type="button" onClick={() => setSelectedExternalJob(job)} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">View details</button></div>
          </article>)}</div>
          {nextCursor && <div className="mt-6 text-center"><button type="button" onClick={() => searchExternal(null, nextCursor)} disabled={externalLoading} className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-indigo-500/50 hover:text-white disabled:opacity-50">{externalLoading ? 'Loading…' : 'Load more external jobs'}</button></div>}
        </>)}
      </div>

      {selectedJob && <div className="fixed inset-0 z-20 overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="job-detail-title" className="mx-auto my-6 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl sm:my-12 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3"><CompanyLogo value={selectedJob.company_logo} name={selectedJob.company_name} className="h-14 w-14" textClassName="text-xl" /><div><p className="text-sm font-medium text-indigo-300">{selectedJob.company_name}</p><h2 id="job-detail-title" className="mt-1 text-2xl font-bold text-white">{selectedJob.title}</h2><p className="mt-2 text-sm text-slate-400">{selectedJob.location}</p></div></div>
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

      {selectedExternalJob && <div className="fixed inset-0 z-20 overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedExternalJob(null) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="external-job-detail-title" className="mx-auto my-6 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl sm:my-12 sm:p-7">
          <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><CompanyLogo value={safeHttpUrl(selectedExternalJob.company_logo_url)} name={selectedExternalJob.company_name || 'Company'} className="h-14 w-14" textClassName="text-xl" /><div className="min-w-0"><p className="text-sm font-medium text-cyan-300">External listing · {selectedExternalJob.company_name || 'Company not listed'}</p><h2 id="external-job-detail-title" className="mt-1 text-2xl font-bold text-white">{selectedExternalJob.title || 'Title unavailable'}</h2><p className="mt-2 text-sm text-slate-400">{selectedExternalJob.location || 'Location not listed'}{selectedExternalJob.employment_type ? ` · ${selectedExternalJob.employment_type}` : ''}</p></div></div><button aria-label="Close external job details" onClick={() => setSelectedExternalJob(null)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-700 hover:text-white">×</button></div>
          <div className="mt-6 border-t border-slate-700 pt-5"><h3 className="font-semibold text-white">About this role</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-300">{selectedExternalJob.description || 'No description provided.'}</p></div>
          {postedDate(selectedExternalJob.posted_at) && <p className="mt-4 text-xs text-slate-500">Posted {postedDate(selectedExternalJob.posted_at)}</p>}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">External listings are not saved to CareerForge applications or readiness analysis.</p>{safeHttpUrl(selectedExternalJob.application_url) ? <a href={safeHttpUrl(selectedExternalJob.application_url)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">Apply on Company Website ↗</a> : <span className="text-sm text-slate-400">Application link unavailable</span>}</div>
        </section>
      </div>}
    </AppLayout>
  )
}
