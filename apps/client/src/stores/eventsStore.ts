import { create } from "zustand"
import type { Event } from "@/types/domain"
import { apiClient } from "@/api/client"

type EventInput = Omit<Event, "id" | "guestCount" | "photoCount" | "ownerId" | "createdAt" | "updatedAt" | "isActive">

type EventsState = {
  events: Event[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  getById: (id: string) => Event | undefined
  addEvent: (input: EventInput) => Promise<Event>
  restoreEvent: (id: string) => Promise<void>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    set({ loading: true, error: null })
    try {
      const events = await apiClient.get<Event[]>("/events")
      set({ events, loading: false })
    } catch {
      set({ loading: false, error: "Failed to load events" })
    }
  },

  getById: (id) => get().events.find((e) => e.id === id),

  addEvent: async (input) => {
    const event = await apiClient.post<Event>("/events", {
      title: input.title,
      description: input.description || undefined,
      eventDate: input.eventDate || undefined,
      endDate: input.endDate || undefined,
      coverImageUrl: input.coverImageUrl || undefined,
    })
    set({ events: [event, ...get().events] })
    return event
  },

  restoreEvent: async (id) => {
    await apiClient.patch(`/events/${id}`, { isActive: true })
    set({ events: get().events.map((e) => e.id === id ? { ...e, isActive: true } : e) })
  },
}))
