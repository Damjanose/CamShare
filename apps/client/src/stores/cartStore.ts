import { create } from "zustand"

/** Local revision counter for cart-dependent queries (complements React Query keys). */
type CartState = {
  revision: number
  touch: () => void
}

export const useCartStore = create<CartState>((set) => ({
  revision: 0,
  touch: () => set((s) => ({ revision: s.revision + 1 })),
}))
