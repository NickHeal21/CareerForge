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
