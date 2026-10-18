import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { listAdminApplications } from '../api/admin'
import { AdminAlert, AdminEmpty, AdminPageHeader, AdminSearch, AdminSkeleton, AdminStatusBadge, AdminTable, AdminTableCell, adminError } from '../components/AdminUI'

function dateLabel(value) {
  return value ? new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true); setError('')
      listAdminApplications({ search: search.trim() || undefined, status: status || undefined, limit: 100 })
        .then(({ data }) => { if (active) setApplications(data) })
        .catch((err) => { if (active) { setApplications([]); setError(adminError(err, 'Applications could not be loaded.')) } })
        .finally(() => { if (active) setLoading(false) })
    }, 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search, status])

  return <AppLayout><div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
    <AdminPageHeader title="Applications" description="Monitor applications across CareerForge by candidate, job, company, and status." />
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]"><AdminSearch value={search} onChange={setSearch} placeholder="Search applicant, job, or company"/><label><span className="sr-only">Filter applications by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"><option value="">All statuses</option><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="INTERVIEW">Interview</option><option value="REJECTED">Rejected</option><option value="HIRED">Hired</option></select></label></div>
    {error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
    {loading ? <AdminSkeleton rows={6}/> : applications.length ? <AdminTable headers={['Applicant', 'Job', 'Company', 'Recruiter', 'Status', 'Applied']}>
      {applications.map((item) => <tr key={item.id} className="transition hover:bg-slate-700/20"><AdminTableCell><p className="font-medium text-white">{item.applicant_name}</p><p className="mt-1 text-xs text-slate-500">{item.applicant_email}</p></AdminTableCell><AdminTableCell className="font-medium text-slate-200">{item.job_title}</AdminTableCell><AdminTableCell>{item.company_name}</AdminTableCell><AdminTableCell>{item.recruiter_name || 'CareerForge demo'}</AdminTableCell><AdminTableCell><AdminStatusBadge status={item.status}/></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs">{dateLabel(item.applied_at)}</AdminTableCell></tr>)}
    </AdminTable> : !error && <AdminEmpty title="No applications found" description={search || status ? 'Try a different search or status filter.' : 'Applications will appear here as candidates apply to jobs.'}/>}
  </div></AppLayout>
}
