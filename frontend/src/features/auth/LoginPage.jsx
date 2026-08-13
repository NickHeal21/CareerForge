import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { user, tokens } = res.data.data;
      setAuth(user, tokens.access_token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 p-4">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
      </div>

      <div className="glass relative z-10 w-full max-w-md rounded-2xl p-8 animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/25">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Welcome back</h1>
          <p className="mt-1 text-sm text-surface-200/60">Sign in to your CareerForge account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-surface-200/80">Email</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-200/40" />
              <input id="login-email" type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 pl-11 pr-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-surface-200/80">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-200/40" />
              <input id="login-password" type="password" value={form.password} onChange={update('password')} required placeholder="••••••••" className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 pl-11 pr-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>

          <button id="login-submit" type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/30 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-200/60">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">Create one</Link>
        </p>
      </div>
    </div>
  );
}
