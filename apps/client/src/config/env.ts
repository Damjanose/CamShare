const trimSlash = (s: string) => s.replace(/\/$/, "")

export const getEnv = () => ({
  apiUrl: trimSlash(import.meta.env.VITE_API_URL ?? "http://localhost:3001"),
  socketUrl: trimSlash(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3001"),
})
