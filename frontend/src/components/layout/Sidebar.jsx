import { NavLink } from 'react-router-dom';

const primaryNavItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/resume', icon: 'description', label: 'Resume' },
  { to: '/skills', icon: 'psychology', label: 'Skills' },
  { to: '/progress', icon: 'trending_up', label: 'Progress' },
];

const secondaryNavItems = [
  { to: '/roadmap', icon: 'map', label: 'Roadmap' },
  { to: '/interview', icon: 'forum', label: 'Interview' },
  { to: '/mentor', icon: 'school', label: 'Mentor' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 z-50
          bg-surface border-r border-outline-variant
          flex flex-col p-4 space-y-2
          transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-4 py-6">
          <span className="text-xl font-bold text-primary tracking-tight">
            CareerForge
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-2">
          {primaryNavItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Secondary Navigation (below divider) */}
        <div className="border-t border-outline-variant pt-4">
          <div className="space-y-2">
            {secondaryNavItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {icon}
                    </span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
