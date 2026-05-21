import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from "@/api/client"
import { useEventsStore } from "./eventsStore"

const mockEvent = (overrides = {}) => ({
  id: "evt-1",
  ownerId: "user-1",
  title: "Test Event",
  description: null,
  eventDate: null,
  endDate: null,
  coverImageUrl: null,
  isActive: false,
  guestCount: 0,
  photoCount: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
})

describe("eventsStore.restoreEvent", () => {
  beforeEach(() => {
    useEventsStore.setState({ events: [mockEvent()], loading: false, error: null, initialized: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    useEventsStore.setState({ events: [], loading: false, error: null, initialized: false })
  })

  it("sets isActive to true in store on success", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(undefined as unknown)
    await useEventsStore.getState().restoreEvent("evt-1")
    expect(useEventsStore.getState().events[0].isActive).toBe(true)
    expect(apiClient.patch).toHaveBeenCalledWith("/events/evt-1", { isActive: true })
  })

  it("does not mutate store on API error", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error("Network error"))
    await expect(useEventsStore.getState().restoreEvent("evt-1")).rejects.toThrow("Network error")
    expect(useEventsStore.getState().events[0].isActive).toBe(false)
  })
})
