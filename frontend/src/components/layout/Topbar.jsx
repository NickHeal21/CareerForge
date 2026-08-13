import { HiOutlineBell, HiOutlineLogout } from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';

export default function Topbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="glass flex h-16 items-center justify-between border-b border-brand-500/10 px-6">
      <div>
        <h2 className="text-sm font-medium text-surface-200/60">
          Welcome back,
        </h2>
        <p className="text-base font-semibold text-surface-100">
          {user?.full_name || 'User'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          id="notifications-btn"
          className="relative rounded-xl p-2.5 text-surface-200/60 transition-colors hover:bg-surface-700/50 hover:text-surface-100"
        >
          <HiOutlineBell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-surface-700/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500">
            <span className="text-sm font-bold text-white">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-surface-200/80 hidden sm:inline">
            {user?.full_name || 'User'}
          </span>
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={logout}
          className="rounded-xl p-2.5 text-surface-200/60 transition-colors hover:bg-danger-500/10 hover:text-danger-500"
          title="Logout"
        >
          <HiOutlineLogout className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
