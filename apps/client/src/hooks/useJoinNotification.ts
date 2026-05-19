import { useEffect, useState } from "react"
import { connectSocket, joinEventRoom } from "@/lib/socket"

type JoinPayload = { userId: string; eventId: string; fullName: string }

export type JoinToast = { id: number; fullName: string }

export const useJoinNotification = (eventId: string | undefined, accessToken: string | null) => {
  const [toasts, setToasts] = useState<JoinToast[]>([])

  useEffect(() => {
    if (!eventId || !accessToken) return

    const socket = connectSocket(accessToken)

    const onJoin = (payload: JoinPayload) => {
      if (payload.eventId !== eventId) return
      const toast: JoinToast = { id: Date.now(), fullName: payload.fullName }
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }

    socket.on("event:member_joined", onJoin)
    socket.once("connect", () => joinEventRoom(eventId))
    if (socket.connected) joinEventRoom(eventId)

    return () => {
      socket.off("event:member_joined", onJoin)
    }
  }, [eventId, accessToken])

  return toasts
}
