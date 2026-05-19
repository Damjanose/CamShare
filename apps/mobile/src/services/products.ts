// apps/mobile/src/services/products.ts
import { apiClient } from '../api/client';
import type { Product, CreateProductInput, UpdateProductInput } from '@camshare/types';

export const productsService = {
  list: () =>
    apiClient.get<Product[]>('/products').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (input: CreateProductInput) =>
    apiClient.post<Product>('/products', input).then((r) => r.data),

  update: (id: string, input: UpdateProductInput) =>
    apiClient.patch<Product>(`/products/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}`).then((r) => r.data),
};
