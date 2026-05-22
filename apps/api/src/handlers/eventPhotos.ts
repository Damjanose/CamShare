import type { Request, Response } from "express"
import { z } from "zod"
import * as photos from "../lib/eventPhotos.js"

const addSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
})

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }
  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}

export const list = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const data = await photos.listPhotos(req.params.channelId, req.auth.userId)
  if (!data) return res.status(403).json({ message: "Forbidden" })
  return res.json(data)
}

export const add = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = addSchema.parse(req.body)
    const photo = await photos.addPhoto(req.params.channelId, req.auth.userId, input)
    if (photo === "LIMIT_REACHED") return res.status(429).json({ message: "Upload limit reached" })
    if (!photo) return res.status(403).json({ message: "Forbidden" })
    return res.status(201).json(photo)
  } catch (error) {
    return handleError(res, error)
  }
}

export const remove = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const isAdmin = req.auth.permissions.includes("admin")
  const ok = await photos.deletePhoto(req.params.photoId, req.auth.userId, isAdmin)
  if (!ok) return res.status(404).json({ message: "Photo not found" })
  return res.status(204).send()
}
