import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { db } from "./db.js"
import { hashToken, refreshExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens.js"
import type { AuthResponse, PermissionName } from "@jewellery/types"

const mapUser = async (userId: string, email: string, isActive: boolean) => {
  const details = await db.selectFrom("user_details").selectAll().where("user_id", "=", userId).executeTakeFirstOrThrow()
  const permissionRows = await db
    .selectFrom("user_permissions as up")
    .innerJoin("permissions as p", "p.id", "up.permission_id")
    .select("p.name")
    .where("up.user_id", "=", userId)
    .execute()

  return {
    id: userId,
    email,
    isActive,
    fullName: details.full_name,
    permissions: permissionRows.map((row) => row.name as PermissionName),
  }
}

export const register = async (input: { email: string; password: string; fullName: string }, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> => {
  const existing = await db.selectFrom("users").select("id").where("email", "=", input.email).executeTakeFirst()
  if (existing) {
    throw new Error("Email already exists")
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  const insertedUser = await db
    .insertInto("users")
    .values({ email: input.email, password_hash: passwordHash })
    .returning(["id", "email", "is_active"])
    .executeTakeFirstOrThrow()

  await db.insertInto("user_details").values({ user_id: insertedUser.id, full_name: input.fullName }).execute()

  const readPermissions = await db
    .selectFrom("permissions")
    .select(["id"])
    .where("name", "in", ["product.read", "category.read"])
    .execute()

  if (readPermissions.length > 0) {
    await db
      .insertInto("user_permissions")
      .values(readPermissions.map((permission) => ({ user_id: insertedUser.id, permission_id: permission.id })))
      .execute()
  }

  const sessionId = crypto.randomUUID()
  const accessToken = signAccessToken({ sub: insertedUser.id, sid: sessionId, email: insertedUser.email })
  const refreshToken = signRefreshToken({ sub: insertedUser.id, sid: sessionId, email: insertedUser.email })

  await db
    .insertInto("auth_sessions")
    .values({
      id: sessionId,
      user_id: insertedUser.id,
      refresh_token_hash: hashToken(refreshToken),
      user_agent: context.userAgent ?? null,
      ip_address: context.ipAddress ?? null,
      expires_at: refreshExpiryDate(),
    })
    .execute()

  const user = await mapUser(insertedUser.id, insertedUser.email, insertedUser.is_active)
  return { user, tokens: { accessToken, refreshToken } }
}

export const login = async (input: { email: string; password: string }, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> => {
  const user = await db.selectFrom("users").selectAll().where("email", "=", input.email).executeTakeFirst()
  if (!user) {
    throw new Error("Invalid credentials")
  }

  const valid = await bcrypt.compare(input.password, user.password_hash)
  if (!valid) {
    throw new Error("Invalid credentials")
  }

  const sessionId = crypto.randomUUID()
  const accessToken = signAccessToken({ sub: user.id, sid: sessionId, email: user.email })
  const refreshToken = signRefreshToken({ sub: user.id, sid: sessionId, email: user.email })

  await db
    .insertInto("auth_sessions")
    .values({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: hashToken(refreshToken),
      user_agent: context.userAgent ?? null,
      ip_address: context.ipAddress ?? null,
      expires_at: refreshExpiryDate(),
    })
    .execute()

  return { user: await mapUser(user.id, user.email, user.is_active), tokens: { accessToken, refreshToken } }
}

export const me = async (userId: string) => {
  const user = await db.selectFrom("users").select(["id", "email", "is_active"]).where("id", "=", userId).executeTakeFirstOrThrow()
  return mapUser(user.id, user.email, user.is_active)
}

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  const payload = verifyRefreshToken(refreshToken)

  const session = await db
    .selectFrom("auth_sessions")
    .selectAll()
    .where("id", "=", payload.sid)
    .where("user_id", "=", payload.sub)
    .where("revoked_at", "is", null)
    .executeTakeFirst()

  if (!session || session.refresh_token_hash !== hashToken(refreshToken) || session.expires_at < new Date()) {
    throw new Error("Invalid refresh token")
  }

  await db.updateTable("auth_sessions").set({ revoked_at: new Date() }).where("id", "=", session.id).execute()

  const nextSessionId = crypto.randomUUID()
  const nextAccessToken = signAccessToken({ sub: payload.sub, sid: nextSessionId, email: payload.email })
  const nextRefreshToken = signRefreshToken({ sub: payload.sub, sid: nextSessionId, email: payload.email })

  await db
    .insertInto("auth_sessions")
    .values({
      id: nextSessionId,
      user_id: payload.sub,
      refresh_token_hash: hashToken(nextRefreshToken),
      user_agent: session.user_agent,
      ip_address: session.ip_address,
      expires_at: refreshExpiryDate(),
    })
    .execute()

  const user = await me(payload.sub)
  return { user, tokens: { accessToken: nextAccessToken, refreshToken: nextRefreshToken } }
}

export const logout = async (sessionId: string) => {
  await db.updateTable("auth_sessions").set({ revoked_at: new Date() }).where("id", "=", sessionId).execute()
}
