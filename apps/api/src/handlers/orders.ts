import type { Request, Response } from "express"
import { z } from "zod"
import * as orders from "../lib/orders.js"

const checkoutSchema = z.object({
  shippingAddress: z.string().min(1),
  paymentMethod: z.string().min(1),
})

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
  note: z.string().optional(),
})

const isStaff = (req: Request) =>
  Boolean(
    req.auth?.permissions.includes("admin") || req.auth?.permissions.includes("order.write"),
  )

export const list = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const data = isStaff(req) ? await orders.listAllOrders() : await orders.listOrdersForUser(req.auth.userId)
  return res.json(data)
}

export const getById = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const detail = await orders.getOrderDetail(req.params.id, req.auth.userId, isStaff(req))
  if (!detail) {
    return res.status(404).json({ message: "Order not found" })
  }
  return res.json(detail)
}

export const checkout = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = checkoutSchema.parse(req.body)
    const data = await orders.checkout(req.auth.userId, input)
    return res.status(201).json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = statusSchema.parse(req.body)
    const data = await orders.adminUpdateOrderStatus(req.params.id, input.status, input.note)
    if (!data) {
      return res.status(404).json({ message: "Order not found" })
    }
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }
  if (error instanceof Error && (error.message === "Cart is empty" || error.message.startsWith("Insufficient stock"))) {
    return res.status(400).json({ message: error.message })
  }
  if (error instanceof Error && error.message === "Invalid status transition") {
    return res.status(400).json({ message: error.message })
  }
  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
