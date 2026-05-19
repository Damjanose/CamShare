// apps/mobile/src/services/categories.ts
import { apiClient } from '../api/client';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@camshare/types';

export const categoriesService = {
  list: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (input: CreateCategoryInput) =>
    apiClient.post<Category>('/categories', input).then((r) => r.data),

  update: (id: string, input: UpdateCategoryInput) =>
    apiClient.patch<Category>(`/categories/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`).then((r) => r.data),
};
