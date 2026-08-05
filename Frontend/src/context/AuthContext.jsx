import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authApi from '@/services/auth'
import { apiClient } from '@/services/apiClient'

const TOKEN_KEY = 'evalai-access-token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const persistToken = useCallback((token) => {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  }, [])

  const applySession = useCallback(
    (data) => {
      if (data?.token) persistToken(data.token)
      setUser(data?.user ?? null)
    },
    [persistToken],
  )

  const hydrate = useCallback(async () => {
    try {
      if (!window.localStorage.getItem(TOKEN_KEY)) {
        setUser(null)
        return
      }
      const data = await authApi.me()
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials)
      applySession(data)
      return data.user
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload)
      applySession(data)
      return data.user
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Local cleanup happens regardless of network state.
    }
    persistToken(null)
    setUser(null)
  }, [persistToken])

  const updateUser = useCallback((next) => setUser((prev) => ({ ...prev, ...next })), [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, hydrate, updateUser }),
    [user, loading, login, register, logout, hydrate, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.')
  return context
}

export { apiClient }

export default AuthProvider
