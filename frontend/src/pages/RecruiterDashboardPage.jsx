import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../store/useAuthStore'
import { getRecruiterProfile } from '../api/recruiter'
import { listRecruiterJobs } from '../api/recruiter'

const profileFields = ['company_name', 'company_logo', 'designation', 'company_description', 'location', 'website']

export default function RecruiterDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobCount, setJobCount] = useState(null)

  useEffect(() => {
    getRecruiterProfile()
      .then(({ data }) => setProfile(data))
      .catch(() => setError('Your company profile could not be loaded right now.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    listRecruiterJobs()
      .then(({ data }) => setJobCount(data.length))
      .catch(() => setJobCount(null))
  }, [])

  const completion = useMemo(() => {
    if (!profile) return 0
    return Math.round(profileFields.filter((field) => String(profile[field] || '').trim()).length / profileFields.length * 100)
  }, [profile])

  return <AppLayout>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-br from-indigo-950/70 via-slate-800 to-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-9">
        <p className="text-sm font-medium text-indigo-300">Recruiter workspace</p>
        <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Welcome, {user?.name}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Your company space is ready. Complete your profile to establish a clear presence on CareerForge.</p></div>
          <Link to="/recruiter/profile" className="inline-flex w-fit items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">{completion ? 'Edit company profile' : 'Set up company profile'} <span className="ml-2">→</span></Link>
        </div>
      </header>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">Company profile</p><p className="mt-2 text-3xl font-bold text-white">{loading ? '—' : `${completion}%`}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-xl text-indigo-300">◈</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all" style={{ width: `${completion}%` }} /></div>
          <Link to="/recruiter/profile" className="mt-4 inline-block text-xs font-medium text-indigo-300 hover:text-indigo-200">{completion === 100 ? 'Review company details' : 'Complete your company profile →'}</Link>
        </section>
        <Link to="/recruiter/jobs" className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 transition hover:border-indigo-500/40 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">My Jobs</p><p className="mt-2 text-3xl font-bold text-white">{jobCount === null ? '—' : jobCount}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700/70 text-xl">▤</span></div><p className="mt-4 text-xs leading-5 text-indigo-300">Manage your job listings →</p></Link>
        <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">Applications</p><p className="mt-2 text-3xl font-bold text-white">—</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700/70 text-xl">▣</span></div><p className="mt-4 text-xs leading-5 text-slate-500">Application insights will appear here when recruiter tools are introduced.</p></section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-700/80 bg-slate-800/40 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-300">✦</div><div><h2 className="font-semibold text-white">A thoughtful company presence starts here</h2><p className="mt-1 text-sm leading-6 text-slate-400">Add a logo, description, and website so candidates can learn about your organization.</p></div><Link to="/recruiter/profile" className="sm:ml-auto text-sm font-medium text-indigo-300 hover:text-indigo-200">Company profile →</Link></div></section>
    </div>
  </AppLayout>
}
