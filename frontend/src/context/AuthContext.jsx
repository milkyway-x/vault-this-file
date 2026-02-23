import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('vtf_token')
    const stored = localStorage.getItem('vtf_user')
    if (token && stored) {
      setUser(JSON.parse(stored))
      // Verify token is still valid
      authApi.me()
        .then(({ data }) => setUser(data.user))
        .catch(() => clearSession())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const clearSession = () => {
    localStorage.removeItem('vtf_token')
    localStorage.removeItem('vtf_user')
    setUser(null)
  }

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('vtf_token', data.token)
    localStorage.setItem('vtf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (creds) => {
    const { data } = await authApi.register(creds)
    localStorage.setItem('vtf_token', data.token)
    localStorage.setItem('vtf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('vtf_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
