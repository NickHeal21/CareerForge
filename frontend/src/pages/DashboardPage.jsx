import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../store/useAuthStore'
import { useEffect, useState } from 'react'
import { listReadinessAnalyses } from '../api/readiness'
import { listRoadmaps } from '../api/roadmaps'

/**
 * DashboardPage — /dashboard  (protected)
 *
 * Phase 2 placeholder. Just shows:
 *   - Welcome, <name>
 *   - Role badge
 *   - Logout button
 *
 * The real CareerForge dashboard (resume upload, jobs, AI, etc.)
 * will be built in later phases.
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const [latestReadiness, setLatestReadiness] = useState(null)
  const [latestRoadmap, setLatestRoadmap] = useState(null)

  useEffect(() => {
    listReadinessAnalyses()
      .then(({ data }) => setLatestReadiness(data[0] || null))
      .catch(() => {})
  }, [])
  useEffect(() => {
    listRoadmaps()
      .then(({ data }) => setLatestRoadmap(data[0] || null))
      .catch(() => {})
  }, [])
  const completedRoadmapItems = latestRoadmap?.items.filter((item) => item.completed).length || 0
  const roadmapPercent = latestRoadmap?.items.length ? Math.round((completedRoadmapItems / latestRoadmap.items.length) * 100) : 0
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <div className="max-w-lg text-center">

          {/* Greeting */}
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-indigo-400">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Welcome, {user?.name}
          </h2>

          <p className="text-slate-400 mb-6">
            You are logged in as{' '}
            <span className="text-indigo-400 font-medium">{user?.role}</span>.
          </p>

          {/* Role badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-10">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-indigo-300 text-sm font-medium">{user?.role}</span>
          </div>

          <Link to="/profile" className="mb-8 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
            Complete your profile
          </Link>

          {/* Placeholder cards for future phases */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              { icon: '📄', label: 'Resume',   desc: 'Manage your resume versions', to: '/resumes' },
              { icon: '💼', label: 'Jobs',      desc: 'Explore early-career roles', to: '/jobs' },
              { icon: '✦', label: 'Job Readiness', desc: latestReadiness ? `Latest fit: ${latestReadiness.readiness_percentage}% for ${latestReadiness.job.title}` : 'Compare a resume with a role', to: '/readiness' },
            ].map((card) => card.to ? (
                <Link
                  key={card.label}
                  to={card.to}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition hover:border-indigo-500/50 hover:bg-slate-800/80"
                >
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <p className="text-slate-200 font-semibold text-sm">{card.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{card.desc}</p>
                  <span className="inline-block mt-2 text-xs text-indigo-300 bg-indigo-500/10 rounded px-2 py-0.5">{card.label === 'Resume' ? 'Manage resumes' : 'Browse jobs'}</span>
                </Link>
              ) : <div
                key={card.label}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 opacity-50 cursor-not-allowed"
                title="Coming in a future phase"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <p className="text-slate-200 font-semibold text-sm">{card.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{card.desc}</p>
                <span className="inline-block mt-2 text-xs text-slate-600 bg-slate-700 rounded px-2 py-0.5">
                  Coming soon
                </span>
              </div>
            )}
            {latestRoadmap && <Link to="/roadmap" className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition hover:border-indigo-500/50 hover:bg-slate-800/80">
              <div className="mb-2 flex items-center justify-between"><span className="text-2xl">🧭</span><span className="text-xs font-semibold text-indigo-300">{roadmapPercent}%</span></div>
              <p className="text-sm font-semibold text-slate-200">Career Roadmap</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{completedRoadmapItems} of {latestRoadmap.items.length} steps complete</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-indigo-400" style={{ width: `${roadmapPercent}%` }} /></div>
            </Link>}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
