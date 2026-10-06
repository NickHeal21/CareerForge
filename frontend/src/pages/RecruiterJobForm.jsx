import { useState } from 'react'
import { createRecruiterJob, updateRecruiterJob } from '../api/recruiter'

const blankJob = (companyName = '') => ({
  title: '', company_name: companyName || '', location: '', description: '', required_skills: '', application_url: '',
})

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

export default function RecruiterJobForm({ job, companyName, onCancel, onSaved }) {
  const [form, setForm] = useState(() => job ? {
    title: job.title,
    company_name: job.company_name,
    location: job.location,
    description: job.description,
    required_skills: job.required_skills,
    application_url: job.application_url,
  } : blankJob(companyName))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
    try {
      const { data } = job
        ? await updateRecruiterJob(job.id, payload)
        : await createRecruiterJob(payload)
      onSaved(data)
    } catch (err) {
      setError(friendlyError(err, 'The job could not be saved. Check the details and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = 'w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'

  return <div className="fixed inset-0 z-30 overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="job-form-title" className="mx-auto my-5 w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl sm:my-10 sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-indigo-300">Recruiter workspace</p><h2 id="job-form-title" className="mt-1 text-2xl font-bold text-white">{job ? 'Edit job' : 'Create a job'}</h2><p className="mt-1 text-sm text-slate-400">Share a clear, accurate description of the role.</p></div><button type="button" aria-label="Close form" onClick={onCancel} disabled={saving} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50">×</button></div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" name="title" value={form.title} onChange={updateField} placeholder="e.g. Frontend Engineer" required maxLength={180} />
          <Field label="Company name" name="company_name" value={form.company_name} onChange={updateField} placeholder="Company or organization" required maxLength={180} />
          <Field label="Location" name="location" value={form.location} onChange={updateField} placeholder="City, country or remote" required maxLength={180} />
          <Field label="Application URL" name="application_url" type="url" value={form.application_url} onChange={updateField} placeholder="https://company.com/careers/role" required />
          <div className="sm:col-span-2"><Field label="Required skills" name="required_skills" value={form.required_skills} onChange={updateField} placeholder="Python, SQL, communication…" required maxLength={5000} multiline rows={3} hint="Separate skills with commas so applicants can scan the requirements." /></div>
          <div className="sm:col-span-2"><Field label="Job description" name="description" value={form.description} onChange={updateField} placeholder="Describe the role, responsibilities, and what a successful candidate will bring." required maxLength={20000} multiline rows={7} /></div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-700 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{saving ? 'Saving job…' : job ? 'Save changes' : 'Create job'}</button>
        </div>
      </form>
    </section>
  </div>
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required, maxLength, multiline = false, rows, hint }) {
  const className = 'w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
  return <div><label htmlFor={`job-${name}`} className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>{multiline ? <textarea id={`job-${name}`} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} maxLength={maxLength} rows={rows} className={className} /> : <input id={`job-${name}`} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} maxLength={maxLength} className={className} />}{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>
}
