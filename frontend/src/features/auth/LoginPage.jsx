import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <main className="w-full max-w-md">
        <div className="bg-surface border border-outline-variant rounded-lg p-6 animate-fade-in">
          {/* Header / Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center mb-2">
              <span className="material-symbols-outlined filled text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              CareerForge
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Sign in to continue your journey
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-xs font-medium text-on-surface tracking-wide uppercase">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="you@example.com"
                className="bg-surface-container-low border border-outline-variant rounded px-4 py-2.5 text-sm text-on-surface outline-none transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-xs font-medium text-on-surface tracking-wide uppercase">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                placeholder="••••••••"
                className="bg-surface-container-low border border-outline-variant rounded px-4 py-2.5 text-sm text-on-surface outline-none transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-surface-tint transition-colors duration-200 disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
