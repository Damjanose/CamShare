import type { Request, Response } from "express"
import * as notifications from "../lib/notifications.js"

export const list = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const data = await notifications.listNotifications(req.auth.userId)
  return res.json(data)
}

export const markRead = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const row = await notifications.markNotificationRead(req.auth.userId, req.params.id)
  if (!row) {
    return res.status(404).json({ message: "Notification not found" })
  }
  return res.json(row)
}

export const markAllRead = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  await notifications.markAllNotificationsRead(req.auth.userId)
  return res.status(204).send()
}
