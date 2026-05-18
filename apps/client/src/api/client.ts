import axios from "axios"
import { getEnv } from "../config/env"

export const apiClient = axios.create({
  baseURL: getEnv().apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
})
