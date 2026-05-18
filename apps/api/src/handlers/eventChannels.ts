import type { Request, Response } from "express"
import { z } from "zod"
import * as channels from "../lib/eventChannels.js"

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

const updateSchema = createSchema.partial()

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }
  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}

export const list = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const data = await channels.listChannels(req.params.eventId, req.auth.userId)
  if (!data) return res.status(403).json({ message: "Forbidden" })
  return res.json(data)
}

export const create = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = createSchema.parse(req.body)
    const channel = await channels.createChannel(req.params.eventId, req.auth.userId, input)
    if (!channel) return res.status(403).json({ message: "Forbidden" })
    return res.status(201).json(channel)
  } catch (error) {
    return handleError(res, error)
  }
}

export const update = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = updateSchema.parse(req.body)
    const channel = await channels.updateChannel(req.params.eventId, req.params.channelId, req.auth.userId, input)
    if (!channel) return res.status(404).json({ message: "Channel not found" })
    return res.json(channel)
  } catch (error) {
    return handleError(res, error)
  }
}

export const remove = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const ok = await channels.deleteChannel(req.params.eventId, req.params.channelId, req.auth.userId)
  if (!ok) return res.status(404).json({ message: "Channel not found" })
  return res.status(204).send()
}
