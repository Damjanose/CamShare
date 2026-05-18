import { Navigate, useLocation } from "react-router-dom"
import type { ReactElement } from "react"
import { useAuth } from "./AuthContext"

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
