import crypto from "node:crypto"
import jwt, { type SignOptions } from "jsonwebtoken"

const accessSecret = process.env.JWT_ACCESS_SECRET
const refreshSecret = process.env.JWT_REFRESH_SECRET
const accessTokenTtl = process.env.ACCESS_TOKEN_TTL ?? "15m"
const refreshTokenTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7)

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required")
}

const accessKey = accessSecret
const refreshKey = refreshSecret

type JwtPayload = {
  sub: string
  sid: string
  email: string
}

const accessSignOptions = { expiresIn: accessTokenTtl } as SignOptions
const refreshSignOptions = { expiresIn: `${refreshTokenTtlDays}d` } as SignOptions

export const signAccessToken = (payload: JwtPayload) => jwt.sign(payload, accessKey, accessSignOptions)

export const signRefreshToken = (payload: JwtPayload) => jwt.sign(payload, refreshKey, refreshSignOptions)

export const verifyRefreshToken = (token: string) => jwt.verify(token, refreshKey) as JwtPayload

export const hashToken = (value: string) => crypto.createHash("sha256").update(value).digest("hex")

export const refreshExpiryDate = () => {
  const expires = new Date()
  expires.setDate(expires.getDate() + refreshTokenTtlDays)
  return expires
}
