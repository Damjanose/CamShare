import { apiClient } from '../api/client';
import type { EventPhoto, AddPhotoInput } from '@camshare/types';

export type ListPhotosParams = {
  uploaderId?: string;
  submittedOnly?: boolean;
};

export const photosService = {
  list: (eventId: string, channelId: string, params?: ListPhotosParams) =>
    apiClient
      .get<EventPhoto[]>(`/events/${eventId}/channels/${channelId}/photos`, { params })
      .then((r) => r.data),

  add: (eventId: string, channelId: string, input: AddPhotoInput) =>
    apiClient
      .post<EventPhoto>(`/events/${eventId}/channels/${channelId}/photos`, input)
      .then((r) => r.data),

  delete: (eventId: string, channelId: string, photoId: string) =>
    apiClient
      .delete(`/events/${eventId}/channels/${channelId}/photos/${photoId}`)
      .then((r) => r.data),

  setFinal: (eventId: string, channelId: string, photoId: string, isFinal: boolean) =>
    apiClient
      .patch<EventPhoto>(`/events/${eventId}/channels/${channelId}/photos/${photoId}/final`, { isFinal })
      .then((r) => r.data),
};
