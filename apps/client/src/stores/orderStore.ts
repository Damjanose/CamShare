import { create } from "zustand"

type OrderState = {
  lastCheckoutId: string | null
  setLastCheckoutId: (id: string | null) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  lastCheckoutId: null,
  setLastCheckoutId: (lastCheckoutId) => set({ lastCheckoutId }),
}))
