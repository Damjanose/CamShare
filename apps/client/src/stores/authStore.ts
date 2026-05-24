import { create } from "zustand"
import type { User } from "@/types/domain"
import { apiClient, setTokens, clearTokens } from "@/api/client"

const STORAGE_KEY = "aeterna_session_user"
const REFRESH_KEY = "camshare_refresh_token"
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001"

type ApiAuthResponse = {
  user: { id: string; fullName: string; email: string; avatarUrl: string | null }
  tokens: { accessToken: string; refreshToken: string }
}

const toWebUser = (u: ApiAuthResponse["user"]): User => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatarUrl: u.avatarUrl,
  tier: "Free",
})

const loadUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

const persistUser = (user: User | null) => {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* no-op */
  }
}

type AuthState = {
  user: User | null
  accessToken: string | null
  sessionReady: boolean
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  register: (input: { fullName: string; email: string; password: string }) => Promise<User>
  logout: () => void
  deleteAccount: (password: string) => Promise<void>
  updateUser: (patch: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  accessToken: null,
  sessionReady: false,
  bootstrap: async () => {
    const rt = localStorage.getItem(REFRESH_KEY)
    if (!rt) {
      set({ sessionReady: true })
      return
    }
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      })
      if (!res.ok) throw new Error("refresh failed")
      const data: ApiAuthResponse = await res.json()
      setTokens(data.tokens.accessToken, data.tokens.refreshToken)
      const user = toWebUser(data.user)
      persistUser(user)
      set({ user, accessToken: data.tokens.accessToken, sessionReady: true })
    } catch {
      clearTokens()
      persistUser(null)
      set({ user: null, accessToken: null, sessionReady: true })
    }
  },
  login: async (email, password) => {
    const data = await apiClient.post<ApiAuthResponse>("/auth/login", { email, password })
    setTokens(data.tokens.accessToken, data.tokens.refreshToken)
    const user = toWebUser(data.user)
    persistUser(user)
    set({ user, accessToken: data.tokens.accessToken })
    return user
  },
  register: async ({ fullName, email, password }) => {
    const data = await apiClient.post<ApiAuthResponse>("/auth/register", {
      email,
      password,
      fullName,
    })
    setTokens(data.tokens.accessToken, data.tokens.refreshToken)
    const user = toWebUser(data.user)
    persistUser(user)
    set({ user, accessToken: data.tokens.accessToken })
    return user
  },
  logout: () => {
    clearTokens()
    persistUser(null)
    set({ user: null, accessToken: null })
  },
  deleteAccount: async (password) => {
    await apiClient.delete("/account", { password })
    clearTokens()
    persistUser(null)
    set({ user: null, accessToken: null })
  },
  updateUser: (patch) => {
    set((s) => {
      if (!s.user) return s
      const updated = { ...s.user, ...patch }
      persistUser(updated)
      return { user: updated }
    })
  },
}))
