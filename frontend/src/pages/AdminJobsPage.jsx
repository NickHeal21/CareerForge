import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { getAdminJob, listAdminJobs } from '../api/admin'
import { AdminAlert, AdminEmpty, AdminModal, AdminPageHeader, AdminSearch, AdminSkeleton, AdminTable, AdminTableCell, adminError } from '../components/AdminUI'

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

function Detail({ label, value }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{value || '—'}</p></div>
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [jobDetail, setJobDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true); setError('')
      listAdminJobs({ search: search.trim() || undefined, limit: 100 })
        .then(({ data }) => { if (active) setJobs(data) })
        .catch((err) => { if (active) { setJobs([]); setError(adminError(err, 'Jobs could not be loaded.')) } })
        .finally(() => { if (active) setLoading(false) })
    }, 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search])

  async function viewJob(id) {
    setSelectedId(id); setJobDetail(null); setDetailError(''); setDetailLoading(true)
    try { const { data } = await getAdminJob(id); setJobDetail(data) }
    catch (err) { setDetailError(adminError(err, 'Job details could not be loaded.')) }
    finally { setDetailLoading(false) }
  }

  return <AppLayout><div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
    <AdminPageHeader title="Jobs" description="Browse every platform listing, including seeded demo jobs and recruiter-owned jobs." />
    <div className="mb-4 max-w-xl"><AdminSearch value={search} onChange={setSearch} placeholder="Search title, company, location, or recruiter"/></div>
    {error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
    {loading ? <AdminSkeleton rows={6}/> : jobs.length ? <AdminTable headers={['Job', 'Company', 'Location', 'Recruiter', 'Applications', 'Created', '']}>
      {jobs.map((item) => <tr key={item.id} className="transition hover:bg-slate-700/20"><AdminTableCell className="font-medium text-white">{item.title}</AdminTableCell><AdminTableCell>{item.company_name}</AdminTableCell><AdminTableCell>{item.location}</AdminTableCell><AdminTableCell>{item.recruiter_name || 'CareerForge demo'}</AdminTableCell><AdminTableCell><span className="rounded-lg border border-slate-600 bg-slate-900/50 px-2.5 py-1 text-xs">{item.application_count}</span></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs">{dateLabel(item.created_at)}</AdminTableCell><AdminTableCell className="text-right"><button type="button" onClick={() => viewJob(item.id)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/10">View</button></AdminTableCell></tr>)}
    </AdminTable> : !error && <AdminEmpty title="No jobs found" description={search ? 'Try a different search.' : 'Job listings will appear here.'}/>}
    {selectedId != null && <AdminModal title="Job details" onClose={() => setSelectedId(null)}>{detailLoading ? <AdminSkeleton rows={4}/> : detailError ? <AdminAlert>{detailError}</AdminAlert> : jobDetail && <div className="space-y-4"><div><h3 className="text-lg font-semibold text-white">{jobDetail.title}</h3><p className="mt-1 text-sm text-indigo-200">{jobDetail.company_name} · {jobDetail.location}</p></div><div className="grid gap-4 sm:grid-cols-2"><Detail label="Recruiter" value={jobDetail.recruiter_name ? `${jobDetail.recruiter_name} (${jobDetail.recruiter_email})` : 'CareerForge demo listing'}/><Detail label="Applications" value={jobDetail.application_count}/><Detail label="Created" value={dateLabel(jobDetail.created_at)}/><Detail label="Required skills" value={jobDetail.required_skills}/></div><Detail label="Description" value={jobDetail.description}/><a href={jobDetail.application_url} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-indigo-300 hover:text-indigo-200">Application link ↗</a><p className="border-t border-slate-700 pt-3 text-[11px] text-slate-500">Job management is read-only to preserve linked application and readiness history.</p></div>}</AdminModal>}
  </div></AppLayout>
}
