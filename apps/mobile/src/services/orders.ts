// apps/mobile/src/services/orders.ts
import { apiClient } from '../api/client';
import type {
  OrderSummary,
  OrderDetail,
  CheckoutInput,
  OrderStatus,
} from '@camshare/types';

export const ordersService = {
  list: () =>
    apiClient.get<OrderSummary[]>('/orders').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),

  checkout: (input: CheckoutInput) =>
    apiClient.post<OrderDetail>('/orders/checkout', input).then((r) => r.data),

  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    apiClient
      .patch<OrderDetail>(`/orders/${id}/status`, { status, note })
      .then((r) => r.data),
};
