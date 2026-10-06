import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { listReadinessAnalyses } from '../api/readiness'
import { createRoadmap, getRoadmap, listRoadmaps, updateRoadmapItem } from '../api/roadmaps'

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

function roadmapProgress(roadmap) {
  if (!roadmap?.items?.length) return { completed: 0, total: 0, percentage: 0 }
  const completed = roadmap.items.filter((item) => item.completed).length
  return { completed, total: roadmap.items.length, percentage: Math.round((completed / roadmap.items.length) * 100) }
}

export default function RoadmapPage() {
  const [analyses, setAnalyses] = useState([])
  const [roadmaps, setRoadmaps] = useState([])
  const [analysisId, setAnalysisId] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [itemBusy, setItemBusy] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listReadinessAnalyses(), listRoadmaps()])
      .then(([analysisResponse, roadmapResponse]) => {
        setAnalyses(analysisResponse.data)
        setRoadmaps(roadmapResponse.data)
        const latest = analysisResponse.data[0]
        if (latest) {
          setAnalysisId(String(latest.id))
          setRoadmap(roadmapResponse.data.find((item) => item.readiness_analysis_id === latest.id) || null)
        } else if (roadmapResponse.data[0]) {
          setRoadmap(roadmapResponse.data[0])
          setAnalysisId(String(roadmapResponse.data[0].readiness_analysis_id))
        }
      })
      .catch((err) => setError(friendlyError(err, 'Your roadmap workspace could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [])

  const selectedAnalysis = useMemo(() => analyses.find((item) => String(item.id) === analysisId), [analyses, analysisId])
  const progress = useMemo(() => roadmapProgress(roadmap), [roadmap])

  function selectAnalysis(value) {
    setAnalysisId(value)
    const saved = roadmaps.find((item) => String(item.readiness_analysis_id) === value)
    setRoadmap(saved || null)
    setError('')
  }

  async function handleGenerate(event) {
    event.preventDefault()
    if (!analysisId) return
    setError('')
    setGenerating(true)
    try {
      const { data } = await createRoadmap(Number(analysisId))
      setRoadmap(data)
      setRoadmaps((items) => [data, ...items.filter((item) => item.id !== data.id)])
    } catch (err) {
      setError(friendlyError(err, 'Your roadmap could not be generated. Please try again.'))
    } finally {
      setGenerating(false)
    }
  }

  async function openRoadmap(id) {
    setError('')
    try {
      const { data } = await getRoadmap(id)
      setRoadmap(data)
      setAnalysisId(String(data.readiness_analysis_id))
    } catch (err) {
      setError(friendlyError(err, 'That roadmap could not be loaded.'))
    }
  }

  async function toggleItem(item) {
    if (!roadmap) return
    setItemBusy(item.id)
    setError('')
    try {
      const { data } = await updateRoadmapItem(roadmap.id, item.id, !item.completed)
      setRoadmap(data)
      setRoadmaps((items) => items.map((saved) => saved.id === data.id ? data : saved))
    } catch (err) {
      setError(friendlyError(err, 'The roadmap step could not be updated. Please try again.'))
    } finally {
      setItemBusy(null)
    }
  }

  return <AppLayout>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-300">Your growth plan</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Career Roadmap</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Turn your readiness insights into a focused sequence of practical steps for your target role.</p>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {loading ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" /><div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" /></div> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-xl shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <label className="block min-w-0 flex-1"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Readiness analysis</span><select value={analysisId} onChange={(event) => selectAnalysis(event.target.value)} disabled={!analyses.length} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">{analyses.length ? analyses.map((item) => <option key={item.id} value={item.id}>{item.job.title} · {item.readiness_percentage}% · {new Date(item.created_at).toLocaleDateString()}</option>) : <option value="">No readiness analysis yet</option>}</select></label>
              <button type="submit" disabled={!analysisId || generating} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{generating && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{generating ? 'Building your plan…' : roadmap ? 'Open saved roadmap' : 'Generate my roadmap'}</button>
            </div>
            {selectedAnalysis && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-700 pt-4">{selectedAnalysis.missing_skills.slice(0, 4).map((skill) => <span key={skill} className="rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-200">{skill}</span>)}{selectedAnalysis.missing_skills.length > 4 && <span className="px-1 py-1 text-[11px] text-slate-500">+{selectedAnalysis.missing_skills.length - 4} skills</span>}</div>}
            {!analyses.length && <p className="mt-4 text-sm text-slate-400">Complete a readiness analysis first to create a roadmap. <Link to="/readiness" className="font-medium text-indigo-300 hover:text-indigo-200">Check your readiness →</Link></p>}
          </form>

          {generating && <div role="status" className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5"><p className="font-semibold text-indigo-100">Tailoring your next steps…</p><p className="mt-1 text-sm text-slate-400">Using your readiness gaps and the role requirements to create an ordered plan.</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-400" /></div></div>}

          {roadmap && !generating ? <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 shadow-xl shadow-black/10">
            <div className="border-b border-slate-700 bg-gradient-to-br from-indigo-950/50 to-slate-800 p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-[0.16em] text-indigo-300">{roadmap.job.title} · {roadmap.job.company_name}</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{roadmap.title}</h2><p className="mt-1 text-sm text-slate-400">Built from your {roadmap.readiness_analysis.readiness_percentage}% readiness analysis and {roadmap.resume.name}.</p></div>
                <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-indigo-400/25 bg-indigo-500/10 shadow-inner shadow-indigo-950/50"><span className="text-2xl font-extrabold text-white">{progress.percentage}%</span><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">complete</span></div>
              </div>
              <div className="mt-5"><div className="mb-1.5 flex justify-between text-xs text-slate-400"><span>{progress.completed} of {progress.total} steps finished</span><span>{progress.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-500" style={{ width: `${progress.percentage}%` }} /></div></div>
            </div>
            <ol className="divide-y divide-slate-700/70">
              {roadmap.items.map((item) => <li key={item.id} className="flex gap-4 p-5 sm:p-6">
                <div className="flex flex-col items-center"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${item.completed ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200'}`}>{item.completed ? '✓' : String(item.order_index).padStart(2, '0')}</span>{item.order_index < roadmap.items.length && <span className="mt-2 min-h-8 w-px flex-1 bg-slate-700" />}</div>
                <div className="min-w-0 flex-1 pb-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className={`font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-white'}`}>{item.title}</h3><p className="mt-1.5 text-sm leading-6 text-slate-400">{item.description}</p></div><span className="inline-flex w-fit shrink-0 items-center rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-300">◷ {item.estimated_duration}</span></div><button type="button" disabled={itemBusy === item.id} onClick={() => toggleItem(item)} className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${item.completed ? 'border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white' : 'border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10'}`}>{itemBusy === item.id ? 'Saving…' : item.completed ? 'Mark as in progress' : 'Mark complete'}</button></div>
              </li>)}
            </ol>
            {progress.percentage === 100 && <div role="status" className="border-t border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-center text-sm font-medium text-emerald-200">Roadmap complete. You’ve worked through every step.</div>}
          </section> : !generating && analyses.length > 0 ? <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-300">↗</div><h2 className="mt-3 font-semibold text-white">Your plan starts with your readiness report</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">Generate a step-by-step plan based on the skills and recommendations identified for this role.</p></div> : null}
        </div>

        <aside className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 lg:sticky lg:top-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Saved roadmaps</h2><p className="mt-0.5 text-xs text-slate-500">Pick up where you left off</p></div><span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-300">{roadmaps.length}</span></div>{roadmaps.length ? <div className="mt-4 space-y-2">{roadmaps.map((item) => { const itemProgress = roadmapProgress(item); return <button key={item.id} onClick={() => openRoadmap(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${roadmap?.id === item.id ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}><span className="block truncate text-sm font-medium text-slate-100">{item.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{item.job.title} · {itemProgress.completed}/{itemProgress.total} steps</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-700"><span className="block h-full rounded-full bg-indigo-400" style={{ width: `${itemProgress.percentage}%` }} /></span></button> })}</div> : <p className="mt-5 rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-xs leading-5 text-slate-500">Your generated plans will be saved here.</p>}</aside>
      </div>}
    </div>
  </AppLayout>
}
