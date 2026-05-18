import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { AuthResponse, LoginInput, RegisterInput, User } from "@jewellery/types"
import { apiClient } from "../api/client"
import { useAuthStore } from "../stores/authStore"

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const REFRESH_KEY = "template_refresh_token"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_KEY))

  useEffect(() => {
    const reqId = apiClient.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      return config
    })

    return () => apiClient.interceptors.request.eject(reqId)
  }, [accessToken])

  useEffect(() => {
    if (!refreshToken) {
      useAuthStore.getState().setSessionReady(true)
      return
    }

    const bootstrap = async () => {
      try {
        const { data } = await apiClient.post<AuthResponse>("/auth/refresh", { refreshToken })
        setUser(data.user)
        setAccessToken(data.tokens.accessToken)
        setRefreshToken(data.tokens.refreshToken)
        localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken)
      } catch {
        setUser(null)
        setAccessToken(null)
        setRefreshToken(null)
        localStorage.removeItem(REFRESH_KEY)
      } finally {
        useAuthStore.getState().setSessionReady(true)
      }
    }

    void bootstrap()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      login: async (input) => {
        const { data } = await apiClient.post<AuthResponse>("/auth/login", input)
        setUser(data.user)
        setAccessToken(data.tokens.accessToken)
        setRefreshToken(data.tokens.refreshToken)
        localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken)
      },
      register: async (input) => {
        const { data } = await apiClient.post<AuthResponse>("/auth/register", input)
        setUser(data.user)
        setAccessToken(data.tokens.accessToken)
        setRefreshToken(data.tokens.refreshToken)
        localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken)
      },
      logout: async () => {
        if (accessToken) {
          await apiClient.post("/auth/logout")
        }
        setUser(null)
        setAccessToken(null)
        setRefreshToken(null)
        localStorage.removeItem(REFRESH_KEY)
      },
    }),
    [accessToken, refreshToken, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
