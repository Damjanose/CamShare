import { io, type Socket } from "socket.io-client"

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? "http://10.81.202.106:3001"

let socket: Socket | null = null

export const connectSocket = (accessToken: string) => {
  if (socket?.connected) return socket
  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ["websocket"],
    reconnection: true,
  })
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}

export const getSocket = () => socket

export const joinEventRoom = (eventId: string) => {
  socket?.emit("join-event", eventId)
}
