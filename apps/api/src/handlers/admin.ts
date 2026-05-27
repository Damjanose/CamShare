import type { Request, Response } from "express"
import { z } from "zod"
import * as admin from "../lib/admin.js"

const setUserPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

export const listUsers = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const users = await admin.listUsers()
    return res.json(users)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const { id } = req.params
    await admin.deleteUser(id)
    return res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({ message: "User not found" })
    }
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const setUserPassword = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const { id } = req.params
    const { newPassword } = setUserPasswordSchema.parse(req.body)
    await admin.setUserPassword(id, newPassword)
    return res.status(204).send()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", issues: error.issues })
    }
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({ message: "User not found" })
    }
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
