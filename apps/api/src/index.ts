import { createServer } from "node:http"
import "dotenv/config"
import express from "express"
import cors from "cors"
import * as authHandlers from "./handlers/auth.js"
import * as cartHandlers from "./handlers/cart.js"
import * as categoryHandlers from "./handlers/categories.js"
import * as notificationHandlers from "./handlers/notifications.js"
import * as orderHandlers from "./handlers/orders.js"
import * as productHandlers from "./handlers/products.js"
import { requireAuth, requirePermission } from "./middleware/auth.js"
import { attachSocket } from "./socketServer.js"

const app = express()
const port = Number(process.env.API_PORT ?? 3001)

app.use(cors())
app.use(express.json())

app.get("/health", (_req, res) => res.json({ ok: true }))

app.post("/auth/register", authHandlers.register)
app.post("/auth/login", authHandlers.login)
app.post("/auth/refresh", authHandlers.refresh)
app.post("/auth/logout", requireAuth, authHandlers.logout)
app.get("/auth/me", requireAuth, authHandlers.me)

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

const httpServer = createServer(app)
attachSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
