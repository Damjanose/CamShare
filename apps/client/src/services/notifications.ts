import type { NotificationDto } from "@jewellery/types"
import { apiClient } from "../api/client"

export const fetchNotifications = async () => {
  const { data } = await apiClient.get<NotificationDto[]>("/notifications")
  return data
}

export const markNotificationRead = async (id: string) => {
  const { data } = await apiClient.patch<NotificationDto>(`/notifications/${id}/read`)
  return data
}

export const markAllNotificationsRead = async () => {
  await apiClient.post("/notifications/read-all")
}
