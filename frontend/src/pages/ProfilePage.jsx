import { useEffect, useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import ProfilePhotoAvatar from '../components/ProfilePhotoAvatar'
import { getProfile, updateProfile, uploadProfilePhoto } from '../api/profile'
import { useAuth } from '../store/useAuthStore'

const emptyProfile = {
  phone: '', location: '', bio: '', tenth_percentage: '', twelfth_percentage: '',
  ug_degree: '', ug_cgpa: '', pg_degree: '', pg_cgpa: '', skills: '',
  linkedin_url: '', github_url: '', leetcode_url: '', portfolio_url: '',
}

const sections = [
  { title: 'Personal Information', description: 'Add a few details so your profile feels like you.', fields: [
    ['phone', 'Phone number', 'tel'], ['location', 'Location', 'text'], ['bio', 'About you', 'textarea'],
  ] },
  { title: 'Education', description: 'Share your academic background.', fields: [
    ['tenth_percentage', '10th percentage', 'number'], ['twelfth_percentage', '12th percentage', 'number'],
    ['ug_degree', 'Undergraduate degree', 'text'], ['ug_cgpa', 'Undergraduate CGPA', 'number'],
    ['pg_degree', 'Postgraduate degree', 'text'], ['pg_cgpa', 'Postgraduate CGPA', 'number'],
  ] },
  { title: 'Skills', description: 'List skills separated by commas.', fields: [['skills', 'Your skills', 'textarea']] },
  { title: 'Social / Portfolio Links', description: 'Give people a place to learn more about your work.', fields: [
    ['linkedin_url', 'LinkedIn URL', 'url'], ['github_url', 'GitHub URL', 'url'],
    ['leetcode_url', 'LeetCode URL', 'url'], ['portfolio_url', 'Portfolio URL', 'url'],
  ] },
]

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInput = useRef(null)

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('')
      return undefined
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setForm(Object.fromEntries(Object.keys(emptyProfile).map((key) => [key, data[key] ?? ''])))
        setProfileImage(data.profile_image ?? null)
      })
      .catch(() => setError('We could not load your profile. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setSuccess(false)
  }

  function handlePhotoSelect(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setPhotoError('')
    setPhotoSuccess('')
    if (!file) return
    const validTypes = ['image/jpeg', 'image/png']
    const validExtension = /\.(jpe?g|png)$/i.test(file.name)
    if (!validExtension || (file.type && !validTypes.includes(file.type))) {
      setPhotoFile(null)
      setPhotoError('Choose a JPG, JPEG, or PNG image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoFile(null)
      setPhotoError('Choose an image smaller than 5 MB.')
      return
    }
    setPhotoFile(file)
  }

  async function handlePhotoUpload() {
    if (!photoFile) return
    setPhotoError('')
    setPhotoSuccess('')
    setUploadingPhoto(true)
    try {
      const { data } = await uploadProfilePhoto(photoFile)
      setProfileImage(data.profile_image ?? null)
      setPhotoFile(null)
      setPhotoSuccess('Profile photo updated.')
    } catch (err) {
      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => typeof item?.msg === 'string' ? item.msg : '').filter(Boolean).join(' ')
        : typeof detail === 'string' ? detail : ''
      setPhotoError(message || 'We could not upload your photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => {
      if (!value.trim()) return [key, null]
      if (key.endsWith('_percentage') || key.endsWith('_cgpa')) return [key, Number(value)]
      return [key, value.trim()]
    }))
    try {
      const { data } = await updateProfile(payload)
      setForm(Object.fromEntries(Object.keys(emptyProfile).map((key) => [key, data[key] ?? ''])))
      setSuccess(true)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'We could not save your profile. Check the values and try again.')
    } finally {
      setSaving(false)
    }
  }

  const completed = Object.values(form).filter((value) => String(value).trim()).length

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300">Your space</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">My Profile</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Keep your details together and up to date. You can fill in as much or as little as you like.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">{completed}</span> of {Object.keys(emptyProfile).length} details added
          </div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Profile saved successfully.</div>}

        {loading ? (
          <div className="space-y-4" aria-label="Loading profile">
            {[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="flex flex-col gap-5 rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:flex-row sm:items-center sm:p-6">
              <ProfilePhotoAvatar profileImage={profileImage} previewUrl={photoPreview} name={user?.name} size="h-24 w-24" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-white">Profile photo</h2>
                <p className="mt-1 text-sm text-slate-400">Add a photo to personalize your CareerForge dashboard. JPG, JPEG, or PNG, up to 5 MB.</p>
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handlePhotoSelect} className="sr-only" aria-label="Choose profile photo" />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => photoInput.current?.click()} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">{photoFile ? 'Choose another' : 'Choose photo'}</button>
                  {photoFile && <>
                    <button type="button" onClick={handlePhotoUpload} disabled={uploadingPhoto} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60">{uploadingPhoto ? 'Uploading…' : 'Upload photo'}</button>
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoError('') }} disabled={uploadingPhoto} className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                  </>}
                </div>
                {photoError && <p role="alert" className="mt-3 text-sm text-red-300">{photoError}</p>}
                {photoSuccess && <p role="status" className="mt-3 text-sm text-emerald-300">{photoSuccess}</p>}
              </div>
            </section>
            {sections.map((section, index) => (
              <section key={section.title} className="rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-semibold text-indigo-300">0{index + 1}</span>
                  <div><h2 className="font-semibold text-white">{section.title}</h2><p className="mt-1 text-sm text-slate-400">{section.description}</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map(([name, label, type]) => <Field key={name} name={name} label={label} type={type} value={form[name]} onChange={handleChange} />)}
                </div>
              </section>
            ))}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/95 py-4 backdrop-blur">
              <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}

function Field({ name, label, type, value, onChange }) {
  const multiline = type === 'textarea'
  const inputType = type === 'number' && name.endsWith('percentage') ? 'number' : type
  const common = {
    id: name, name, value, onChange, placeholder: 'Not added yet',
    className: 'w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30',
  }
  return <div className={multiline ? 'sm:col-span-2' : ''}>
    <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
    {multiline ? <textarea {...common} rows={name === 'bio' ? 4 : 3} /> : <input {...common} type={inputType} min={type === 'number' ? 0 : undefined} max={name.endsWith('percentage') ? 100 : name.endsWith('cgpa') ? 10 : undefined} step={type === 'number' ? 'any' : undefined} />}
  </div>
}
