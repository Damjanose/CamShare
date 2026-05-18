import { Navigate } from "react-router-dom"
import { useAuth } from "../types/auth-context"

export const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const ok =
    user.permissions.includes("admin") ||
    user.permissions.includes("product.write") ||
    user.permissions.includes("order.write")

  if (!ok) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
