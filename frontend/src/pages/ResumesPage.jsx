import { useCallback, useEffect, useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { deleteResume, getResumeFile, listResumes, renameResume, setDefaultResume, uploadResume } from '../api/resumes'

function friendlyError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === 'string') return item
      const message = typeof item?.msg === 'string' ? item.msg : ''
      const location = Array.isArray(item?.loc)
        ? item.loc.filter((part) => part !== 'body' && part !== 'query' && part !== 'path').join(' → ')
        : ''
      if (message && location) return `${message}: ${location}`
      return message || location
    }).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return fallback
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragging, setDragging] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const inputRef = useRef(null)

  const refreshResumes = useCallback(() => listResumes().then(({ data }) => setResumes(data)), [])

  useEffect(() => {
    refreshResumes()
      .catch((err) => setError(friendlyError(err, 'Your resumes could not be loaded. Please try again.')))
      .finally(() => setLoading(false))
  }, [refreshResumes])

  async function handleFiles(fileList) {
    const file = fileList?.[0]
    if (!file) return
    setError('')
    setSuccess('')
    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      setError('Choose a PDF file to upload.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('PDF files must be 10 MB or smaller.')
      return
    }

    setUploading(true)
    setProgress(0)
    try {
      await uploadResume(file, (event) => {
        if (event.total) setProgress(Math.round((event.loaded / event.total) * 100))
      })
      await refreshResumes()
      setProgress(100)
      setSuccess('Resume uploaded and text extracted successfully.')
    } catch (err) {
      setError(friendlyError(err, 'The resume could not be uploaded. Please try again.'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRename(resume) {
    setRenameTarget(resume)
    setRenameValue(resume.name)
    setError('')
    setSuccess('')
  }

  async function saveRename(event) {
    event.preventDefault()
    const resume = renameTarget
    if (!resume) return
    const name = renameValue.trim()
    if (!name) {
      setError('Resume name cannot be empty.')
      return
    }
    setError('')
    setSuccess('')
    setBusyId(resume.id)
    try {
      const { data } = await renameResume(resume.id, name)
      setResumes((items) => items.map((item) => item.id === resume.id ? data : item))
      setSuccess('Resume renamed.')
      setRenameTarget(null)
    } catch (err) {
      setError(friendlyError(err, 'The resume could not be renamed.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handlePreview(resume) {
    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      setError('Allow pop-ups to open the PDF preview.')
      return
    }
    setError('')
    try {
      const { data } = await getResumeFile(resume.id)
      const objectUrl = URL.createObjectURL(data)
      previewWindow.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (err) {
      previewWindow.close()
      setError(friendlyError(err, 'The PDF preview could not be opened.'))
    }
  }

  async function handleDefault(resume) {
    setError('')
    setSuccess('')
    setBusyId(resume.id)
    try {
      const { data } = await setDefaultResume(resume.id)
      setResumes((items) => items.map((item) => ({ ...item, is_default: item.id === data.id })))
      setSuccess(`${data.name} is now your default resume.`)
    } catch (err) {
      setError(friendlyError(err, 'The default resume could not be changed.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(resume) {
    if (!window.confirm(`Delete “${resume.name}”? This also removes the uploaded PDF.`)) return
    setError('')
    setSuccess('')
    setBusyId(resume.id)
    try {
      await deleteResume(resume.id)
      setResumes((items) => items.filter((item) => item.id !== resume.id))
      setSuccess('Resume deleted.')
    } catch (err) {
      setError(friendlyError(err, 'The resume could not be deleted.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300">Career toolkit</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Your resumes</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Keep your resume versions in one place. Your files stay private to your account.</p>
          </div>
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            <span className="text-lg leading-none">+</span> Upload resume
          </button>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>}

        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => handleFiles(event.target.files)} />
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); handleFiles(event.dataTransfer.files) }}
          className={`mb-8 rounded-2xl border border-dashed p-6 text-center transition sm:p-8 ${dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600 bg-slate-800/40'}`}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-xl text-indigo-300">PDF</div>
          <p className="font-semibold text-slate-100">Drop your resume here</p>
          <p className="mt-1 text-sm text-slate-400">PDF only · up to 10 MB</p>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-3 text-sm font-medium text-indigo-300 hover:text-indigo-200 disabled:opacity-60">Browse files</button>
          {uploading && <div className="mx-auto mt-5 max-w-md" role="status">
            <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Uploading and reading your PDF…</span><span>{progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold text-white">Saved versions</h2><p className="mt-0.5 text-sm text-slate-500">{resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}</p></div>
        </div>

        {loading ? <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60" />)}</div> : resumes.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-6 py-12 text-center sm:py-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/70 text-2xl">📄</div>
            <h3 className="text-lg font-semibold text-white">Your resume space is ready</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Upload your first PDF to keep it handy. Your first resume becomes your default automatically.</p>
            <button onClick={() => inputRef.current?.click()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">Upload your first resume</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {resumes.map((resume) => <ResumeCard key={resume.id} resume={resume} busy={busyId === resume.id} onPreview={handlePreview} onRename={handleRename} onDefault={handleDefault} onDelete={handleDelete} />)}
          </div>
        )}
      </div>
      {renameTarget && <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRenameTarget(null) }}>
        <form onSubmit={saveRename} role="dialog" aria-modal="true" aria-labelledby="rename-title" className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
          <p className="text-sm font-medium text-indigo-300">Resume details</p>
          <h2 id="rename-title" className="mt-1 text-xl font-semibold text-white">Rename resume</h2>
          <label htmlFor="resume-name" className="mb-1.5 mt-5 block text-sm font-medium text-slate-300">Resume name</label>
          <input id="resume-name" autoFocus maxLength={150} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setRenameTarget(null)} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={busyId === renameTarget.id} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">{busyId === renameTarget.id ? 'Saving…' : 'Save name'}</button>
          </div>
        </form>
      </div>}
    </AppLayout>
  )
}

function ResumeCard({ resume, busy, onPreview, onRename, onDefault, onDelete }) {
  const uploaded = new Date(resume.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  return <article className="rounded-2xl border border-slate-700/80 bg-slate-800/70 p-5 shadow-lg shadow-black/10">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-bold text-indigo-300">PDF</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-white" title={resume.name}>{resume.name}</h3>
          {resume.is_default && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Default</span>}
        </div>
        <p className="mt-1 truncate text-sm text-slate-400" title={resume.original_filename}>{resume.original_filename}</p>
        <p className="mt-2 text-xs text-slate-500">Added {uploaded}</p>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-700/80 pt-4">
      <button disabled={busy} onClick={() => onPreview(resume)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50">Open PDF</button>
      {!resume.is_default && <button disabled={busy} onClick={() => onDefault(resume)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/10 disabled:opacity-50">Set default</button>}
      <div className="ml-auto flex gap-1">
        <button disabled={busy} onClick={() => onRename(resume)} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50">Rename</button>
        <button disabled={busy} onClick={() => onDelete(resume)} className="rounded-lg px-2.5 py-1.5 text-xs text-red-300/80 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50">Delete</button>
      </div>
    </div>
  </article>
}
