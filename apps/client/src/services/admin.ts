import type { CreateProductInput, Product, UpdateProductInput } from "@jewellery/types"
import { apiClient } from "../api/client"

export const createProduct = async (input: CreateProductInput) => {
  const { data } = await apiClient.post<Product>("/products", input)
  return data
}

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const { data } = await apiClient.patch<Product>(`/products/${id}`, input)
  return data
}

export const deleteProduct = async (id: string) => {
  await apiClient.delete(`/products/${id}`)
}
