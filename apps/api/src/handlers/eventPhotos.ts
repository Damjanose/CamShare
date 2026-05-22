import type { Request, Response } from "express"
import { z } from "zod"
import * as photos from "../lib/eventPhotos.js"

const addSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
})

const finalSchema = z.object({
  isFinal: z.boolean(),
})

const downloadSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
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
  const uploaderId = typeof req.query.uploaderId === "string" ? req.query.uploaderId : undefined
  const submittedOnly = req.query.submittedOnly === "true"
  const data = await photos.listPhotos(req.params.channelId, req.auth.userId, { uploaderId, submittedOnly })
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

export const setFinal = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const { isFinal } = finalSchema.parse(req.body)
    const result = await photos.setPhotoFinal(req.params.photoId, req.auth.userId, isFinal)
    if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" })
    if (result === "ALREADY_SUBMITTED") return res.status(409).json({ message: "Already submitted — no further changes allowed" })
    if (!result) return res.status(404).json({ message: "Photo not found" })
    return res.json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export const submit = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const result = await photos.submitMember(req.params.eventId, req.auth.userId)
  if (result === "ALREADY_SUBMITTED") return res.status(409).json({ message: "Already submitted" })
  if (!result) return res.status(403).json({ message: "Forbidden" })
  return res.json(result)
}

export const download = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const { photoIds } = downloadSchema.parse(req.body)
    const result = await photos.streamPhotoZip(req.params.eventId, req.auth.userId, photoIds, res)
    if (result === "NOT_OWNER") return res.status(403).json({ message: "Forbidden" })
    if (result === "INVALID_PHOTOS") return res.status(400).json({ message: "Some photos do not belong to this event" })
    // result === "stream" means response already sent via archiver
  } catch (error) {
    return handleError(res, error)
  }
}
