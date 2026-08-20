import { NavLink } from 'react-router-dom';

const bottomNavItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/resume', icon: 'description', label: 'Resume' },
  { to: '/skills', icon: 'psychology', label: 'Skills' },
  { to: '/progress', icon: 'trending_up', label: 'Progress' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant flex justify-around items-center h-16 px-1 pb-safe">
      {bottomNavItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 active:scale-95 w-full max-w-[80px] ${
              isActive
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined mb-0.5 text-xl ${isActive ? 'filled' : ''}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className={`text-[10px] leading-tight font-medium truncate ${isActive ? 'font-bold' : ''}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
