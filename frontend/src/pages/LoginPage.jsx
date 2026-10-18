import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { useAuth } from '../store/useAuthStore'

function dashboardPath(account) {
  return account?.role === 'ADMIN' ? '/admin' : account?.role === 'RECRUITER' ? '/recruiter' : account?.role === 'APPLICANT' ? '/dashboard' : '/'
}

/**
 * LoginPage — /login
 *
 * Fields: Email, Password.
 * On success, stores the JWT via useAuth().login() and redirects to /dashboard.
 * Shows a success banner when arriving from the registration flow.
 */
export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, user } = useAuth()

  const [form, setForm]           = useState({ email: '', password: '' })
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]     = useState(false)
  // If the user is already logged in, skip straight to dashboard
  useEffect(() => {
    if (user) navigate(dashboardPath(user), { replace: true })
  }, [user, navigate])

  const justRegistered = location.state?.registered

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  function validate() {
    const errs = {}
    if (!form.email.trim())    errs.email    = 'Email is required'
    if (!form.password.trim()) errs.password = 'Password is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await loginUser(form.email.trim(), form.password)
      login(res.data)                         // store token + user in context + localStorage
      navigate(dashboardPath(res.data.user), { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">
            Career<span className="text-indigo-400">Forge</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">

          {/* Registration success banner */}
          {justRegistered && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
              Account created! You can now sign in.
            </div>
          )}

          {/* Server error banner */}
          {serverError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600
                  text-sm outline-none transition-colors duration-150
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  ${errors.email ? 'border-red-500' : 'border-slate-600 hover:border-slate-500'}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600
                  text-sm outline-none transition-colors duration-150
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  ${errors.password ? 'border-red-500' : 'border-slate-600 hover:border-slate-500'}`}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors duration-200 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>

          <p className="text-slate-400 text-sm text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
