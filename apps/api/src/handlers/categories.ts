import type { Request, Response } from "express"
import { z } from "zod"
import * as categories from "../lib/categories.js"
import { toCategory } from "../lib/serializers.js"

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

export const list = async (_req: Request, res: Response) => {
  const data = await categories.listCategories()
  return res.json(data.map(toCategory))
}

export const getById = async (req: Request, res: Response) => {
  const data = await categories.getCategory(req.params.id)
  if (!data) {
    return res.status(404).json({ message: "Category not found" })
  }

  return res.json(toCategory(data))
}

export const create = async (req: Request, res: Response) => {
  try {
    const input = createSchema.parse(req.body)
    const data = await categories.createCategory(input)
    return res.status(201).json(toCategory(data))
  } catch (error) {
    return handleError(res, error)
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const input = updateSchema.parse(req.body)
    const data = await categories.updateCategory(req.params.id, input)
    if (!data) {
      return res.status(404).json({ message: "Category not found" })
    }

    return res.json(toCategory(data))
  } catch (error) {
    return handleError(res, error)
  }
}

export const remove = async (req: Request, res: Response) => {
  const result = await categories.removeCategory(req.params.id)
  if (Number(result.numDeletedRows ?? 0) < 1) {
    return res.status(404).json({ message: "Category not found" })
  }

  return res.status(204).send()
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }

  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
