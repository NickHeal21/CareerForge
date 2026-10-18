import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { listAdminRecruiterVerifications } from '../api/admin'
import { adminError, AdminAlert, AdminEmpty, AdminPageHeader, AdminSearch, AdminSkeleton, AdminTable, AdminTableCell } from '../components/AdminUI'

function dateLabel(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function StatusBadge({ status }) {
  const tone = status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : status === 'DENIED' ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${tone}`}>{status}</span>
}

export default function AdminRecruiterVerificationsPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await listAdminRecruiterVerifications({ search: search || undefined, status: statusFilter || undefined })
      setItems(data)
    } catch (err) {
      setError(adminError(err, 'Recruiter verification applications could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, reload])

  useEffect(() => { load() }, [load])

  return <AppLayout>
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
      <AdminPageHeader title="Recruiter Verification" description="Review submitted company identity documents and approve or deny recruiter access." action={<button type="button" onClick={() => setReload((value) => value + 1)} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">Refresh</button>}/>
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]"><AdminSearch value={search} onChange={setSearch} placeholder="Search recruiter, email, or company"/><label className="sr-only" htmlFor="verification-filter">Filter verification status</label><select id="verification-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"><option value="PENDING">Pending review</option><option value="APPROVED">Approved</option><option value="DENIED">Denied</option><option value="">All statuses</option></select></div>
      {error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
      {loading ? <AdminSkeleton rows={5}/> : items.length ? <AdminTable headers={['Recruiter', 'Company', 'Designation', 'Location', 'Documents', 'Submitted', 'Status', '']}>
        {items.map((item) => <tr key={item.id} className="transition hover:bg-slate-700/20"><AdminTableCell><p className="font-medium text-white">{item.recruiter_name}</p><p className="mt-1 text-xs text-slate-500">{item.recruiter_email}</p></AdminTableCell><AdminTableCell>{item.company_name || 'Not provided'}</AdminTableCell><AdminTableCell>{item.designation || '—'}</AdminTableCell><AdminTableCell>{item.location || '—'}</AdminTableCell><AdminTableCell><div className="flex flex-wrap gap-1">{item.document_types.map((type) => <span key={type} className="rounded-md bg-slate-700 px-2 py-1 text-[10px] text-slate-300">{type.replace('_', ' ')}</span>)}</div></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs">{dateLabel(item.submitted_at)}</AdminTableCell><AdminTableCell><StatusBadge status={item.status}/></AdminTableCell><AdminTableCell className="text-right"><Link to={`/admin/recruiter-verifications/${item.id}`} className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/10">Review</Link></AdminTableCell></tr>)}
      </AdminTable> : !error && <AdminEmpty title="No applications found" description={search ? 'Try a different recruiter or company search.' : statusFilter === 'PENDING' ? 'There are no recruiter applications waiting for review.' : 'No applications match this status.'}/>}
    </div>
  </AppLayout>
}
