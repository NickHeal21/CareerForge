import api from './client'

export function listResumes() {
  return api.get('/api/resumes')
}

export function uploadResume(selectedFile, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', selectedFile)
  return api.post('/api/resumes', formData, {
    // Let the browser add the multipart boundary; the shared client defaults to JSON.
    headers: { 'Content-Type': undefined },
    onUploadProgress,
  })
}

export function renameResume(id, name) {
  return api.patch(`/api/resumes/${id}`, { name })
}

export function deleteResume(id) {
  return api.delete(`/api/resumes/${id}`)
}

export function setDefaultResume(id) {
  return api.post(`/api/resumes/${id}/default`)
}

export function getResumeFile(id) {
  return api.get(`/api/resumes/${id}/file`, { responseType: 'blob' })
}
