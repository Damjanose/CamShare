import { apiClient } from "@/api/client"

export type AdminUser = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export const listUsers = (): Promise<AdminUser[]> =>
  apiClient.get<AdminUser[]>("/admin/users")
