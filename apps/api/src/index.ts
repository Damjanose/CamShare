import { createServer } from "node:http"
import path from "node:path"
import "dotenv/config"
import express from "express"
import cors from "cors"
import * as authHandlers from "./handlers/auth.js"
import * as cartHandlers from "./handlers/cart.js"
import * as categoryHandlers from "./handlers/categories.js"
import * as notificationHandlers from "./handlers/notifications.js"
import * as orderHandlers from "./handlers/orders.js"
import * as productHandlers from "./handlers/products.js"
import * as eventHandlers from "./handlers/events.js"
import * as eventChannelHandlers from "./handlers/eventChannels.js"
import * as eventPhotoHandlers from "./handlers/eventPhotos.js"
import * as uploadHandlers from "./handlers/upload.js"
import * as adminHandlers from "./handlers/admin.js"
import { requireAuth, requirePermission } from "./middleware/auth.js"
import { attachSocket } from "./socketServer.js"

const app = express()
const port = Number(process.env.API_PORT ?? 3001)

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

app.get("/health", (_req, res) => res.json({ ok: true }))

app.post("/auth/register", authHandlers.register)
app.post("/auth/login", authHandlers.login)
app.post("/auth/refresh", authHandlers.refresh)
app.post("/auth/google", authHandlers.googleAuth)
app.post("/auth/apple", authHandlers.appleAuth)
app.post("/auth/logout", requireAuth, authHandlers.logout)
app.get("/auth/me", requireAuth, authHandlers.me)
app.delete("/account", requireAuth, authHandlers.deleteAccount)
app.patch("/auth/me", requireAuth, authHandlers.updateMe)
app.patch("/auth/me/password", requireAuth, authHandlers.changePassword)

app.get("/categories", categoryHandlers.list)
app.get("/categories/:id", categoryHandlers.getById)
app.get("/categories/:id/products", productHandlers.listByCategory)
app.post("/categories", requireAuth, requirePermission("category.write"), categoryHandlers.create)
app.patch("/categories/:id", requireAuth, requirePermission("category.write"), categoryHandlers.update)
app.delete("/categories/:id", requireAuth, requirePermission("category.write"), categoryHandlers.remove)

app.get("/products", productHandlers.list)
app.get("/products/:id", productHandlers.getById)
app.post("/products", requireAuth, requirePermission("product.write"), productHandlers.create)
app.patch("/products/:id", requireAuth, requirePermission("product.write"), productHandlers.update)
app.delete("/products/:id", requireAuth, requirePermission("product.write"), productHandlers.remove)

app.get("/cart", requireAuth, cartHandlers.get)
app.post("/cart/items", requireAuth, cartHandlers.addItem)
app.patch("/cart/items/:productId", requireAuth, cartHandlers.patchItem)
app.delete("/cart/items/:productId", requireAuth, cartHandlers.removeItem)

app.get("/orders", requireAuth, orderHandlers.list)
app.post("/orders/checkout", requireAuth, orderHandlers.checkout)
app.get("/orders/:id", requireAuth, orderHandlers.getById)
app.patch("/orders/:id/status", requireAuth, requirePermission("order.write"), orderHandlers.updateStatus)

app.get("/notifications", requireAuth, notificationHandlers.list)
app.patch("/notifications/:id/read", requireAuth, notificationHandlers.markRead)
app.post("/notifications/read-all", requireAuth, notificationHandlers.markAllRead)

app.get("/admin/users", requireAuth, requirePermission("admin"), adminHandlers.listUsers)
app.delete("/admin/users/:id", requireAuth, requirePermission("admin"), adminHandlers.deleteUser)
app.patch("/admin/users/:id/password", requireAuth, requirePermission("admin"), adminHandlers.setUserPassword)

app.post("/upload", requireAuth, uploadHandlers.eventUploadMiddleware, uploadHandlers.handleUpload)

// Events — POST /events/join must come before GET /events/:eventId
app.post("/events", requireAuth, eventHandlers.create)
app.get("/events", requireAuth, eventHandlers.list)
app.post("/events/join", requireAuth, eventHandlers.join)
app.get("/events/:eventId", requireAuth, eventHandlers.getById)
app.patch("/events/:eventId", requireAuth, eventHandlers.update)
app.delete("/events/:eventId", requireAuth, eventHandlers.remove)
app.post("/events/:eventId/join-token", requireAuth, eventHandlers.getJoinToken)
app.get("/events/:eventId/members", requireAuth, eventHandlers.getMembers)

app.get("/events/:eventId/channels", requireAuth, eventChannelHandlers.list)
app.post("/events/:eventId/channels", requireAuth, eventChannelHandlers.create)
app.patch("/events/:eventId/channels/:channelId", requireAuth, eventChannelHandlers.update)
app.delete("/events/:eventId/channels/:channelId", requireAuth, eventChannelHandlers.remove)

app.get("/events/:eventId/channels/:channelId/photos", requireAuth, eventPhotoHandlers.list)
app.post("/events/:eventId/channels/:channelId/photos", requireAuth, eventPhotoHandlers.add)
app.delete("/events/:eventId/channels/:channelId/photos/:photoId", requireAuth, eventPhotoHandlers.remove)
app.patch("/events/:eventId/channels/:channelId/photos/:photoId/final", requireAuth, eventPhotoHandlers.setFinal)
app.post("/events/:eventId/submit", requireAuth, eventPhotoHandlers.submit)
app.post("/events/:eventId/download", requireAuth, eventPhotoHandlers.download)

const httpServer = createServer(app)
attachSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
