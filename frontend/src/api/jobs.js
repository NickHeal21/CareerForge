import api from './client'

export function listJobs() {
  return api.get('/api/jobs')
}

export function getJob(id) {
  return api.get(`/api/jobs/${id}`)
}

export function applyToJob(jobId, resumeId) {
  return api.post('/api/applications', { job_id: jobId, resume_id: resumeId })
}

export function listApplications() {
  return api.get('/api/applications')
}
