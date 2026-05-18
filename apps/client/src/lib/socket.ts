import { io, type Socket } from "socket.io-client"
import { getEnv } from "../config/env"
import { useNotificationStore } from "../stores/notificationStore"
import { useSocketStore } from "../stores/socketStore"

let socket: Socket | null = null

export const connectRealtime = (accessToken: string, onInvalidate: () => void) => {
  disconnectRealtime()
  socket = io(getEnv().socketUrl, { auth: { token: accessToken } })

  socket.on("connect", () => useSocketStore.getState().setConnected(true))
  socket.on("disconnect", () => useSocketStore.getState().setConnected(false))

  const bump = () => {
    onInvalidate()
    useNotificationStore.getState().ping()
  }

  socket.on("order:created", bump)
  socket.on("order:status_updated", bump)
  socket.on("notification:new", bump)

  return socket
}

export const disconnectRealtime = () => {
  useSocketStore.getState().setConnected(false)
  socket?.disconnect()
  socket = null
}
