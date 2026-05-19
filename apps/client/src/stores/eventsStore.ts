import { create } from "zustand"
import { mockEvents } from "@/data/mockEvents"
import type { Event } from "@/types/domain"
import { apiClient } from "@/api/client"

type EventInput = Omit<Event, "id" | "guestCount" | "photoCount" | "inviteCode" | "ownerId"> &
  Partial<Pick<Event, "guestCount" | "photoCount" | "inviteCode">>

type ApiEvent = {
  id: string
  ownerId: string
  title: string
  description: string | null
  eventDate: string | null
  coverImageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type EventsState = {
  events: Event[]
  getById: (id: string) => Event | undefined
  addEvent: (input: EventInput) => Promise<Event>
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "event"

const fromApi = (apiEvent: ApiEvent, input: EventInput): Event => ({
  id: apiEvent.id,
  name: input.name,
  date: apiEvent.eventDate ?? input.date,
  location: input.location,
  description: apiEvent.description ?? input.description,
  coverUrl: apiEvent.coverImageUrl ?? input.coverUrl,
  privacy: input.privacy,
  guestCount: 0,
  photoCount: 0,
  inviteCode: slugify(input.name),
  ownerId: apiEvent.ownerId,
})

export const useEventsStore = create<EventsState>((set, get) => ({
  events: mockEvents,
  getById: (id) => get().events.find((event) => event.id === id),
  addEvent: async (input) => {
    let event: Event

    try {
      const apiEvent = await apiClient.post<ApiEvent>("/events", {
        title: input.name,
        description: input.description || undefined,
        eventDate: input.date || undefined,
        coverImageUrl: input.coverUrl || undefined,
      })
      event = fromApi(apiEvent, input)
    } catch {
      // fallback to local-only mock if API is unavailable
      const id = `evt-${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`
      event = {
        id,
        name: input.name,
        date: input.date,
        location: input.location,
        description: input.description,
        coverUrl: input.coverUrl,
        privacy: input.privacy,
        guestCount: input.guestCount ?? 0,
        photoCount: input.photoCount ?? 0,
        inviteCode: input.inviteCode ?? slugify(input.name),
        ownerId: "user-1",
      }
    }

    set({ events: [event, ...get().events] })
    return event
  },
}))
