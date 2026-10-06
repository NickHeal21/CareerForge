import { useEffect, useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { sendMentorMessage } from '../api/mentor'

const starterPrompts = [
  'What should I learn next?',
  'Why is my readiness score low?',
  'How can I improve my resume?',
  'Help me prepare for an interview.',
]

function friendlyError(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean)
    if (messages.length) return messages.join('. ')
  }
  return 'AI Mentor could not respond right now. Please try again.'
}

function ContextStatus({ label, available }) {
  const text = available == null ? 'Checked after your first message' : available ? 'Available' : 'Not available yet'
  const color = available == null ? 'text-slate-500' : available ? 'text-emerald-300' : 'text-slate-500'
  const symbol = available == null ? '·' : available ? '✓' : '○'
  return <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-slate-300">{label}</span><span className={`text-xs ${color}`}><span className="mr-1.5">{symbol}</span>{text}</span></div>
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <article className={`max-w-[92%] rounded-2xl px-4 py-3.5 sm:max-w-[82%] ${isUser ? 'rounded-br-md border border-indigo-500/30 bg-indigo-600/25 text-indigo-50' : 'rounded-bl-md border border-slate-700 bg-slate-800/80 text-slate-200'}`}>
      <div className="mb-1.5 flex items-center gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${isUser ? 'bg-indigo-400/20 text-indigo-200' : 'bg-emerald-400/10 text-emerald-300'}`}>{isUser ? 'Y' : '✦'}</span><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{isUser ? 'You' : 'AI Mentor'}</span></div>
      <div className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</div>
    </article>
  </div>
}

export default function MentorPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedMessage, setFailedMessage] = useState('')
  const [contextUsed, setContextUsed] = useState(null)
  const pendingRef = useRef(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, error])

  async function submitMessage(value, retrying = false) {
    const message = value.trim()
    if (!message || pendingRef.current) return

    const previousMessages = messages
    pendingRef.current = true
    setLoading(true)
    setError('')
    if (!retrying) {
      setMessages((items) => [...items, { role: 'user', content: message }])
      setInput('')
      setFailedMessage('')
    }

    try {
      const history = retrying ? previousMessages.slice(0, -1) : previousMessages
      const { data } = await sendMentorMessage(message, history)
      setMessages((items) => [...items, { role: 'assistant', content: data.reply }])
      setContextUsed(data.context_used)
      setFailedMessage('')
    } catch (err) {
      setError(friendlyError(err))
      setFailedMessage(message)
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    submitMessage(input)
  }

  function onInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitMessage(input)
    }
  }

  return <AppLayout><div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-8 sm:py-8">
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-indigo-300">Career intelligence</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">AI Mentor</h1><p className="mt-2 text-sm text-slate-400">Your personalized CareerForge career assistant</p></div><div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-200 sm:self-auto"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Career guidance, grounded in your workspace</div></header>
    <div className="grid flex-1 gap-5 lg:min-h-[650px] lg:grid-cols-[minmax(0,1fr)_270px]">
      <section aria-label="AI Mentor conversation" className="flex min-h-[68vh] flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/50 shadow-xl shadow-black/10 lg:min-h-0">
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5 sm:px-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-emerald-500/20 text-lg text-indigo-200">✦</div><div><p className="text-sm font-semibold text-white">CareerForge AI Mentor</p><p className="text-xs text-slate-500">Ask about your goals, skills, or next step</p></div></div>
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-5 sm:px-5 sm:py-6">
          {messages.length === 0 ? <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-5"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-2xl text-indigo-200">✦</div><h2 className="mt-4 text-center text-xl font-semibold text-white">A thoughtful next step starts here</h2><p className="mt-2 text-center text-sm leading-6 text-slate-400">Hi! I can help you work through your career roadmap, skill gaps, resume, interview preparation, and technical concepts. What would you like to focus on?</p><div className="mt-6 grid gap-2 sm:grid-cols-2">{starterPrompts.map((prompt) => <button key={prompt} type="button" disabled={loading} onClick={() => submitMessage(prompt)} className="rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-3 text-left text-sm text-slate-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-white disabled:opacity-50">{prompt}<span className="float-right text-indigo-300">↗</span></button>)}</div></div> : messages.map((message, index) => <MessageBubble key={`${message.role}-${index}`} message={message} />)}
          {loading && <div className="flex justify-start"><div role="status" className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800/80 px-4 py-3"><span className="flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.2s]"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.1s]"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300"/></span><span className="text-xs text-slate-400">Thinking through your context…</span></div></div>}
          {error && <div role="alert" className="ml-2 max-w-xl rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3"><p className="text-sm leading-6 text-red-200">{error}</p>{failedMessage && <button type="button" disabled={loading} onClick={() => submitMessage(failedMessage, true)} className="mt-2 text-xs font-semibold text-red-300 underline decoration-red-500/40 underline-offset-4 hover:text-red-100 disabled:opacity-50">Retry response</button>}</div>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={onSubmit} className="border-t border-slate-800 bg-slate-950/30 p-3 sm:p-4"><label className="sr-only" htmlFor="mentor-input">Ask your AI Mentor</label><div className="flex items-end gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-indigo-500/60"><textarea ref={inputRef} id="mentor-input" rows={1} maxLength={2000} value={input} disabled={loading} onChange={(event) => setInput(event.target.value)} onKeyDown={onInputKeyDown} placeholder="Ask your AI Mentor…" className="max-h-32 min-h-10 flex-1 resize-y bg-transparent py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-500 disabled:opacity-50"/><button type="submit" disabled={loading || !input.trim()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><span>{loading ? 'Sending…' : 'Send'}</span><span aria-hidden="true">↗</span></button></div><div className="mt-2 flex justify-between px-1 text-[10px] text-slate-600"><span>Enter to send · Shift+Enter for a new line</span><span>{input.length}/2000</span></div></form>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-700/80 bg-slate-800/50 p-4 sm:p-5 lg:sticky lg:top-6"><div className="flex items-center gap-2"><span className="text-indigo-300">✧</span><div><h2 className="text-sm font-semibold text-white">Career Context</h2><p className="mt-0.5 text-[11px] text-slate-500">Your saved data, when available</p></div></div><div className="mt-4 divide-y divide-slate-700/70"><ContextStatus label="Resume" available={contextUsed?.resume} /><ContextStatus label="Profile" available={contextUsed?.profile} /><ContextStatus label="Readiness" available={contextUsed?.readiness} /><ContextStatus label="Roadmap" available={contextUsed?.roadmap} /></div><div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3.5"><h3 className="text-xs font-semibold text-slate-200">How your mentor helps</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">The assistant uses your latest saved career information to make suggestions. General learning questions are welcome too.</p></div><p className="mt-4 text-[10px] leading-4 text-slate-600">Your chat stays in this browser session. Saved CareerForge records remain private to your account.</p></aside>
    </div>
  </div></AppLayout>
}
