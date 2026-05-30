import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { useAuthStore } from "@/stores/authStore"
import type { User } from "@/types/domain"

type AppleUserData = { name?: { firstName?: string; lastName?: string }; email?: string }

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<User>
  register: (input: { fullName: string; email: string; password: string }) => Promise<User>
  googleLogin: (googleAccessToken: string) => Promise<User>
  appleLogin: (idToken: string, userData?: AppleUserData) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const sessionReady = useAuthStore((s) => s.sessionReady)
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const googleLogin = useAuthStore((s) => s.googleLogin)
  const appleLogin = useAuthStore((s) => s.appleLogin)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const value = useMemo(
    () => ({ user, accessToken, login, register, googleLogin, appleLogin, logout }),
    [user, accessToken, login, register, googleLogin, appleLogin, logout],
  )

  if (!sessionReady) return null

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
