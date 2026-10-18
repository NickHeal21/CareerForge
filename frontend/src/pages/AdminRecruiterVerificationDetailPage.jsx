import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getAdminRecruiterVerification, getAdminVerificationDocument, reviewAdminRecruiterVerification } from '../api/admin'
import { adminError, AdminAlert, AdminPageHeader, AdminSkeleton } from '../components/AdminUI'

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const documentLabels = { COMPANY_ID: 'Company ID Card', AADHAAR: 'Aadhaar Card', PAN: 'PAN Card' }

export default function AdminRecruiterVerificationDetailPage() {
  const { verificationId } = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getAdminRecruiterVerification(verificationId)
      setApplication(data)
    } catch (err) {
      setError(adminError(err, 'This recruiter application could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [verificationId])

  useEffect(() => { load() }, [load])

  async function downloadDocument(document) {
    setBusy(true)
    setError('')
    try {
      const { data } = await getAdminVerificationDocument(verificationId, document.id)
      const url = URL.createObjectURL(data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.original_filename
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(adminError(err, 'The verification document could not be downloaded.'))
    } finally {
      setBusy(false)
    }
  }

  async function decide(status) {
    if (!application || application.status !== 'PENDING') return
    if (!window.confirm(`${status === 'APPROVED' ? 'Approve' : 'Deny'} recruiter access for ${application.recruiter_name}?`)) return
    let note = null
    if (status === 'DENIED') {
      note = window.prompt('Optional note for the recruiter:')
      if (note === null) return
    }
    setBusy(true)
    setError('')
    try {
      const { data } = await reviewAdminRecruiterVerification(verificationId, status, note)
      setApplication(data)
    } catch (err) {
      setError(adminError(err, 'The verification decision could not be saved. Refresh and check the current status.'))
    } finally {
      setBusy(false)
    }
  }

  return <AppLayout>
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
      <div className="mb-5"><Link to="/admin/recruiter-verifications" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">← Recruiter verification list</Link></div>
      {loading ? <AdminSkeleton rows={6}/> : error && !application ? <AdminAlert>{error}</AdminAlert> : application && <>
        <AdminPageHeader title="Review recruiter" description="Review the submitted company information and documents before deciding recruiter access." action={<span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${application.status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : application.status === 'DENIED' ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-200'}`}>{application.status}</span>}/>
        {error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
        <section className="rounded-2xl border border-slate-700/80 bg-slate-800/60 p-5 sm:p-7">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Recruiter" value={application.recruiter_name}/><Detail label="Email" value={application.recruiter_email}/>
            <Detail label="Company" value={application.company_name}/><Detail label="Designation" value={application.designation}/>
            <Detail label="Location" value={application.location}/><Detail label="Website" value={application.website}/>
            <Detail label="Submitted" value={dateLabel(application.submitted_at)}/><Detail label="Reviewed" value={dateLabel(application.reviewed_at)}/>
            <div className="sm:col-span-2"><Detail label="Company description" value={application.company_description}/></div>
          </div>
          <div className="mt-6 border-t border-slate-700 pt-5"><h2 className="font-semibold text-white">Verification documents</h2><p className="mt-1 text-xs text-slate-500">Documents are retrieved through an authenticated administrator-only endpoint.</p>
            {application.documents?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{application.documents.map((document) => <article key={document.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4"><div className="min-w-0"><p className="text-sm font-semibold text-white">{documentLabels[document.document_type] || document.document_type}</p><p className="mt-1 truncate text-xs text-slate-400">{document.original_filename}</p><p className="mt-1 text-[11px] text-slate-500">Uploaded {dateLabel(document.uploaded_at)}</p></div><button type="button" disabled={busy} onClick={() => downloadDocument(document)} className="shrink-0 rounded-lg border border-indigo-500/30 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-50">Download</button></article>)}</div> : <p className="mt-4 text-sm text-slate-500">No document metadata is available.</p>}
          </div>
          {application.admin_note && <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-rose-300">Admin note</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{application.admin_note}</p></div>}
          {application.status === 'PENDING' && <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-700 pt-5"><button type="button" disabled={busy} onClick={() => decide('DENIED')} className="rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50">Deny recruiter</button><button type="button" disabled={busy} onClick={() => decide('APPROVED')} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">{busy ? 'Saving…' : 'Approve recruiter'}</button></div>}
        </section>
      </>}
    </div>
  </AppLayout>
}

function Detail({ label, value }) {
  return <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-200">{value || 'Not provided'}</p></div>
}
