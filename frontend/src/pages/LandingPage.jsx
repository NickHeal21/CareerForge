import { useEffect, useState } from 'react'
import api from '../api/client'

/**
 * LandingPage
 *
 * The first page users see. Confirms:
 *  - The React app is running
 *  - The FastAPI backend is reachable (/api/health)
 */
export default function LandingPage() {
  const [health, setHealth]   = useState(null)  // { status, database }
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api
      .get('/api/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-900">
      {/* ── Hero ── */}
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-indigo-300 text-sm font-medium">Phase 1 · Project Setup</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 leading-tight">
          Career<span className="text-indigo-400">Forge</span>
        </h1>

        <p className="text-slate-400 text-lg mb-10">
          AI-powered career development platform for students.
          <br />
          Upload your resume, discover jobs, and get a personalised learning roadmap.
        </p>

        {/* ── Status card ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-left shadow-xl">
          <h2 className="text-slate-200 font-semibold text-base mb-4 flex items-center gap-2">
            <span>🔌</span> System Status
          </h2>

          <div className="space-y-3">
            {/* Frontend */}
            <StatusRow label="Frontend (React + Vite)" ok={true} value="Running on port 5173" />

            {/* Backend */}
            {loading && (
              <StatusRow label="Backend (FastAPI)" loading />
            )}
            {!loading && !error && health && (
              <StatusRow
                label="Backend (FastAPI)"
                ok={health.status === 'ok'}
                value={health.status === 'ok' ? 'Running on port 8000' : 'Degraded'}
              />
            )}
            {!loading && error && (
              <StatusRow label="Backend (FastAPI)" ok={false} value="Not reachable — start the server" />
            )}

            {/* Database */}
            {!loading && health && (
              <StatusRow
                label="PostgreSQL"
                ok={health.database === 'ok'}
                value={health.database === 'ok' ? 'Connected' : health.database}
              />
            )}
            {!loading && error && (
              <StatusRow label="PostgreSQL" ok={false} value="Unknown — backend offline" />
            )}
          </div>
        </div>

        <p className="text-slate-600 text-xs mt-8">
          Phase 2 will add authentication, resume upload, and job listings.
        </p>
      </div>
    </main>
  )
}

/* ── Helper component ──────────────────────────────────────────────────── */
function StatusRow({ label, ok, value, loading }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        {loading ? (
          <span className="text-slate-500 animate-pulse">Checking…</span>
        ) : (
          <>
            <span
              className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
            />
            <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{value}</span>
          </>
        )}
      </span>
    </div>
  )
}
