import api from './client'

export function getAdminDashboard() {
  return api.get('/api/admin/dashboard')
}

export function listAdminUsers(params = {}) {
  return api.get('/api/admin/users', { params })
}

export function getAdminUser(id) {
  return api.get(`/api/admin/users/${id}`)
}

export function listAdminRecruiters(params = {}) {
  return api.get('/api/admin/recruiters', { params })
}

export function listAdminJobs(params = {}) {
  return api.get('/api/admin/jobs', { params })
}

export function getAdminJob(id) {
  return api.get(`/api/admin/jobs/${id}`)
}

export function listAdminApplications(params = {}) {
  return api.get('/api/admin/applications', { params })
}

export function listAdminRecruiterVerifications(params = {}) {
  return api.get('/api/admin/recruiter-verifications', { params })
}

export function getAdminRecruiterVerification(id) {
  return api.get(`/api/admin/recruiter-verifications/${id}`)
}

export function getAdminVerificationDocument(verificationId, documentId) {
  return api.get(`/api/admin/recruiter-verifications/${verificationId}/documents/${documentId}`, { responseType: 'blob' })
}

export function reviewAdminRecruiterVerification(id, status, adminNote = null) {
  return api.patch(`/api/admin/recruiter-verifications/${id}`, { status, admin_note: adminNote })
}
