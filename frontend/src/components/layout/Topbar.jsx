import { useAuthStore } from '../../store/authStore';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuthStore();

  const initials = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center px-5 py-2 md:px-8 transition-colors duration-200">
      {/* Left: Hamburger + Brand (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="md:hidden font-semibold text-xl text-primary tracking-tight">
          CareerForge
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search (desktop only) */}
        <button
          className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>

        {/* Notifications (desktop only) */}
        <button
          id="notifications-btn"
          className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm font-bold cursor-pointer overflow-hidden border border-outline-variant hover:border-outline transition-colors">
          {initials}
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={logout}
          className="hidden md:flex p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-full transition-colors"
          title="Logout"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </div>
    </header>
  );
}
