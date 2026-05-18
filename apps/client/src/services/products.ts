import type { Product } from "@jewellery/types"
import { apiClient } from "../api/client"

export const fetchProducts = async (params?: { featured?: boolean; categoryId?: string }) => {
  const { data } = await apiClient.get<Product[]>("/products", { params })
  return data
}

export const fetchProduct = async (id: string) => {
  const { data } = await apiClient.get<Product>(`/products/${id}`)
  return data
}
