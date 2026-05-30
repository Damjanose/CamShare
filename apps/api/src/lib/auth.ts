import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { db } from "./db.js"
import { hashToken, refreshExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens.js"
import type { AuthResponse, PermissionName } from "@camshare/types"

const mapUser = async (userId: string, email: string, isActive: boolean) => {
  const details = await db
    .selectFrom("user_details")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow()
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
    avatarUrl: details.avatar_url ?? null,
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

  if (!user.password_hash) throw new Error("Invalid credentials")
  const valid = await bcrypt.compare(input.password, user.password_hash)
  if (!valid) {
    throw new Error("Invalid credentials")
  }

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)

  if (user.deleted_at !== null) {
    if (user.deleted_at > cutoff) {
      // Still within 30-day recovery window — reactivate silently and continue
      await db.updateTable("users").set({ deleted_at: null }).where("id", "=", user.id).execute()
    } else {
      // Past 30 days — hard delete atomically, then reject login
      // orders must be deleted first: orders.user_id has ON DELETE RESTRICT
      // all other related tables (user_details, auth_sessions, events, etc.) cascade from users
      await db.transaction().execute(async (trx) => {
        await trx.deleteFrom("orders").where("user_id", "=", user.id).execute()
        await trx.deleteFrom("users").where("id", "=", user.id).execute()
      })
      throw new Error("Your account has been permanently deleted.")
    }
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

export const updateMe = async (
  userId: string,
  input: { fullName?: string; avatarUrl?: string },
) => {
  const update: Partial<{ full_name: string; avatar_url: string; updated_at: Date }> = {
    updated_at: new Date(),
  }
  if (input.fullName !== undefined) update.full_name = input.fullName
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl

  await db.updateTable("user_details").set(update).where("user_id", "=", userId).execute()

  const user = await db
    .selectFrom("users")
    .select(["id", "email", "is_active"])
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()
  return mapUser(user.id, user.email, user.is_active)
}

export const changePassword = async (
  userId: string,
  input: { currentPassword: string; newPassword: string },
) => {
  const user = await db
    .selectFrom("users")
    .select(["password_hash"])
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()

  if (!user.password_hash) throw new Error("Invalid current password")
  const valid = await bcrypt.compare(input.currentPassword, user.password_hash)
  if (!valid) throw new Error("Invalid current password")

  const newHash = await bcrypt.hash(input.newPassword, 10)
  await db.updateTable("users").set({ password_hash: newHash, updated_at: new Date() }).where("id", "=", userId).execute()
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

export const deleteAccount = async (userId: string, password: string) => {
  const user = await db
    .selectFrom("users")
    .select("password_hash")
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()

  if (!user.password_hash) throw new Error("Invalid password")
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw new Error("Invalid password")

  await db.updateTable("users").set({ deleted_at: new Date() }).where("id", "=", userId).execute()
  await db
    .updateTable("auth_sessions")
    .set({ revoked_at: new Date() })
    .where("user_id", "=", userId)
    .where("revoked_at", "is", null)
    .execute()
}

export const googleLogin = async (
  accessToken: string,
  context: { userAgent?: string; ipAddress?: string },
): Promise<AuthResponse> => {
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!resp.ok) throw new Error("Invalid Google token")
  const profile = (await resp.json()) as { email?: string; name?: string; picture?: string }
  if (!profile.email) throw new Error("Google account has no email")

  let existingUser = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", profile.email)
    .executeTakeFirst()

  if (!existingUser) {
    const inserted = await db
      .insertInto("users")
      .values({ email: profile.email, password_hash: null })
      .returning(["id", "email", "is_active"])
      .executeTakeFirstOrThrow()

    await db
      .insertInto("user_details")
      .values({
        user_id: inserted.id,
        full_name: profile.name ?? profile.email,
        avatar_url: profile.picture ?? null,
      })
      .execute()

    const readPerms = await db
      .selectFrom("permissions")
      .select(["id"])
      .where("name", "in", ["product.read", "category.read"])
      .execute()

    if (readPerms.length > 0) {
      await db
        .insertInto("user_permissions")
        .values(readPerms.map((p) => ({ user_id: inserted.id, permission_id: p.id })))
        .execute()
    }

    existingUser = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", inserted.id)
      .executeTakeFirstOrThrow()
  }

  const sessionId = crypto.randomUUID()
  const at = signAccessToken({ sub: existingUser.id, sid: sessionId, email: existingUser.email })
  const rt = signRefreshToken({ sub: existingUser.id, sid: sessionId, email: existingUser.email })

  await db
    .insertInto("auth_sessions")
    .values({
      id: sessionId,
      user_id: existingUser.id,
      refresh_token_hash: hashToken(rt),
      user_agent: context.userAgent ?? null,
      ip_address: context.ipAddress ?? null,
      expires_at: refreshExpiryDate(),
    })
    .execute()

  return {
    user: await mapUser(existingUser.id, existingUser.email, existingUser.is_active),
    tokens: { accessToken: at, refreshToken: rt },
  }
}
