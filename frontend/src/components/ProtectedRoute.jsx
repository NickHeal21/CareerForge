import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/useAuthStore'

/**
 * ProtectedRoute
 *
 * Wraps a route that requires the user to be logged in.
 * - While the auth store is still verifying a stored token, shows a spinner.
 * - If the user is not authenticated, redirects to /login.
 * - If authenticated, renders the children normally.
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  // Still checking localStorage token against the backend — avoid flash redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    const destination = user.role === 'ADMIN' ? '/admin' : user.role === 'RECRUITER' ? '/recruiter' : user.role === 'APPLICANT' ? '/dashboard' : '/'
    return <Navigate to={destination} replace />
  }

  return children
}
