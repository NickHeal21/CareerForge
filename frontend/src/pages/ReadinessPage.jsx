import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { listJobs } from '../api/jobs'
import { listResumes } from '../api/resumes'
import { analyzeReadiness, getReadinessAnalysis, listReadinessAnalyses } from '../api/readiness'

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

function ReadinessRing({ value }) {
  return (
    <div
      role="progressbar"
      aria-label="Job readiness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full p-2 shadow-lg shadow-indigo-950/40 sm:h-48 sm:w-48"
      style={{ background: `conic-gradient(#818cf8 ${value * 3.6}deg, #334155 0deg)` }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-slate-700 bg-slate-900">
        <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{value}%</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Ready</span>
      </div>
    </div>
  )
}

function ResultList({ title, items, tone = 'indigo', icon = '•' }) {
  const styles = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-200',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-100',
  }
  return <section className={`rounded-2xl border p-5 ${styles[tone]}`}>
    <h3 className="font-semibold text-white">{title}</h3>
    {items.length ? <ul className="mt-3 space-y-2.5">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2.5 text-sm leading-6 text-slate-300"><span className="mt-0.5 font-bold text-current">{icon}</span><span>{item}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No points to show.</p>}
  </section>
}

export default function ReadinessPage() {
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [history, setHistory] = useState([])
  const [jobId, setJobId] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listJobs(), listResumes(), listReadinessAnalyses()])
      .then(([jobResponse, resumeResponse, analysisResponse]) => {
        setJobs(jobResponse.data)
        setResumes(resumeResponse.data)
        setHistory(analysisResponse.data)
        const preferredResume = resumeResponse.data.find((resume) => resume.is_default) || resumeResponse.data[0]
        if (preferredResume) setResumeId(String(preferredResume.id))
        if (jobResponse.data[0]) setJobId(String(jobResponse.data[0].id))
      })
      .catch((err) => setError(friendlyError(err, 'Your readiness workspace could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [])

  const selectedResume = useMemo(() => resumes.find((resume) => String(resume.id) === resumeId), [resumes, resumeId])
  const selectedJob = useMemo(() => jobs.find((job) => String(job.id) === jobId), [jobs, jobId])

  async function handleAnalyze(event) {
    event.preventDefault()
    if (!jobId || !resumeId) return
    setError('')
    setAnalyzing(true)
    try {
      const { data } = await analyzeReadiness(Number(jobId), Number(resumeId))
      setResult(data)
      setHistory((items) => [data, ...items.filter((item) => item.id !== data.id)])
    } catch (err) {
      setError(friendlyError(err, 'The readiness analysis could not be completed. Please try again.'))
    } finally {
      setAnalyzing(false)
    }
  }

  async function openSavedAnalysis(id) {
    setError('')
    try {
      const { data } = await getReadinessAnalysis(id)
      setResult(data)
      setJobId(String(data.job_id))
      setResumeId(String(data.resume_id))
    } catch (err) {
      setError(friendlyError(err, 'That saved analysis could not be loaded.'))
    }
  }

  const defaultResume = resumes.find((resume) => resume.id === result?.resume_id)?.is_default

  return <AppLayout>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-300">Career intelligence</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Check your job readiness</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Compare your experience with a role to see your strengths, skill gaps, and practical next steps.</p>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <form onSubmit={handleAnalyze} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-xl shadow-black/10 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-lg">✦</div><div><h2 className="font-semibold text-white">Build your readiness report</h2><p className="mt-0.5 text-xs text-slate-400">Choose the role and resume you want to compare.</p></div></div>
            {loading ? <div className="grid gap-4 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-xl bg-slate-700/60" /><div className="h-20 animate-pulse rounded-xl bg-slate-700/60" /></div> : <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Select a job</span><select value={jobId} onChange={(event) => setJobId(event.target.value)} disabled={!jobs.length} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">{jobs.length ? jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.company_name}</option>) : <option value="">No jobs available</option>}</select></label>
                <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Select a resume</span><select value={resumeId} onChange={(event) => setResumeId(event.target.value)} disabled={!resumes.length} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">{resumes.length ? resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}{resume.is_default ? ' · Default' : ''}</option>) : <option value="">No resumes uploaded</option>}</select></label>
              </div>
              {!jobs.length && <p className="mt-3 text-xs text-amber-300">There are no jobs to analyze yet. <Link to="/jobs" className="underline">Explore jobs</Link></p>}
              {!resumes.length && <p className="mt-3 text-xs text-amber-300">Upload a PDF resume to get started. <Link to="/resumes" className="underline">Manage resumes</Link></p>}
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{selectedResume ? <>Using <span className="text-slate-300">{selectedResume.name}</span>{selectedResume.is_default && <span className="ml-1 text-emerald-300">· Default</span>}</> : 'Select a resume to continue.'}</p>
                <button type="submit" disabled={analyzing || loading || !jobId || !resumeId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{analyzing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{analyzing ? 'Analyzing resume…' : 'Analyze My Readiness'}</button>
              </div>
            </>}
          </form>

          {analyzing && <div role="status" className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 text-sm text-indigo-200"><p className="font-semibold">Reviewing your fit for {selectedJob?.title || 'this role'}…</p><p className="mt-1 text-xs text-slate-400">Comparing the resume evidence with the job requirements. This can take a few moments.</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-400" /></div></div>}

          {result && !analyzing && <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-800 to-indigo-950/50 p-5 shadow-xl shadow-black/10 sm:p-7">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <ReadinessRing value={result.readiness_percentage} />
                <div className="text-center sm:text-left"><p className="text-sm font-medium text-indigo-300">Your readiness snapshot</p><h2 className="mt-1 text-2xl font-bold text-white">{result.job.title}</h2><p className="mt-1 text-sm text-slate-400">{result.job.company_name} <span className="px-1 text-slate-600">·</span> {result.resume.name}{defaultResume ? <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">Default resume</span> : null}</p><p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">A structured comparison of the experience and skills shown in this resume against this role’s requirements.</p><p className="mt-3 text-xs text-slate-500">Saved {new Date(result.created_at).toLocaleString()}</p></div>
              </div>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              <ResultList title="Matching skills" items={result.matching_skills} tone="emerald" icon="✓" />
              <ResultList title="Skills to strengthen" items={result.missing_skills} tone="amber" icon="＋" />
              <ResultList title="Your strengths" items={result.strengths} tone="indigo" icon="✦" />
              <ResultList title="Potential weaknesses" items={result.weaknesses} tone="rose" icon="↗" />
            </div>
            <ResultList title="Recommended next steps" items={result.recommendations} tone="indigo" icon="→" />
          </div>}

          {!loading && !result && !analyzing && resumes.length > 0 && jobs.length > 0 && <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-300">✦</div><h2 className="mt-3 font-semibold text-white">Your next role, in focus</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">Choose a resume and a job above to get a clear, evidence-based view of your fit.</p></div>}
        </div>

        <aside className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-2"><div><h2 className="font-semibold text-white">Past analyses</h2><p className="mt-0.5 text-xs text-slate-500">Saved reports for quick review</p></div><span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-300">{history.length}</span></div>
          {loading ? <div className="mt-5 space-y-3">{[1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-700/50" />)}</div> : history.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-xs leading-5 text-slate-500">Completed reports will be saved here so you can revisit them.</p> : <div className="mt-4 space-y-2">{history.map((item) => <button key={item.id} onClick={() => openSavedAnalysis(item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${result?.id === item.id ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-indigo-400/40 text-xs font-bold text-indigo-200">{item.readiness_percentage}%</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-100">{item.job.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{item.job.company_name} · {item.resume.name}</span><span className="mt-1 block text-[10px] text-slate-600">{new Date(item.created_at).toLocaleDateString()}</span></span></button>)}</div>}
        </aside>
      </div>
    </div>
  </AppLayout>
}
