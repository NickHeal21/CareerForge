import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuthStore'

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
  const isRecruiter = user?.role === 'RECRUITER' && user?.verification_status === 'APPROVED'
  const isPendingRecruiter = user?.role === 'RECRUITER' && !isRecruiter
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 md:flex">
      <aside className="border-b border-slate-800 bg-slate-950/50 px-4 py-4 md:flex md:w-64 md:flex-col md:border-b-0 md:border-r md:px-5 md:py-6">
        <Link to="/dashboard" className="text-xl font-extrabold text-white">
          Career<span className="text-indigo-400">Forge</span>
        </Link>
        <nav className="mt-5 flex flex-wrap gap-2 md:flex-col">
          {isAdmin ? <>
            <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/admin/users" className={navClass}>Users</NavLink>
            <NavLink to="/admin/recruiters" className={navClass}>Recruiters</NavLink>
            <NavLink to="/admin/recruiter-verifications" className={navClass}>Recruiter Verification</NavLink>
            <NavLink to="/admin/jobs" className={navClass}>Jobs</NavLink>
            <NavLink to="/admin/applications" className={navClass}>Applications</NavLink>
          </> : isPendingRecruiter ? <>
            <NavLink to="/recruiter/verification" className={navClass}>Recruiter Verification</NavLink>
          </> : isRecruiter ? <>
            <NavLink to="/recruiter" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/recruiter/profile" className={navClass}>Company Profile</NavLink>
            <NavLink to="/recruiter/jobs" className={navClass}>My Jobs</NavLink>
          </> : <>
            <NavLink to="/dashboard" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/profile" className={navClass}>My Profile</NavLink>
            <NavLink to="/resumes" className={navClass}>My Resumes</NavLink>
            <NavLink to="/jobs" className={navClass}>Jobs</NavLink>
            <NavLink to="/applications" className={navClass}>My Applications</NavLink>
            <NavLink to="/readiness" className={navClass}>Job Readiness</NavLink>
            <NavLink to="/roadmap" className={navClass}>Career Roadmap</NavLink>
            <NavLink to="/mentor" className={navClass}>AI Mentor</NavLink>
          </>}
        </nav>
        <div className="mt-auto hidden border-t border-slate-800 pt-5 md:block">
          <p className="truncate text-sm font-medium text-slate-200">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button onClick={handleLogout} className="mt-4 text-sm text-slate-400 hover:text-white">Log out</button>
        </div>
        <button onClick={handleLogout} className="ml-auto text-sm text-slate-400 hover:text-white md:hidden">Log out</button>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
