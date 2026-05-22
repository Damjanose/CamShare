import type { Request, Response } from "express"
import { z } from "zod"
import * as events from "../lib/events.js"

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  maxPhotosPerUser: z.number().int().positive().optional(),
  maxFileSizeMb: z.number().int().positive().optional(),
})

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
})

const joinSchema = z.object({
  token: z.string().min(1),
})

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }
  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}

export const create = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = createSchema.parse(req.body)
    const event = await events.createEvent(req.auth.userId, input)
    return res.status(201).json(event)
  } catch (error) {
    return handleError(res, error)
  }
}

export const list = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const data = await events.listMyEvents(req.auth.userId)
  return res.json(data)
}

export const getById = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const event = await events.getEvent(req.params.eventId, req.auth.userId)
  if (!event) return res.status(404).json({ message: "Event not found" })
  return res.json(event)
}

export const update = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = updateSchema.parse(req.body)
    const event = await events.updateEvent(req.params.eventId, req.auth.userId, input)
    if (!event) return res.status(404).json({ message: "Event not found" })
    return res.json(event)
  } catch (error) {
    return handleError(res, error)
  }
}

export const remove = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const ok = await events.deleteEvent(req.params.eventId, req.auth.userId)
  if (!ok) return res.status(404).json({ message: "Event not found" })
  return res.status(204).send()
}

export const getJoinToken = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const token = await events.generateJoinToken(req.params.eventId, req.auth.userId)
  if (!token) return res.status(403).json({ message: "Forbidden" })
  return res.json({ token })
}

export const join = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = joinSchema.parse(req.body)
    const event = await events.joinEvent(input.token, req.auth.userId)
    if (!event) return res.status(400).json({ message: "Invalid or expired token" })
    return res.json(event)
  } catch (error) {
    return handleError(res, error)
  }
}

export const getMembers = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const members = await events.listMembers(req.params.eventId, req.auth.userId)
  if (!members) return res.status(403).json({ message: "Forbidden" })
  return res.json(members)
}
