import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { connectRealtime, disconnectRealtime } from "../lib/socket"
import { useAuth } from "../types/auth-context"

export const useSocketLifecycle = () => {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!accessToken) {
      disconnectRealtime()
      return
    }

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] })
      void queryClient.invalidateQueries({ queryKey: ["order"] })
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void queryClient.invalidateQueries({ queryKey: ["cart"] })
    }

    connectRealtime(accessToken, invalidate)
    return () => disconnectRealtime()
  }, [accessToken, queryClient])
}
