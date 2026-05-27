import { apiClient } from "@/api/client"

export type AdminUser = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export const listUsers = (): Promise<AdminUser[]> =>
  apiClient.get<AdminUser[]>("/admin/users")

export const adminSetUserPassword = (userId: string, newPassword: string): Promise<void> =>
  apiClient.patch(`/admin/users/${userId}/password`, { newPassword })

export const adminDeleteUser = (userId: string): Promise<void> =>
  apiClient.delete(`/admin/users/${userId}`)
