// apps/mobile/src/services/notifications.ts
import { apiClient } from '../api/client';
import type { NotificationDto } from '@camshare/types';

export const notificationsService = {
  list: () =>
    apiClient.get<NotificationDto[]>('/notifications').then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post('/notifications/read-all').then((r) => r.data),
};
