import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineMap,
  HiOutlineChatAlt2,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
} from 'react-icons/hi';

const navItems = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/resume', icon: HiOutlineDocumentText, label: 'Resume' },
  { to: '/skills', icon: HiOutlineLightningBolt, label: 'Skill Gap' },
  { to: '/roadmap', icon: HiOutlineMap, label: 'Roadmap' },
  { to: '/interview', icon: HiOutlineAcademicCap, label: 'Interview' },
  { to: '/mentor', icon: HiOutlineChatAlt2, label: 'AI Mentor' },
  { to: '/progress', icon: HiOutlineChartBar, label: 'Progress' },
];

export default function Sidebar() {
  return (
    <aside className="glass flex w-64 flex-col border-r border-brand-500/10">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
          <span className="text-lg font-bold text-white">C</span>
        </div>
        <span className="text-xl font-bold gradient-text">CareerForge</span>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 shadow-lg shadow-brand-500/5'
                  : 'text-surface-200/70 hover:bg-surface-700/50 hover:text-surface-100'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-700/50 px-4 py-4">
        <p className="text-xs text-surface-200/40 text-center">CareerForge v1.0</p>
      </div>
    </aside>
  );
}
