import { create } from "zustand"
import { mockUser } from "@/data/mockUser"
import type { User } from "@/types/domain"

const STORAGE_KEY = "aeterna_session_user"

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
  login: (email: string, _password: string) => Promise<User>
  register: (input: { fullName: string; email: string; password: string }) => Promise<User>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  login: async (email) => {
    const user: User = { ...mockUser, email: email || mockUser.email }
    persistUser(user)
    set({ user })
    return user
  },
  register: async ({ fullName, email }) => {
    const user: User = {
      ...mockUser,
      fullName: fullName || mockUser.fullName,
      email: email || mockUser.email,
    }
    persistUser(user)
    set({ user })
    return user
  },
  logout: () => {
    persistUser(null)
    set({ user: null })
  },
}))
