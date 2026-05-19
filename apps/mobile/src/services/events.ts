// apps/mobile/src/services/events.ts
import { apiClient } from '../api/client';
import type {
  Event,
  EventMember,
  CreateEventInput,
  UpdateEventInput,
  JoinEventInput,
} from '@camshare/types';

export const eventsService = {
  list: () =>
    apiClient.get<Event[]>('/events').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Event>(`/events/${id}`).then((r) => r.data),

  create: (input: CreateEventInput) =>
    apiClient.post<Event>('/events', input).then((r) => r.data),

  update: (id: string, input: UpdateEventInput) =>
    apiClient.patch<Event>(`/events/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/events/${id}`).then((r) => r.data),

  // Returns the joined Event (the event you become a member of)
  join: (input: JoinEventInput) =>
    apiClient.post<Event>('/events/join', input).then((r) => r.data),

  createJoinToken: (id: string) =>
    apiClient.post<{ token: string }>(`/events/${id}/join-token`).then((r) => r.data),

  getMembers: (id: string) =>
    apiClient.get<EventMember[]>(`/events/${id}/members`).then((r) => r.data),
};
