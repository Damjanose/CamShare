import type { Request, Response } from "express"
import * as admin from "../lib/admin.js"

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
