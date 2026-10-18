import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getRecruiterVerificationStatus, submitRecruiterVerificationDocuments } from '../api/recruiter'
import { useAuth } from '../store/useAuthStore'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((item) => item?.msg).filter(Boolean).join('. ') || fallback
  return fallback
}

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function UploadField({ label, required, value, onChange, error }) {
  return <label className="block rounded-xl border border-slate-700 bg-slate-900/60 p-4">
    <span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white">{label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${required ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-700 text-slate-400'}`}>{required ? 'REQUIRED' : 'OPTIONAL'}</span></span>
    <span className="mt-1 block text-xs text-slate-500">PDF, JPG, JPEG, or PNG · Max 5 MB</span>
    <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onChange} className="mt-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-200 hover:file:bg-indigo-500/25" />
    {value && <span className="mt-2 block truncate text-xs text-emerald-300">Selected: {value.name}</span>}
    {error && <span role="alert" className="mt-2 block text-xs text-rose-300">{error}</span>}
  </label>
}

export default function RecruiterVerificationPage() {
  const { user, refreshUser } = useAuth()
  const [verification, setVerification] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  const [aadhaar, setAadhaar] = useState(null)
  const [pan, setPan] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadStatus = useCallback(async () => {
    setError('')
    try {
      const { data } = await getRecruiterVerificationStatus()
      setVerification(data)
      await refreshUser()
    } catch (err) {
      setError(friendlyError(err, 'We could not load your verification status. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  useEffect(() => { loadStatus() }, [loadStatus])

  function chooseFile(setter, key) {
    return (event) => {
      const file = event.target.files?.[0] || null
      event.target.value = ''
      setFieldErrors((current) => ({ ...current, [key]: '' }))
      if (!file) return
      const validExtension = /\.(pdf|jpe?g|png)$/i.test(file.name)
      if (!validExtension || (file.type && !ALLOWED_TYPES.includes(file.type))) {
        setter(null)
        setFieldErrors((current) => ({ ...current, [key]: 'Choose a PDF, JPG, JPEG, or PNG file.' }))
        return
      }
      if (file.size > MAX_BYTES) {
        setter(null)
        setFieldErrors((current) => ({ ...current, [key]: 'Choose a file that is 5 MB or smaller.' }))
        return
      }
      setter(file)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!companyId) {
      setFieldErrors((current) => ({ ...current, companyId: 'A Company ID document is required.' }))
      return
    }
    setSubmitting(true)
    try {
      const { data } = await submitRecruiterVerificationDocuments(companyId, aadhaar, pan)
      setVerification(data)
      setCompanyId(null)
      setAadhaar(null)
      setPan(null)
      setSuccess('Your verification documents have been submitted. Your account is awaiting admin approval.')
      await refreshUser()
    } catch (err) {
      setError(friendlyError(err, 'We could not submit your documents. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const status = verification?.verification_status || user?.verification_status || 'PENDING'
  const hasSubmitted = Boolean(verification?.submitted_at)

  return <AppLayout>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-7"><p className="text-sm font-medium text-indigo-300">Recruiter account</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Recruiter Verification</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Submit your company ID document for a manual review by the CareerForge administrator.</p></header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

      {loading ? <div className="h-48 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/60" aria-label="Loading verification status"/> : <>
        {status === 'APPROVED' ? <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Approved</span><h2 className="mt-2 text-2xl font-bold text-white">Your recruiter account is approved</h2><p className="mt-2 text-sm leading-6 text-slate-300">You can now use recruiter tools to manage your company profile, jobs, and applicants.</p><Link to="/recruiter" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">Continue to recruiter dashboard →</Link></section>
          : status === 'DENIED' ? <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-widest text-rose-300">Denied</span><h2 className="mt-2 text-2xl font-bold text-white">Your verification was not approved</h2><p className="mt-2 text-sm leading-6 text-slate-300">{verification?.admin_note || 'Please contact a CareerForge administrator for next steps.'}</p><p className="mt-4 text-xs text-slate-500">Resubmission is not available from this page.</p></section>
          : hasSubmitted ? <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-widest text-amber-200">Pending review</span><h2 className="mt-2 text-2xl font-bold text-white">Your documents are with our admin team</h2><p className="mt-2 text-sm leading-6 text-slate-300">Your verification documents have been submitted successfully. Your account is awaiting admin approval. You will be able to access recruiter features after approval.</p><p className="mt-4 text-xs text-slate-400">Submitted {dateLabel(verification.submitted_at)}</p><div className="mt-4 flex flex-wrap gap-2">{verification.documents?.map((document) => <span key={document.id} className="rounded-full border border-amber-300/10 bg-slate-950/30 px-3 py-1 text-xs text-amber-100">{document.document_type.replace('_', ' ')} · {document.original_filename}</span>)}</div></section>
          : <form onSubmit={submit} className="rounded-2xl border border-slate-700/80 bg-slate-800/60 p-5 shadow-lg sm:p-7"><div className="mb-5"><h2 className="text-lg font-semibold text-white">Verification documents</h2><p className="mt-1 text-sm text-slate-400">Files are stored privately and can only be opened by an administrator reviewing your application.</p></div><div className="space-y-3"><UploadField label="Company ID Card" required value={companyId} onChange={chooseFile(setCompanyId, 'companyId')} error={fieldErrors.companyId}/><UploadField label="Aadhaar Card" value={aadhaar} onChange={chooseFile(setAadhaar, 'aadhaar')} error={fieldErrors.aadhaar}/><UploadField label="PAN Card" value={pan} onChange={chooseFile(setPan, 'pan')} error={fieldErrors.pan}/></div><button type="submit" disabled={submitting} className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{submitting ? 'Submitting documents…' : 'Submit for verification'}</button><p className="mt-3 text-xs text-slate-500">Submission is one-time. If an application is denied, contact an administrator for next steps.</p></form>}
      </>}
    </div>
  </AppLayout>
}
