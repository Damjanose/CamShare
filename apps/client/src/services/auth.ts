import type { AuthResponse, LoginInput, RegisterInput } from "@jewellery/types"
import { apiClient } from "../api/client"

export const loginRequest = async (body: LoginInput) => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", body)
  return data
}

export const registerRequest = async (body: RegisterInput) => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", body)
  return data
}
