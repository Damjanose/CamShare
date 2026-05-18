import { create } from "zustand"

/** Lightweight flag parallel to AuthProvider bootstrap (for components that avoid context). */
type AuthUiState = {
  sessionReady: boolean
  setSessionReady: (v: boolean) => void
}

export const useAuthStore = create<AuthUiState>((set) => ({
  sessionReady: false,
  setSessionReady: (sessionReady) => set({ sessionReady }),
}))
