import { Navigate } from "react-router-dom"
import type { ReactElement } from "react"
import { useAuth } from "./AuthContext"

export const AdminRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
