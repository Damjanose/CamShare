import { create } from 'zustand';
import type { CartLine } from '@camshare/types';

type CartState = {
  items: CartLine[];
  count: number;
  setCart: (items: CartLine[]) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  count: 0,
  setCart: (items) =>
    set({ items, count: items.reduce((sum, i) => sum + i.quantity, 0) }),
  clear: () => set({ items: [], count: 0 }),
}));
