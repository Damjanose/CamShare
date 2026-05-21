import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}))

import { useAuthStore } from "./authStore"
import type { User } from "@/types/domain"

const mockUser = (): User => ({
  id: "user-1",
  fullName: "Alice",
  email: "alice@example.com",
  avatarUrl: null,
  tier: "Free",
})

describe("authStore.updateUser", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser(), accessToken: "tok", sessionReady: true })
  })

  afterEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, sessionReady: false })
    localStorage.clear()
  })

  it("merges patch into user state", () => {
    useAuthStore.getState().updateUser({ fullName: "Bob" })
    expect(useAuthStore.getState().user?.fullName).toBe("Bob")
  })

  it("does not overwrite unpatched fields", () => {
    useAuthStore.getState().updateUser({ avatarUrl: "http://example.com/avatar.jpg" })
    expect(useAuthStore.getState().user?.fullName).toBe("Alice")
    expect(useAuthStore.getState().user?.avatarUrl).toBe("http://example.com/avatar.jpg")
  })

  it("persists updated user to localStorage", () => {
    useAuthStore.getState().updateUser({ fullName: "Charlie" })
    const stored = JSON.parse(localStorage.getItem("aeterna_session_user") ?? "null")
    expect(stored?.fullName).toBe("Charlie")
  })

  it("does nothing when user is null", () => {
    useAuthStore.setState({ user: null })
    useAuthStore.getState().updateUser({ fullName: "Ghost" })
    expect(useAuthStore.getState().user).toBeNull()
  })
})
