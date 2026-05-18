import type { Request, Response } from "express"
import { z } from "zod"
import * as cart from "../lib/cart.js"

const addSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

const qtySchema = z.object({
  quantity: z.number().int().min(0),
})

export const get = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const data = await cart.getCart(req.auth.userId)
  return res.json(data)
}

export const addItem = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = addSchema.parse(req.body)
    const data = await cart.addCartItem(req.auth.userId, input.productId, input.quantity)
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const patchItem = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = qtySchema.parse(req.body)
    const data = await cart.setCartItemQuantity(req.auth.userId, req.params.productId, input.quantity)
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const removeItem = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const data = await cart.removeCartItem(req.auth.userId, req.params.productId)
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }
  if (error instanceof Error && error.message === "Product not available") {
    return res.status(400).json({ message: error.message })
  }
  if (error instanceof Error && error.message === "Cart line not found") {
    return res.status(404).json({ message: error.message })
  }
  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
