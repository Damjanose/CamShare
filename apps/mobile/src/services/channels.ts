// apps/mobile/src/services/channels.ts
import { apiClient } from '../api/client';
import type { EventChannel, CreateChannelInput } from '@camshare/types';

export const channelsService = {
  list: (eventId: string) =>
    apiClient.get<EventChannel[]>(`/events/${eventId}/channels`).then((r) => r.data),

  create: (eventId: string, input: CreateChannelInput) =>
    apiClient.post<EventChannel>(`/events/${eventId}/channels`, input).then((r) => r.data),

  update: (eventId: string, channelId: string, input: Partial<CreateChannelInput>) =>
    apiClient
      .patch<EventChannel>(`/events/${eventId}/channels/${channelId}`, input)
      .then((r) => r.data),

  delete: (eventId: string, channelId: string) =>
    apiClient.delete(`/events/${eventId}/channels/${channelId}`).then((r) => r.data),
};
