import type { CheckoutInput, OrderDetail, OrderSummary } from "@jewellery/types"
import { apiClient } from "../api/client"

export const fetchOrders = async () => {
  const { data } = await apiClient.get<OrderSummary[]>("/orders")
  return data
}

export const fetchOrder = async (id: string) => {
  const { data } = await apiClient.get<OrderDetail>(`/orders/${id}`)
  return data
}

export const checkout = async (input: CheckoutInput) => {
  const { data } = await apiClient.post<OrderDetail>("/orders/checkout", input)
  return data
}

export const updateOrderStatus = async (id: string, status: string, note?: string) => {
  const { data } = await apiClient.patch<OrderDetail>(`/orders/${id}/status`, { status, note })
  return data
}
