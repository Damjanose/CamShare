// apps/mobile/src/services/photos.ts
import { apiClient } from '../api/client';
import type { EventPhoto, AddPhotoInput } from '@camshare/types';

export const photosService = {
  list: (eventId: string, channelId: string) =>
    apiClient
      .get<EventPhoto[]>(`/events/${eventId}/channels/${channelId}/photos`)
      .then((r) => r.data),

  add: (eventId: string, channelId: string, input: AddPhotoInput) =>
    apiClient
      .post<EventPhoto>(`/events/${eventId}/channels/${channelId}/photos`, input)
      .then((r) => r.data),

  delete: (eventId: string, channelId: string, photoId: string) =>
    apiClient
      .delete(`/events/${eventId}/channels/${channelId}/photos/${photoId}`)
      .then((r) => r.data),
};
