import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { db } from "../lib/db.js"
import type { PermissionName } from "@jewellery/types"

const accessSecret = process.env.JWT_ACCESS_SECRET
if (!accessSecret) {
  throw new Error("JWT_ACCESS_SECRET is required")
}

type AccessJwtPayload = {
  sub: string
  sid: string
  email: string
  iat: number
  exp: number
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" })
  }

  const token = authHeader.slice("Bearer ".length)
  let decoded: AccessJwtPayload

  try {
    decoded = jwt.verify(token, accessSecret) as AccessJwtPayload
  } catch {
    return res.status(401).json({ message: "Invalid token" })
  }

  const permissions = await db
    .selectFrom("user_permissions as up")
    .innerJoin("permissions as p", "p.id", "up.permission_id")
    .select("p.name")
    .where("up.user_id", "=", decoded.sub)
    .execute()

  req.auth = {
    userId: decoded.sub,
    sessionId: decoded.sid,
    email: decoded.email,
    permissions: permissions.map((item) => item.name as PermissionName),
  }

  return next()
}

export const requirePermission = (permission: PermissionName) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    if (req.auth.permissions.includes("admin") || req.auth.permissions.includes(permission)) {
      return next()
    }

    return res.status(403).json({ message: "Forbidden" })
  }
}
