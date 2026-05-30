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

const updateMeSchema = z
  .object({
    fullName: z.string().min(1).max(200).optional(),
    avatarUrl: z.string().url().optional(),
  })
  .refine((d) => d.fullName !== undefined || d.avatarUrl !== undefined, {
    message: "At least one field required",
  })

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
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

const deleteAccountSchema = z.object({
  password: z.string().min(1),
})

export const deleteAccount = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  try {
    const { password } = deleteAccountSchema.parse(req.body)
    await authService.deleteAccount(req.auth.userId, password)
    return res.status(204).send()
  } catch (error) {
    return handleError(res, error)
  }
}

export const updateMe = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = updateMeSchema.parse(req.body)
    const user = await authService.updateMe(req.auth.userId, input)
    return res.json(user)
  } catch (error) {
    return handleError(res, error)
  }
}

export const changePassword = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = changePasswordSchema.parse(req.body)
    await authService.changePassword(req.auth.userId, input)
    return res.status(204).send()
  } catch (error) {
    return handleError(res, error)
  }
}

export const me = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const user = await authService.me(req.auth.userId)
  return res.json(user)
}

const googleSchema = z.object({ accessToken: z.string().min(1) })

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken } = googleSchema.parse(req.body)
    const data = await authService.googleLogin(accessToken, {
      userAgent: req.header("user-agent"),
      ipAddress: req.ip,
    })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }

  if (error instanceof Error && error.message === "Invalid current password") {
    return res.status(422).json({ message: error.message })
  }

  if (error instanceof Error && error.message === "Invalid password") {
    return res.status(422).json({ message: error.message })
  }

  if (
    error instanceof Error &&
    (
      error.message === "Email already exists" ||
      error.message === "Invalid credentials" ||
      error.message === "Invalid refresh token" ||
      error.message === "Your account has been permanently deleted." ||
      error.message === "Invalid Google token" ||
      error.message === "Google account has no email"
    )
  ) {
    return res.status(401).json({ message: error.message })
  }

  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
