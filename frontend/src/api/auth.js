import api from './client'

/**
 * auth.js — all API calls related to authentication.
 *
 * Every function returns the Axios response so the caller
 * can access response.data directly.
 */

/** POST /api/auth/register */
export function registerUser(name, email, password, role = 'APPLICANT') {
  return api.post('/api/auth/register', { name, email, password, role })
}

/** POST /api/auth/login */
export function loginUser(email, password) {
  return api.post('/api/auth/login', { email, password })
}

/** GET /api/auth/me  (token attached automatically by Axios interceptor) */
export function getMe() {
  return api.get('/api/auth/me')
}
