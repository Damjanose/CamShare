import type { Server as IOServer } from "socket.io"

let io: IOServer | null = null

export const setSocketServer = (server: IOServer) => {
  io = server
}

export const getSocketServer = () => io

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(roomForUser(userId)).emit(event, payload)
}

export const roomForUser = (userId: string) => `user:${userId}`

export const emitToEvent = (eventId: string, event: string, payload: unknown) => {
  io?.to(roomForEvent(eventId)).emit(event, payload)
}

export const roomForEvent = (eventId: string) => `event:${eventId}`
