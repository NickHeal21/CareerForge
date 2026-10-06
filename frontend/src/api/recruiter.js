import api from './client'

export function getRecruiterProfile() {
  return api.get('/api/recruiter/profile')
}

export function updateRecruiterProfile(profile) {
  return api.put('/api/recruiter/profile', profile)
}

export function listRecruiterJobs() {
  return api.get('/api/recruiter/jobs')
}

export function createRecruiterJob(job) {
  return api.post('/api/recruiter/jobs', job)
}

export function getRecruiterJob(id) {
  return api.get(`/api/recruiter/jobs/${id}`)
}

export function updateRecruiterJob(id, job) {
  return api.put(`/api/recruiter/jobs/${id}`, job)
}

export function deleteRecruiterJob(id) {
  return api.delete(`/api/recruiter/jobs/${id}`)
}

export function listRecruiterJobApplications(jobId) {
  return api.get(`/api/recruiter/jobs/${jobId}/applications`)
}

export function getRecruiterApplication(applicationId) {
  return api.get(`/api/recruiter/applications/${applicationId}`)
}

export function updateRecruiterApplicationStatus(applicationId, status) {
  return api.patch(`/api/recruiter/applications/${applicationId}/status`, { status })
}

export function getRecruiterApplicationResume(applicationId) {
  return api.get(`/api/recruiter/applications/${applicationId}/resume`, { responseType: 'blob' })
}
