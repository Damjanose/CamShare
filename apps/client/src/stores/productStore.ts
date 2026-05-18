import { create } from "zustand"

type ProductUiState = {
  /** When true, listing pages may request `featured=true` from the API */
  preferFeatured: boolean
  setPreferFeatured: (v: boolean) => void
}

export const useProductStore = create<ProductUiState>((set) => ({
  preferFeatured: false,
  setPreferFeatured: (preferFeatured) => set({ preferFeatured }),
}))
