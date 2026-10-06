import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

/**
 * AuthContext
 *
 * Provides:
 *   user        — the logged-in user object, or null
 *   token       — the JWT string, or null
 *   loading     — true while we are verifying an existing token on first load
 *   login(data) — store token + user after a successful login response
 *   logout()    — clear everything and return to /login
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)   // true until first-load check is done

  // ---------------------------------------------------------------------------
  // On first mount — restore session from localStorage if a token exists.
  // We call /api/auth/me to verify the token is still valid.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      setLoading(false)
      return
    }

    api
      .get('/api/auth/me')
      .then((res) => {
        setToken(storedToken)
        setUser(res.data)
      })
      .catch(() => {
        // Token is invalid or expired — clear it
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  // ---------------------------------------------------------------------------
  // login — called after a successful POST /api/auth/login
  // Receives the full TokenResponse from the backend.
  // ---------------------------------------------------------------------------
  const login = useCallback((tokenResponse) => {
    const { access_token, user: userData } = tokenResponse
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
  }, [])

  // ---------------------------------------------------------------------------
  // logout — clears state and storage
  // ---------------------------------------------------------------------------
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, loading, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth — custom hook to consume auth state anywhere in the app.
 *
 * Usage:
 *   const { user, login, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
