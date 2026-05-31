import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "./db.js"
import { hashToken, refreshExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens.js"
import type { AuthResponse, PermissionName } from "@camshare/types"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const checkSoftDelete = async (user: { id: string; deleted_at: Date | null }) => {
  if (!user.deleted_at) return
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)
  if (user.deleted_at > cutoff) {
    await db.updateTable("users").set({ deleted_at: null }).where("id", "=", user.id).execute()
  } else {
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("orders").where("user_id", "=", user.id).execute()
      await trx.deleteFrom("users").where("id", "=", user.id).execute()
    })
    throw new Error("Your account has been permanently deleted.")
  }
}

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

  await checkSoftDelete(user)

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

export const deleteAccount = async (userId: string, password?: string) => {
  const user = await db
    .selectFrom("users")
    .select("password_hash")
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()

  if (user.password_hash) {
    if (!password) throw new Error("Password required")
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new Error("Invalid password")
  }

  await db.updateTable("users").set({ deleted_at: new Date() }).where("id", "=", userId).execute()
  await db
    .updateTable("auth_sessions")
    .set({ revoked_at: new Date() })
    .where("user_id", "=", userId)
    .where("revoked_at", "is", null)
    .execute()
}

type OAuthJwk = { kid: string; kty: string; n: string; e: string; alg: string; use: string }

const applePublicKeyCache: { keys: OAuthJwk[]; fetchedAt: number } = { keys: [], fetchedAt: 0 }

const getApplePublicKeys = async (forceRefresh = false): Promise<OAuthJwk[]> => {
  if (!forceRefresh && Date.now() - applePublicKeyCache.fetchedAt < 60 * 60 * 1000) return applePublicKeyCache.keys
  const resp = await fetch("https://appleid.apple.com/auth/keys")
  if (!resp.ok) throw new Error("Failed to fetch Apple public keys")
  const { keys } = (await resp.json()) as { keys: OAuthJwk[] }
  applePublicKeyCache.keys = keys
  applePublicKeyCache.fetchedAt = Date.now()
  return keys
}

const verifyAppleToken = async (identityToken: string): Promise<{ sub: string; email?: string }> => {
  try {
    const [headerB64] = identityToken.split(".")
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString()) as { kid: string }
    let keys = await getApplePublicKeys()
    let jwk = keys.find((k) => k.kid === header.kid)
    if (!jwk) {
      keys = await getApplePublicKeys(true)
      jwk = keys.find((k) => k.kid === header.kid)
    }
    if (!jwk) throw new Error("Invalid Apple token")

    const publicKey = crypto.createPublicKey({ key: jwk as unknown as crypto.JsonWebKey, format: "jwk" })
    const pem = publicKey.export({ type: "spki", format: "pem" }) as string

    const payload = jwt.verify(identityToken, pem, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
      audience: [
        process.env.APPLE_BUNDLE_ID ?? "com.damjano.camshare",
        process.env.APPLE_SERVICE_ID ?? "com.damjano.camshare.web",
      ],
    }) as { sub: string; email?: string }

    return payload
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid Apple token") throw err
    throw new Error("Invalid Apple token")
  }
}

export const appleLogin = async (
  identityToken: string,
  context: { userAgent?: string; ipAddress?: string },
  fullName?: string | null,
): Promise<AuthResponse> => {
  const payload = await verifyAppleToken(identityToken)
  if (!payload.email) throw new Error("Apple account has no email")

  let existingUser = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", payload.email)
    .executeTakeFirst()

  if (!existingUser) {
    existingUser = await db.transaction().execute(async (trx) => {
      const inserted = await trx
        .insertInto("users")
        .values({ email: payload.email!, password_hash: null })
        .returning(["id", "email", "is_active"])
        .executeTakeFirstOrThrow()

      const isRelayEmail = inserted.email.endsWith("@privaterelay.appleid.com")

      await trx
        .insertInto("user_details")
        .values({ user_id: inserted.id, full_name: fullName ?? (isRelayEmail ? "Apple User" : inserted.email), avatar_url: null })
        .execute()

      const readPerms = await trx
        .selectFrom("permissions")
        .select(["id"])
        .where("name", "in", ["product.read", "category.read"])
        .execute()

      if (readPerms.length > 0) {
        await trx
          .insertInto("user_permissions")
          .values(readPerms.map((p) => ({ user_id: inserted.id, permission_id: p.id })))
          .execute()
      }

      return trx
        .selectFrom("users")
        .selectAll()
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
    })
  }

  await checkSoftDelete(existingUser)

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

const googlePublicKeyCache: { keys: OAuthJwk[]; fetchedAt: number } = { keys: [], fetchedAt: 0 }

const getGooglePublicKeys = async (forceRefresh = false): Promise<OAuthJwk[]> => {
  if (!forceRefresh && Date.now() - googlePublicKeyCache.fetchedAt < 60 * 60 * 1000) return googlePublicKeyCache.keys
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/certs")
  if (!resp.ok) throw new Error("Failed to fetch Google public keys")
  const { keys } = (await resp.json()) as { keys: OAuthJwk[] }
  googlePublicKeyCache.keys = keys
  googlePublicKeyCache.fetchedAt = Date.now()
  return keys
}

const verifyGoogleIdToken = async (idToken: string): Promise<{ email?: string; name?: string; picture?: string }> => {
  try {
    const [headerB64] = idToken.split(".")
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString()) as { kid: string }
    let keys = await getGooglePublicKeys()
    let jwk = keys.find((k) => k.kid === header.kid)
    if (!jwk) {
      keys = await getGooglePublicKeys(true)
      jwk = keys.find((k) => k.kid === header.kid)
    }
    if (!jwk) throw new Error("Invalid Google token")

    const publicKey = crypto.createPublicKey({ key: jwk as unknown as crypto.JsonWebKey, format: "jwk" })
    const pem = publicKey.export({ type: "spki", format: "pem" }) as string

    const googleClientIds = [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean) as string[]

    if (googleClientIds.length === 0) {
      throw new Error("Google client IDs not configured")
    }

    const payload = jwt.verify(idToken, pem, {
      algorithms: ["RS256"],
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: googleClientIds as [string, ...string[]],
    }) as { email?: string; name?: string; picture?: string }

    return payload
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid Google token") throw err
    throw new Error("Invalid Google token")
  }
}

const resolveGoogleProfile = async (
  token: { idToken: string } | { accessToken: string },
): Promise<{ email?: string; name?: string; picture?: string }> => {
  if ("idToken" in token) return verifyGoogleIdToken(token.idToken)
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  })
  if (!resp.ok) throw new Error("Invalid Google token")
  const profile = (await resp.json()) as { email?: string; name?: string; picture?: string; email_verified?: boolean }
  if (!profile.email_verified) throw new Error("Google account email is not verified")
  return profile
}

export const googleLogin = async (
  token: { idToken: string } | { accessToken: string },
  context: { userAgent?: string; ipAddress?: string },
): Promise<AuthResponse> => {
  const profile = await resolveGoogleProfile(token)
  if (!profile.email) throw new Error("Google account has no email")

  let existingUser = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", profile.email)
    .executeTakeFirst()

  if (!existingUser) {
    existingUser = await db.transaction().execute(async (trx) => {
      const inserted = await trx
        .insertInto("users")
        .values({ email: profile.email!, password_hash: null })
        .returning(["id", "email", "is_active"])
        .executeTakeFirstOrThrow()

      await trx
        .insertInto("user_details")
        .values({
          user_id: inserted.id,
          full_name: profile.name ?? profile.email!,
          avatar_url: profile.picture ?? null,
        })
        .execute()

      const readPerms = await trx
        .selectFrom("permissions")
        .select(["id"])
        .where("name", "in", ["product.read", "category.read"])
        .execute()

      if (readPerms.length > 0) {
        await trx
          .insertInto("user_permissions")
          .values(readPerms.map((p) => ({ user_id: inserted.id, permission_id: p.id })))
          .execute()
      }

      return trx
        .selectFrom("users")
        .selectAll()
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
    })
  }

  await checkSoftDelete(existingUser)

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
