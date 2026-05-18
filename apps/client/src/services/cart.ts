import type { CartResponse } from "@jewellery/types"
import { apiClient } from "../api/client"

export const fetchCart = async () => {
  const { data } = await apiClient.get<CartResponse>("/cart")
  return data
}

export const addToCart = async (productId: string, quantity: number) => {
  const { data } = await apiClient.post<CartResponse>("/cart/items", { productId, quantity })
  return data
}

export const updateCartLine = async (productId: string, quantity: number) => {
  const { data } = await apiClient.patch<CartResponse>(`/cart/items/${productId}`, { quantity })
  return data
}

export const removeCartLine = async (productId: string) => {
  const { data } = await apiClient.delete<CartResponse>(`/cart/items/${productId}`)
  return data
}
