import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth'

/**
 * RegisterPage — /register
 *
 * Fields: Name, Email, Password, Confirm Password.
 * On success, redirects to /login with a success message.
 */
export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Clear field-level error when user starts typing
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  // ---------------------------------------------------------------------------
  // Client-side validation
  // ---------------------------------------------------------------------------
  function validate() {
    const errs = {}
    if (!form.name.trim())           errs.name     = 'Name is required'
    if (!form.email.trim())          errs.email    = 'Email is required'
    if (form.password.length < 6)    errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await registerUser(form.name.trim(), form.email.trim(), form.password)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">
            Career<span className="text-indigo-400">Forge</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">

          {/* Server error banner */}
          {serverError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name */}
            <Field
              label="Full Name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              autoComplete="name"
            />

            {/* Email */}
            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password */}
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />

            {/* Confirm Password */}
            <Field
              label="Confirm Password"
              name="confirm"
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={handleChange}
              error={errors.confirm}
              autoComplete="new-password"
            />

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors duration-200 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

          </form>

          <p className="text-slate-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

/* ── Reusable form field ──────────────────────────────────────────────────── */
function Field({ label, name, type, placeholder, value, onChange, error, autoComplete }) {
  return (
    <div>
      <label htmlFor={name} className="block text-slate-300 text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600
          text-sm outline-none transition-colors duration-150
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${error ? 'border-red-500' : 'border-slate-600 hover:border-slate-500'}`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
