import axios from 'axios'

/**
 * Pre-configured Axios instance.
 *
 * Base URL is empty so that Vite's dev-server proxy forwards /api/*
 * to http://localhost:8000 automatically.
 * In production you would set VITE_API_URL in the environment.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT token when available
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — centralised error handling
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage (auth will handle redirect)
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  },
)

export default api
