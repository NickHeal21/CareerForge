import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../store/useAuthStore'
import { getProfile } from '../api/profile'
import { listResumes } from '../api/resumes'
import { listApplications } from '../api/jobs'
import { listReadinessAnalyses } from '../api/readiness'
import { listRoadmaps } from '../api/roadmaps'
import ProfilePhotoAvatar from '../components/ProfilePhotoAvatar'

const initialSection = { data: null, loading: true, error: '' }

function friendlyError() {
  return 'Unable to load this section right now.'
}

function dateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function profileCompletion(profile) {
  const education = [profile?.tenth_percentage, profile?.twelfth_percentage, profile?.ug_degree, profile?.ug_cgpa, profile?.pg_degree, profile?.pg_cgpa].some((value) => value !== null && value !== undefined && String(value).trim() !== '')
  const fields = [
    Boolean(profile?.phone?.trim()),
    Boolean(profile?.location?.trim()),
    Boolean(profile?.bio?.trim()),
    education,
    Boolean(profile?.skills?.trim()),
    Boolean(profile?.linkedin_url?.trim()),
    Boolean(profile?.github_url?.trim()),
    Boolean(profile?.leetcode_url?.trim()),
    Boolean(profile?.portfolio_url?.trim()),
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function SectionError({ message }) {
  return <p role="status" className="text-sm leading-6 text-amber-200">{message || friendlyError()}</p>
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-700/60 ${className}`} />
}

function ReadinessRing({ value }) {
  return <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full p-1.5" style={{ background: `conic-gradient(#818cf8 ${value * 3.6}deg, #334155 0deg)` }}>
    <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-slate-700 bg-slate-900"><span className="text-2xl font-extrabold text-white">{value}%</span><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Ready</span></div>
  </div>
}

function StatCard({ label, icon, children, accent = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-500/10 text-indigo-300',
    emerald: 'bg-emerald-500/10 text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-200',
    sky: 'bg-sky-500/10 text-sky-300',
  }
  return <section className="min-w-0 rounded-2xl border border-slate-700/80 bg-slate-800/65 p-4 shadow-lg shadow-black/5 sm:p-5">
    <div className="flex items-center gap-2.5"><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm ${tones[accent]}`}>{icon}</span><h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</h2></div>
    <div className="mt-4">{children}</div>
  </section>
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`min-w-0 rounded-2xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-lg shadow-black/5 sm:p-5 ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div>{action}</div>
    {children}
  </section>
}

function statusBadge(status) {
  const value = (status || 'Applied').toUpperCase()
  const tone = {
    APPLIED: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    SHORTLISTED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    INTERVIEW: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
    REJECTED: 'border-red-500/20 bg-red-500/10 text-red-300',
    HIRED: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${tone[value] || 'border-slate-600 bg-slate-700/50 text-slate-300'}`}>{value}</span>
}

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [sections, setSections] = useState({
    profile: initialSection,
    resumes: initialSection,
    applications: initialSection,
    readiness: initialSection,
    roadmaps: initialSection,
  })

  useEffect(() => {
    let active = true
    const sources = {
      profile: getProfile,
      resumes: listResumes,
      applications: listApplications,
      readiness: listReadinessAnalyses,
      roadmaps: listRoadmaps,
    }
    Object.entries(sources).forEach(([key, load]) => {
      load()
        .then(({ data }) => {
          if (active) setSections((current) => ({ ...current, [key]: { data, loading: false, error: '' } }))
        })
        .catch(() => {
          if (active) setSections((current) => ({ ...current, [key]: { data: null, loading: false, error: friendlyError() } }))
        })
    })
    return () => { active = false }
  }, [])

  const profile = sections.profile.data
  const resumes = sections.resumes.data
  const applications = sections.applications.data
  const latestReadiness = sections.readiness.data?.[0] || null
  const latestRoadmap = sections.roadmaps.data?.[0] || null
  const profilePercent = useMemo(() => profileCompletion(profile), [profile])
  const roadmapItems = latestRoadmap?.items || []
  const completedSteps = roadmapItems.filter((item) => item.completed).length
  const roadmapPercent = roadmapItems.length ? Math.round((completedSteps / roadmapItems.length) * 100) : 0
  const nextStep = roadmapItems.find((item) => !item.completed)
  const shortlistedCount = (applications || []).filter((item) => item.status?.toUpperCase() === 'SHORTLISTED').length

  const nextAction = useMemo(() => {
    if (!sections.profile.loading && !sections.profile.error && profilePercent < 100) return { title: 'Complete your profile', description: 'Add your skills and education to make your career workspace more useful.', to: '/profile', label: 'Complete profile', icon: '◎' }
    if (!sections.resumes.loading && !sections.resumes.error && !(resumes || []).length) return { title: 'Upload your resume', description: 'Add a resume so you can apply and get a role readiness report.', to: '/resumes', label: 'Upload resume', icon: '▤' }
    if (!sections.applications.loading && !sections.applications.error && !(applications || []).length) return { title: 'Explore open roles', description: 'Find a role that fits your interests and submit your first application.', to: '/jobs', label: 'Browse jobs', icon: '⌕' }
    if (!sections.readiness.loading && !sections.readiness.error && !latestReadiness) return { title: 'Check your job readiness', description: 'Compare your resume with a job to see strengths and skill gaps.', to: '/readiness', label: 'Check readiness', icon: '✦' }
    if (!sections.roadmaps.loading && !sections.roadmaps.error && !latestRoadmap) return { title: 'Build your career roadmap', description: 'Turn a saved readiness report into a focused plan.', to: '/roadmap', label: 'Create roadmap', icon: '↗' }
    return { title: nextStep ? 'Continue your roadmap' : 'Get career guidance', description: nextStep ? nextStep.title : 'Ask your AI Mentor for a practical next step.', to: nextStep ? '/roadmap' : '/mentor', label: nextStep ? 'Continue roadmap' : 'Ask AI Mentor', icon: nextStep ? '↗' : '✧' }
  }, [sections, profilePercent, resumes, applications, latestReadiness, latestRoadmap, nextStep])

  return <AppLayout>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-700/70 bg-gradient-to-r from-slate-800/90 to-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-3.5"><ProfilePhotoAvatar profileImage={sections.profile.data?.profile_image} name={user?.name} size="h-12 w-12" className="rounded-2xl"/><div className="min-w-0"><h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">{greeting()}, {user?.name?.split(' ')[0] || 'there'} <span aria-hidden="true">👋</span></h1><p className="mt-1 text-sm text-slate-400">Here’s your career progress at a glance.</p></div></div>
        {!sections.profile.loading && !sections.profile.error && profilePercent < 100 && <Link to="/profile" className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20">Complete Profile <span className="ml-2">→</span></Link>}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Job Readiness" icon="✦" accent="indigo">
          {sections.readiness.loading ? <><Skeleton className="h-8 w-20"/><Skeleton className="mt-2 h-3 w-32"/></> : sections.readiness.error ? <SectionError message={sections.readiness.error}/> : latestReadiness ? <><p className="text-3xl font-extrabold tracking-tight text-white">{latestReadiness.readiness_percentage}<span className="text-lg text-slate-400">%</span></p><p className="mt-1 truncate text-xs text-slate-400">{latestReadiness.job?.title || 'Latest saved analysis'}</p><Link to="/readiness" className="mt-3 inline-block text-xs font-semibold text-indigo-300 hover:text-indigo-200">View analysis →</Link></> : <><p className="text-lg font-bold text-white">Not analyzed</p><Link to="/readiness" className="mt-1 inline-block text-xs font-semibold text-indigo-300">Check readiness →</Link></>}
        </StatCard>

        <StatCard label="Applications" icon="▣" accent="sky">
          {sections.applications.loading ? <><Skeleton className="h-8 w-16"/><Skeleton className="mt-2 h-3 w-28"/></> : sections.applications.error ? <SectionError message={sections.applications.error}/> : <><p className="text-3xl font-extrabold tracking-tight text-white">{applications.length}</p><p className="mt-1 text-xs text-slate-400">{applications.length ? `${shortlistedCount} shortlisted` : 'No applications yet'}</p><Link to={applications.length ? '/applications' : '/jobs'} className="mt-3 inline-block text-xs font-semibold text-sky-300 hover:text-sky-200">{applications.length ? 'View applications' : 'Browse jobs'} →</Link></>}
        </StatCard>

        <StatCard label="Roadmap Progress" icon="↗" accent="emerald">
          {sections.roadmaps.loading ? <><Skeleton className="h-8 w-20"/><Skeleton className="mt-2 h-3 w-32"/></> : sections.roadmaps.error ? <SectionError message={sections.roadmaps.error}/> : latestRoadmap ? <><div className="flex items-baseline gap-1"><p className="text-3xl font-extrabold tracking-tight text-white">{roadmapPercent}<span className="text-lg text-slate-400">%</span></p></div><p className="mt-1 text-xs text-slate-400">{completedSteps} of {roadmapItems.length} steps complete</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${roadmapPercent}%` }}/></div></> : <><p className="text-lg font-bold text-white">No roadmap yet</p><Link to="/roadmap" className="mt-1 inline-block text-xs font-semibold text-emerald-300">Create roadmap →</Link></>}
        </StatCard>

        <StatCard label="Profile Completion" icon="◎" accent="amber">
          {sections.profile.loading ? <><Skeleton className="h-8 w-20"/><Skeleton className="mt-2 h-3 w-32"/></> : sections.profile.error ? <SectionError message={sections.profile.error}/> : <><p className="text-3xl font-extrabold tracking-tight text-white">{profilePercent}<span className="text-lg text-slate-400">%</span></p><p className="mt-1 text-xs text-slate-400">{profilePercent === 100 ? 'Profile complete' : 'Profile incomplete'}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-amber-300 transition-[width]" style={{ width: `${profilePercent}%` }}/></div></>}
        </StatCard>
      </div>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Panel title="Career Readiness" subtitle="Your latest saved job match" action={<Link to="/readiness" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">Full report →</Link>}>
          {sections.readiness.loading ? <div className="flex items-center gap-5"><Skeleton className="h-[104px] w-[104px] shrink-0 rounded-full"/><div className="flex-1"><Skeleton className="h-5 w-48"/><Skeleton className="mt-3 h-3 w-64 max-w-full"/><Skeleton className="mt-5 h-3 w-full"/></div></div> : sections.readiness.error ? <SectionError message={sections.readiness.error}/> : latestReadiness ? <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><ReadinessRing value={latestReadiness.readiness_percentage}/><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-wide text-indigo-300">{latestReadiness.job?.company_name || 'Saved analysis'}</p><h3 className="mt-1 truncate text-lg font-bold text-white">{latestReadiness.job?.title || 'Career readiness'}</h3><p className="mt-1 text-xs text-slate-500">Analyzed {dateLabel(latestReadiness.created_at)}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Matching skills</p><p className="line-clamp-2 text-xs leading-5 text-slate-300">{latestReadiness.matching_skills?.slice(0, 5).join(' · ') || 'No matching skills listed'}</p></div><div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Top skill gaps</p><p className="line-clamp-2 text-xs leading-5 text-slate-300">{latestReadiness.missing_skills?.slice(0, 5).join(' · ') || 'No skill gaps listed'}</p></div></div>{latestReadiness.strengths?.[0] && <p className="mt-3 line-clamp-2 text-xs text-slate-400"><span className="font-semibold text-slate-300">Strength: </span>{latestReadiness.strengths[0]}</p>}</div></div> : <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/35 px-4 py-7"><p className="text-sm font-medium text-white">No readiness analysis yet</p><p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">Analyze your resume against a job to see your strengths, readiness score, and skill gaps.</p><Link to="/readiness" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">Check Your Readiness</Link></div>}
        </Panel>

        <Panel title="Continue Your Roadmap" subtitle="A practical plan for your next career steps" action={<Link to="/roadmap" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">View roadmap →</Link>}>
          {sections.roadmaps.loading ? <><Skeleton className="h-5 w-48"/><Skeleton className="mt-3 h-3 w-full"/><Skeleton className="mt-5 h-20 w-full"/></> : sections.roadmaps.error ? <SectionError message={sections.roadmaps.error}/> : latestRoadmap ? nextStep ? <><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Next up · {nextStep.estimated_duration}</p><h3 className="mt-1.5 text-lg font-semibold text-white">{nextStep.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{nextStep.description}</p></div><span className="shrink-0 text-lg font-bold text-emerald-300">{roadmapPercent}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400" style={{ width: `${roadmapPercent}%` }}/></div><p className="mt-2 text-[11px] text-slate-500">{completedSteps} of {roadmapItems.length} steps complete · {latestRoadmap.title}</p><Link to="/roadmap" className="mt-4 inline-flex rounded-lg border border-slate-600 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400/50 hover:bg-slate-700/50">Continue roadmap</Link></> : <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-6"><p className="text-base font-semibold text-white">Your roadmap is complete 🎉</p><p className="mt-1 text-xs text-slate-400">Revisit your plan or choose another job to keep building.</p><Link to="/roadmap" className="mt-3 inline-block text-xs font-semibold text-emerald-300">View completed roadmap →</Link></div> : <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/35 px-4 py-7"><p className="text-sm font-medium text-white">No roadmap yet</p><p className="mt-1.5 text-sm leading-6 text-slate-400">Build a personalized plan from one of your saved readiness analyses.</p><Link to="/roadmap" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">Create Roadmap</Link></div>}
        </Panel>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Panel title="Recent Applications" subtitle="Keep track of the roles you’ve applied to" action={<Link to="/applications" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">View all →</Link>}>
          {sections.applications.loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="flex gap-3"><Skeleton className="h-10 w-full"/></div>)}</div> : sections.applications.error ? <SectionError message={sections.applications.error}/> : applications.length ? <div className="divide-y divide-slate-700/70">{applications.slice(0, 5).map((application) => <div key={application.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{application.job?.title || 'Job application'}</p><p className="mt-0.5 truncate text-xs text-slate-500">{application.job?.company_name || 'Company'} · Applied {dateLabel(application.applied_at)}</p></div>{statusBadge(application.status)}</div>)}</div> : <div className="rounded-xl border border-dashed border-slate-700 px-4 py-6"><p className="text-sm text-slate-300">No applications yet.</p><p className="mt-1 text-xs text-slate-500">Explore open roles to get started.</p><Link to="/jobs" className="mt-3 inline-block text-xs font-semibold text-indigo-300">Browse Jobs →</Link></div>}
        </Panel>

        <section className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950/70 via-slate-800 to-slate-800 p-5 shadow-lg shadow-indigo-950/10 sm:p-6"><div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"/><div className="relative"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/15 text-xl text-indigo-200">✦</span><div><p className="text-xs font-medium uppercase tracking-wider text-indigo-300">Personal career support</p><h2 className="mt-0.5 text-lg font-bold text-white">AI Mentor</h2></div></div><p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">Need help with your career? Ask about your roadmap, skill gaps, resume, interviews, or technical preparation.</p><Link to="/mentor" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500">Ask AI Mentor <span>→</span></Link></div></section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-800/35 p-4 sm:px-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-white">Your next move</h2><p className="mt-1 text-xs text-slate-500">A suggested action based on your current CareerForge data</p></div>{sections.profile.loading || sections.resumes.loading || sections.applications.loading || sections.readiness.loading || sections.roadmaps.loading ? <div className="flex items-center gap-3"><Skeleton className="h-4 w-40"/><Skeleton className="h-9 w-28"/></div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"><div className="flex items-center gap-3"><span className="text-xl text-indigo-300">{nextAction.icon}</span><div><p className="text-sm font-semibold text-slate-100">{nextAction.title}</p><p className="mt-0.5 text-xs text-slate-500">{nextAction.description}</p></div></div><Link to={nextAction.to} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-600 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400/50 hover:bg-slate-700/50">{nextAction.label} →</Link></div>}</div></section>
    </div>
  </AppLayout>
}
