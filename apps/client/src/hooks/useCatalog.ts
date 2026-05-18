import { useQuery } from "@tanstack/react-query"
import type { Category, Product } from "@jewellery/types"
import { apiClient } from "../api/client"

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>("/categories")
      return data
    },
  })

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>("/products")
      return data
    },
  })
