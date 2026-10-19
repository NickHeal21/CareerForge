import api from './client'

export function listJobs() {
  return api.get('/api/jobs')
}

export function searchExternalJobs({ query, location, cursor, employment_type, country, date_posted }) {
  return api.get('/api/external-jobs', {
    params: Object.fromEntries(
      Object.entries({ query, location, cursor, employment_type, country, date_posted })
        .filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
  })
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
