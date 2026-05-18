import type { Server } from "node:http"
import jwt from "jsonwebtoken"
import { Server as IOServer } from "socket.io"
import { roomForUser, setSocketServer } from "./realtime.js"

const accessSecret = process.env.JWT_ACCESS_SECRET
if (!accessSecret) {
  throw new Error("JWT_ACCESS_SECRET is required")
}

export const attachSocket = (httpServer: Server) => {
  const io = new IOServer(httpServer, {
    cors: { origin: true, credentials: true },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined
      if (!token) {
        next(new Error("Unauthorized"))
        return
      }
      const decoded = jwt.verify(token, accessSecret) as { sub: string }
      socket.data.userId = decoded.sub
      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string
    void socket.join(roomForUser(userId))
  })

  setSocketServer(io)
  return io
}
