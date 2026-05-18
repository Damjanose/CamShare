import type { Request, Response } from "express"
import { z } from "zod"
import * as authService from "../lib/auth.js"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const register = async (req: Request, res: Response) => {
  try {
    const input = registerSchema.parse(req.body)
    const data = await authService.register(input, {
      userAgent: req.header("user-agent"),
      ipAddress: req.ip,
    })
    return res.status(201).json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body)
    const data = await authService.login(input, {
      userAgent: req.header("user-agent"),
      ipAddress: req.ip,
    })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const refresh = async (req: Request, res: Response) => {
  try {
    const input = refreshSchema.parse(req.body)
    const data = await authService.refresh(input.refreshToken)
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const logout = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  await authService.logout(req.auth.sessionId)
  return res.status(204).send()
}

export const me = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const user = await authService.me(req.auth.userId)
  return res.json(user)
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }

  if (error instanceof Error && (error.message === "Email already exists" || error.message === "Invalid credentials" || error.message === "Invalid refresh token")) {
    return res.status(401).json({ message: error.message })
  }

  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
