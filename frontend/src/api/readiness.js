import api from './client'

export function analyzeReadiness(jobId, resumeId) {
  return api.post('/api/readiness/analyze', {
    job_id: jobId,
    ...(resumeId ? { resume_id: resumeId } : {}),
  })
}

export function listReadinessAnalyses() {
  return api.get('/api/readiness')
}

export function getReadinessAnalysis(id) {
  return api.get(`/api/readiness/${id}`)
}
