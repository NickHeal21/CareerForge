import api from './client'

export function getProfile() {
  return api.get('/api/profile')
}

export function updateProfile(profile) {
  return api.put('/api/profile', profile)
}
