import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/useAuthStore'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ResumesPage from './pages/ResumesPage'
import JobsPage from './pages/JobsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ReadinessPage from './pages/ReadinessPage'
import RoadmapPage from './pages/RoadmapPage'
import MentorPage from './pages/MentorPage'
import RecruiterDashboardPage from './pages/RecruiterDashboardPage'
import RecruiterProfilePage from './pages/RecruiterProfilePage'
import RecruiterJobsPage from './pages/RecruiterJobsPage'
import RecruiterApplicantsPage from './pages/RecruiterApplicantsPage'
import RecruiterCandidatePage from './pages/RecruiterCandidatePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminRecruitersPage from './pages/AdminRecruitersPage'
import AdminJobsPage from './pages/AdminJobsPage'
import AdminApplicationsPage from './pages/AdminApplicationsPage'

/**
 * App — root component.
 *
 * AuthProvider wraps all routes so every page can access the auth context.
 * ProtectedRoute gates any route that requires login.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="APPLICANT">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProtectedRoute allowedRole="APPLICANT"><ProfilePage /></ProtectedRoute>} />
        <Route path="/resumes" element={<ProtectedRoute allowedRole="APPLICANT"><ResumesPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute allowedRole="APPLICANT"><JobsPage /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute allowedRole="APPLICANT"><ApplicationsPage /></ProtectedRoute>} />
        <Route path="/readiness" element={<ProtectedRoute allowedRole="APPLICANT"><ReadinessPage /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute allowedRole="APPLICANT"><RoadmapPage /></ProtectedRoute>} />
        <Route path="/mentor" element={<ProtectedRoute allowedRole="APPLICANT"><MentorPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRole="ADMIN"><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/recruiters" element={<ProtectedRoute allowedRole="ADMIN"><AdminRecruitersPage /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute allowedRole="ADMIN"><AdminJobsPage /></ProtectedRoute>} />
        <Route path="/admin/applications" element={<ProtectedRoute allowedRole="ADMIN"><AdminApplicationsPage /></ProtectedRoute>} />
        <Route path="/recruiter" element={<ProtectedRoute allowedRole="RECRUITER"><RecruiterDashboardPage /></ProtectedRoute>} />
        <Route path="/recruiter/profile" element={<ProtectedRoute allowedRole="RECRUITER"><RecruiterProfilePage /></ProtectedRoute>} />
        <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRole="RECRUITER"><RecruiterJobsPage /></ProtectedRoute>} />
        <Route path="/recruiter/jobs/:jobId/applications" element={<ProtectedRoute allowedRole="RECRUITER"><RecruiterApplicantsPage /></ProtectedRoute>} />
        <Route path="/recruiter/applications/:applicationId" element={<ProtectedRoute allowedRole="RECRUITER"><RecruiterCandidatePage /></ProtectedRoute>} />

        {/* Catch-all — redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Future routes (add as phases progress):
            <Route path="/resume" element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
            <Route path="/jobs"   element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        */}
      </Routes>
    </AuthProvider>
  )
}
