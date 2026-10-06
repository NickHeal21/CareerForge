import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getRecruiterApplication, getRecruiterApplicationResume, updateRecruiterApplicationStatus } from '../api/recruiter'

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

const statusOptions = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED']

function DataPanel({ title, children }) {
  return <section className="rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 sm:p-6"><h2 className="text-base font-semibold text-white">{title}</h2><div className="mt-4">{children}</div></section>
}

function BulletList({ items, empty }) {
  if (!items?.length) return <p className="text-sm text-slate-500">{empty}</p>
  return <ul className="space-y-2">{items.map((item, index) => <li key={`${index}-${item}`} className="flex gap-2 text-sm leading-6 text-slate-300"><span className="mt-0.5 text-indigo-300">•</span><span>{item}</span></li>)}</ul>
}

function LinkValue({ label, value }) {
  if (!value) return null
  return <a href={value} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-indigo-200 transition hover:border-indigo-500/50">{label} ↗</a>
}

export default function RecruiterCandidatePage() {
  const { applicationId } = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [resumeBusy, setResumeBusy] = useState(false)

  useEffect(() => {
    getRecruiterApplication(applicationId)
      .then(({ data }) => setApplication(data))
      .catch((err) => setError(friendlyError(err, 'Candidate details could not be loaded.')))
      .finally(() => setLoading(false))
  }, [applicationId])

  async function changeStatus(nextStatus) {
    setStatusBusy(true)
    setError('')
    setSuccess('')
    try {
      await updateRecruiterApplicationStatus(application.id, nextStatus)
      setApplication((value) => ({ ...value, status: nextStatus }))
      setSuccess(`Application status updated to ${nextStatus.toLowerCase()}.`)
    } catch (err) {
      setError(friendlyError(err, 'The application status could not be updated.'))
    } finally {
      setStatusBusy(false)
    }
  }

  async function openResume() {
    setResumeBusy(true)
    setError('')
    try {
      const { data } = await getRecruiterApplicationResume(application.id)
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      setError(friendlyError(err, 'The applicant resume could not be opened.'))
    } finally {
      setResumeBusy(false)
    }
  }

  const profile = application?.profile
  const readiness = application?.readiness

  return <AppLayout><div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
    {application && <Link to={`/recruiter/jobs/${application.job.id}/applications`} className="text-sm font-medium text-indigo-300 hover:text-indigo-200">← Back to applicants</Link>}
    {loading ? <div className="mt-6 space-y-4"><div className="h-36 animate-pulse rounded-2xl bg-slate-800" /><div className="grid gap-4 md:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-slate-800" /><div className="h-64 animate-pulse rounded-2xl bg-slate-800" /></div></div> : error && !application ? <div role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : application && <>
      <header className="mt-5 rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800 to-slate-800/50 p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-xl font-bold text-indigo-200">{application.applicant_name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-indigo-300">Candidate profile</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{application.applicant_name}</h1><p className="mt-1 break-all text-sm text-slate-400">{application.applicant_email}</p><p className="mt-3 text-sm text-slate-300">Applied for <span className="font-medium text-white">{application.job.title}</span> at {application.job.company_name} · {new Date(application.applied_at).toLocaleDateString()}</p></div><div className="w-full sm:w-52"><label htmlFor="application-status" className="mb-2 block text-xs font-medium text-slate-400">Application status</label><select id="application-status" value={application.status.toUpperCase()} disabled={statusBusy} onChange={(event) => changeStatus(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-indigo-500 disabled:opacity-60">{statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><p className="mt-2 text-[11px] text-slate-500">{statusBusy ? 'Saving status…' : 'Status updates are saved immediately.'}</p></div></div></header>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}{success && <div role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <DataPanel title="Candidate"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wide text-slate-500">Phone</p><p className="mt-1 text-sm text-slate-200">{profile?.phone || 'Not provided'}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Location</p><p className="mt-1 text-sm text-slate-200">{profile?.location || 'Not provided'}</p></div><div className="sm:col-span-2"><p className="text-xs uppercase tracking-wide text-slate-500">About</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">{profile?.bio || 'No biography provided.'}</p></div><div className="sm:col-span-2"><p className="text-xs uppercase tracking-wide text-slate-500">Skills</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">{profile?.skills || 'No skills listed.'}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Secondary education</p><p className="mt-1 text-sm text-slate-200">{profile?.tenth_percentage != null ? `${profile.tenth_percentage}%` : '—'} · {profile?.twelfth_percentage != null ? `${profile.twelfth_percentage}%` : '—'}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Undergraduate</p><p className="mt-1 text-sm text-slate-200">{profile?.ug_degree || '—'}{profile?.ug_cgpa != null ? ` · ${profile.ug_cgpa} CGPA` : ''}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Postgraduate</p><p className="mt-1 text-sm text-slate-200">{profile?.pg_degree || '—'}{profile?.pg_cgpa != null ? ` · ${profile.pg_cgpa} CGPA` : ''}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><LinkValue label="LinkedIn" value={profile?.linkedin_url} /><LinkValue label="GitHub" value={profile?.github_url} /><LinkValue label="LeetCode" value={profile?.leetcode_url} /><LinkValue label="Portfolio" value={profile?.portfolio_url} />{!profile?.linkedin_url && !profile?.github_url && !profile?.leetcode_url && !profile?.portfolio_url && <span className="text-sm text-slate-500">No social links provided.</span>}</div></DataPanel>
        <div className="space-y-4"><DataPanel title="Resume"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-xl text-rose-300">▤</div><div className="min-w-0 flex-1"><p className="truncate font-medium text-white">{application.resume?.name || 'Resume unavailable'}</p><p className="mt-1 truncate text-sm text-slate-400">{application.resume?.original_filename || 'This application has no accessible resume.'}</p></div><button type="button" onClick={openResume} disabled={!application.resume || resumeBusy} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50">{resumeBusy ? 'Opening…' : 'View / Download'}</button></div></DataPanel>
          <DataPanel title="AI readiness">{readiness ? <><div className="flex items-center gap-4"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#818cf8 ${readiness.readiness_percentage * 3.6}deg, #334155 0deg)` }}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">{readiness.readiness_percentage}%</div></div><div><p className="font-semibold text-white">Readiness for this role</p><p className="mt-1 text-xs text-slate-400">Saved analysis from {new Date(readiness.created_at).toLocaleDateString()}</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Matching skills</h3><BulletList items={readiness.matching_skills} empty="None listed" /></div><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Missing skills</h3><BulletList items={readiness.missing_skills} empty="None listed" /></div><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">Strengths</h3><BulletList items={readiness.strengths} empty="None listed" /></div><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-300">Areas to improve</h3><BulletList items={readiness.weaknesses} empty="None listed" /></div></div><div className="mt-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Recommendations</h3><BulletList items={readiness.recommendations} empty="None listed" /></div></> : <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center"><p className="text-sm text-slate-400">Readiness analysis not available yet.</p><p className="mt-1 text-xs text-slate-600">An analysis will appear here if the applicant has completed one for this job and resume.</p></div>}</DataPanel></div>
      </div>
    </>}
  </div></AppLayout>
}
