import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { getAdminUser, listAdminUsers } from '../api/admin'
import { AdminAlert, AdminEmpty, AdminModal, AdminPageHeader, AdminRoleBadge, AdminSearch, AdminSkeleton, AdminTable, AdminTableCell, adminError } from '../components/AdminUI'

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

function DetailValue({ label, value }) {
  const display = value === null || value === undefined || value === '' ? 'Not provided' : value
  return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-200">{display}</p></div>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      listAdminUsers({ search: search.trim() || undefined, role: role || undefined, limit: 100 })
        .then(({ data }) => { if (active) setUsers(data) })
        .catch((err) => { if (active) { setUsers([]); setError(adminError(err, 'Users could not be loaded.')) } })
        .finally(() => { if (active) setLoading(false) })
    }, 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search, role])

  async function openUser(id) {
    setSelectedId(id)
    setDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    try {
      const { data } = await getAdminUser(id)
      setDetails(data)
    } catch (err) {
      setDetailsError(adminError(err, 'User details could not be loaded.'))
    } finally {
      setDetailsLoading(false)
    }
  }

  const user = details?.user
  const profile = details?.profile
  const recruiter = details?.recruiter_profile

  return <AppLayout><div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
    <AdminPageHeader title="Users" description="Search and review CareerForge accounts. Account records are read-only in this view." />
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]"><AdminSearch value={search} onChange={setSearch} placeholder="Search by name or email"/><label><span className="sr-only">Filter users by role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"><option value="">All roles</option><option value="APPLICANT">Applicant</option><option value="RECRUITER">Recruiter</option><option value="ADMIN">Admin</option></select></label></div>
    {error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
    {loading ? <AdminSkeleton rows={6}/> : users.length ? <AdminTable headers={['Name', 'Email', 'Role', 'Created', '']}>
      {users.map((item) => <tr key={item.id} className="transition hover:bg-slate-700/20"><AdminTableCell className="font-medium text-white">{item.name}</AdminTableCell><AdminTableCell>{item.email}</AdminTableCell><AdminTableCell><AdminRoleBadge role={item.role}/></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs">{dateLabel(item.created_at)}</AdminTableCell><AdminTableCell className="text-right"><button type="button" onClick={() => openUser(item.id)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/10">View details</button></AdminTableCell></tr>)}
    </AdminTable> : !error && <AdminEmpty title="No users found" description={search || role ? 'Try a different search or role filter.' : 'Registered accounts will appear here.'}/>}

    {selectedId != null && <AdminModal title="User details" onClose={() => setSelectedId(null)}>{detailsLoading ? <AdminSkeleton rows={4}/> : detailsError ? <AdminAlert>{detailsError}</AdminAlert> : details && <><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-white">{user.name}</h3><p className="mt-1 text-sm text-slate-400">{user.email}</p></div><AdminRoleBadge role={user.role}/></div><p className="mt-2 text-xs text-slate-500">Joined {dateLabel(user.created_at)}</p><div className="mt-5 grid grid-cols-2 gap-3">{user.role === 'APPLICANT' ? <><DetailValue label="Resumes" value={details.resume_count}/><DetailValue label="Applications" value={details.application_count}/><DetailValue label="Phone" value={profile?.phone}/><DetailValue label="Location" value={profile?.location}/><DetailValue label="Education" value={[profile?.ug_degree, profile?.pg_degree].filter(Boolean).join(' · ')}/><DetailValue label="Skills" value={profile?.skills}/></> : user.role === 'RECRUITER' ? <><DetailValue label="Company" value={recruiter?.company_name}/><DetailValue label="Designation" value={recruiter?.designation}/><DetailValue label="Location" value={recruiter?.location}/><DetailValue label="Jobs" value={details.job_count}/></> : <DetailValue label="Role" value="Platform administrator"/>}</div><p className="mt-5 border-t border-slate-700 pt-4 text-[11px] text-slate-500">Authentication credentials and password hashes are never included in admin responses.</p></>}</AdminModal>}
  </div></AppLayout>
}
