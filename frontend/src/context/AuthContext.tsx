import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, getStoredToken, setStoredToken, setUnauthorizedHandler } from '../lib/api'
import type { User, LoginResponse } from '../types'

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    // Optionally fire and forget logout to backend
    const currentToken = getStoredToken()
    if (currentToken) {
      api('/auth/logout', { method: 'POST' }).catch(() => {})
    }
    setStoredToken(null)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
    })
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [logout])

  useEffect(() => {
    let isMounted = true

    const verifyExistingSession = async () => {
      const stored = getStoredToken()
      if (!stored) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await api<User>('/auth/me')
        if (isMounted) {
          setUser(currentUser)
          setToken(stored)
        }
      } catch {
        if (isMounted) {
          setStoredToken(null)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    verifyExistingSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (username: string, password: string): Promise<void> => {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setStoredToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext)
}
