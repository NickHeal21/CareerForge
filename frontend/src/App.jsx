import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

/**
 * App — root component.
 * Define all page routes here.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Future routes — add as phases progress:
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs"      element={<JobsPage />} />
          <Route path="/resume"    element={<ResumePage />} />
      */}
    </Routes>
  )
}
