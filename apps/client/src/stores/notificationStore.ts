import { create } from "zustand"

type NotificationState = {
  /** Bumped on each realtime notification for UI pulse (idempotent updates use query cache). */
  liveEpoch: number
  ping: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  liveEpoch: 0,
  ping: () => set((s) => ({ liveEpoch: s.liveEpoch + 1 })),
}))
