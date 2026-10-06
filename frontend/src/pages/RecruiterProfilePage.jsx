import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { getRecruiterProfile, updateRecruiterProfile } from '../api/recruiter'

const emptyProfile = {
  company_name: '', company_logo: '', designation: '', company_description: '', location: '', website: '',
}

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

export default function RecruiterProfilePage() {
  const [form, setForm] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getRecruiterProfile()
      .then(({ data }) => setForm(Object.fromEntries(Object.keys(emptyProfile).map((key) => [key, data[key] ?? '']))))
      .catch((err) => setError(friendlyError(err, 'Your company profile could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setSuccess(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || null]))
    try {
      const { data } = await updateRecruiterProfile(payload)
      setForm(Object.fromEntries(Object.keys(emptyProfile).map((key) => [key, data[key] ?? ''])))
      setSuccess(true)
    } catch (err) {
      setError(friendlyError(err, 'Your company profile could not be saved. Check the details and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const initials = form.company_name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'CO'

  return <AppLayout>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-indigo-300">Recruiter workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Company profile</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Introduce your organization and the person representing it.</p></div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-600 bg-slate-900 text-sm font-bold text-indigo-200">{form.company_logo ? <img src={form.company_logo} alt={`${form.company_name || 'Company'} logo`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : initials}</div><div><p className="text-xs uppercase tracking-wide text-slate-500">Company preview</p><p className="mt-0.5 max-w-48 truncate text-sm font-semibold text-white">{form.company_name || 'Your company'}</p></div></div>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Company profile saved successfully.</div>}

      {loading ? <div aria-label="Loading company profile" className="h-[34rem] animate-pulse rounded-2xl border border-slate-800 bg-slate-800/50" /> : <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="mb-5 flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-semibold text-indigo-300">01</span><div><h2 className="font-semibold text-white">Organization</h2><p className="mt-1 text-sm text-slate-400">Add the key details candidates should know about your company.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="company_name" label="Company name" value={form.company_name} onChange={handleChange} placeholder="e.g. Northstar Labs" />
            <Field name="company_logo" label="Company logo URL" value={form.company_logo} onChange={handleChange} placeholder="https://example.com/logo.png" type="url" />
            <Field name="location" label="Location" value={form.location} onChange={handleChange} placeholder="City, country or remote" />
            <Field name="website" label="Company website" value={form.website} onChange={handleChange} placeholder="https://company.com" type="url" />
            <div className="sm:col-span-2"><Field name="company_description" label="Company description" value={form.company_description} onChange={handleChange} placeholder="Tell candidates about your team, mission, and work." multiline /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="mb-5 flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-semibold text-indigo-300">02</span><div><h2 className="font-semibold text-white">Your role</h2><p className="mt-1 text-sm text-slate-400">Show candidates who they’ll hear from.</p></div></div>
          <div className="max-w-xl"><Field name="designation" label="Designation" value={form.designation} onChange={handleChange} placeholder="e.g. Talent Acquisition Partner" /></div>
        </section>

        <div className="sticky bottom-0 flex justify-end border-t border-slate-800 bg-slate-900/95 py-4 backdrop-blur"><button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save company profile'}</button></div>
      </form>}
    </div>
  </AppLayout>
}

function Field({ name, label, value, onChange, placeholder, type = 'text', multiline = false }) {
  const className = 'w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
  return <div><label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>{multiline ? <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={5} maxLength={5000} className={className} /> : <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={type === 'url' ? 1000 : 500} className={className} />}</div>
}
