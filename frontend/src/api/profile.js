import api from './client'

export function getProfile() {
  return api.get('/api/profile')
}

export function updateProfile(profile) {
  return api.put('/api/profile', profile)
}

export function uploadProfilePhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  // Clear the shared JSON default; Axios/browser then adds multipart/form-data with its boundary.
  return api.post('/api/profile/photo', formData, { headers: { 'Content-Type': undefined } })
}

export function getProfilePhoto() {
  return api.get('/api/profile/photo', { responseType: 'blob' })
}
