import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { listAdminRecruiters } from '../api/admin'
import { AdminAlert, AdminEmpty, AdminPageHeader, AdminRoleBadge, AdminSearch, AdminSkeleton, AdminTable, AdminTableCell, adminError } from '../components/AdminUI'

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true); setError('')
      listAdminRecruiters({ search: search.trim() || undefined, limit: 100 })
        .then(({ data }) => { if (active) setRecruiters(data) })
        .catch((err) => { if (active) { setRecruiters([]); setError(adminError(err, 'Recruiters could not be loaded.')) } })
        .finally(() => { if (active) setLoading(false) })
    }, 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search])

  return <AppLayout><div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
    <AdminPageHeader title="Recruiters" description="Review recruiter accounts, company profiles, and job listing counts." />
    <div className="mb-4 max-w-xl"><AdminSearch value={search} onChange={setSearch} placeholder="Search name, email, or company"/></div>
    {error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
    {loading ? <AdminSkeleton rows={5}/> : recruiters.length ? <AdminTable headers={['Recruiter', 'Company', 'Designation', 'Location', 'Jobs', 'Joined']}>
      {recruiters.map((item) => <tr key={item.id} className="transition hover:bg-slate-700/20"><AdminTableCell><p className="font-medium text-white">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.email}</p></AdminTableCell><AdminTableCell className="font-medium text-slate-200">{item.company_name || 'Not added'}</AdminTableCell><AdminTableCell>{item.designation || '—'}</AdminTableCell><AdminTableCell>{item.location || '—'}</AdminTableCell><AdminTableCell><span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">{item.job_count}</span></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs">{dateLabel(item.created_at)}</AdminTableCell></tr>)}
    </AdminTable> : !error && <AdminEmpty title="No recruiters found" description={search ? 'Try another name, email, or company.' : 'Recruiter accounts will appear here after registration.'}/>}
  </div></AppLayout>
}
