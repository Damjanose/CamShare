// apps/mobile/src/services/cart.ts
import { apiClient } from '../api/client';
import type { CartLine, CartResponse } from '@camshare/types';

export const cartService = {
  get: () =>
    apiClient.get<CartResponse>('/cart').then((r) => r.data),

  addItem: (productId: string, quantity: number) =>
    apiClient.post<CartLine>('/cart/items', { productId, quantity }).then((r) => r.data),

  updateItem: (productId: string, quantity: number) =>
    apiClient.patch<CartLine>(`/cart/items/${productId}`, { quantity }).then((r) => r.data),

  removeItem: (productId: string) =>
    apiClient.delete(`/cart/items/${productId}`).then((r) => r.data),
};
