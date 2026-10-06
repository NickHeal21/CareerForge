import api from './client'

export function createRoadmap(readinessAnalysisId) {
  return api.post('/api/roadmaps', { readiness_analysis_id: readinessAnalysisId })
}

export function listRoadmaps() {
  return api.get('/api/roadmaps')
}

export function getRoadmap(id) {
  return api.get(`/api/roadmaps/${id}`)
}

export function updateRoadmapItem(roadmapId, itemId, completed) {
  return api.patch(`/api/roadmaps/${roadmapId}/items/${itemId}`, { completed })
}
