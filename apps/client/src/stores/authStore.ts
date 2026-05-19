import { create } from "zustand"
import { mockUser } from "@/data/mockUser"
import type { User } from "@/types/domain"
import { apiClient, setTokens, clearTokens } from "@/api/client"

const STORAGE_KEY = "aeterna_session_user"

type ApiAuthResponse = {
  user: { id: string; fullName: string; email: string }
  tokens: { accessToken: string; refreshToken: string }
}

const toWebUser = (u: ApiAuthResponse["user"]): User => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatarUrl: mockUser.avatarUrl,
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
  login: (email: string, password: string) => Promise<User>
  register: (input: { fullName: string; email: string; password: string }) => Promise<User>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  login: async (email, password) => {
    const data = await apiClient.post<ApiAuthResponse>("/auth/login", { email, password })
    setTokens(data.tokens.accessToken, data.tokens.refreshToken)
    const user = toWebUser(data.user)
    persistUser(user)
    set({ user })
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
    set({ user })
    return user
  },
  logout: () => {
    clearTokens()
    persistUser(null)
    set({ user: null })
  },
}))
