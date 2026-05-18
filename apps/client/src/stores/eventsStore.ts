import { create } from "zustand"
import { mockEvents } from "@/data/mockEvents"
import type { Event } from "@/types/domain"

type EventInput = Omit<Event, "id" | "guestCount" | "photoCount" | "inviteCode" | "ownerId"> &
  Partial<Pick<Event, "guestCount" | "photoCount" | "inviteCode">>

type EventsState = {
  events: Event[]
  getById: (id: string) => Event | undefined
  addEvent: (input: EventInput) => Event
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "event"

export const useEventsStore = create<EventsState>((set, get) => ({
  events: mockEvents,
  getById: (id) => get().events.find((event) => event.id === id),
  addEvent: (input) => {
    const id = `evt-${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`
    const event: Event = {
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
    set({ events: [event, ...get().events] })
    return event
  },
}))
