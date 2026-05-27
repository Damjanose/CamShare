import bcrypt from "bcryptjs"
import { db } from "./db.js"

const iso = (d: Date) => d.toISOString()

export type AdminUserDto = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export const listUsers = async (): Promise<AdminUserDto[]> => {
  const rows = await db
    .selectFrom("users as u")
    .innerJoin("user_details as ud", "ud.user_id", "u.id") // user_details is always created atomically with users in auth.ts
    .select(["u.id", "u.email", "u.created_at", "ud.full_name"])
    .where("u.deleted_at", "is", null)
    .orderBy("u.created_at", "desc")
    .execute()

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: iso(row.created_at),
  }))
}

export const setUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const exists = await db.selectFrom("users").select("id").where("id", "=", userId).where("deleted_at", "is", null).executeTakeFirst()
  if (!exists) throw new Error("User not found")

  const hash = await bcrypt.hash(newPassword, 10)
  await db.updateTable("users").set({ password_hash: hash, updated_at: new Date() }).where("id", "=", userId).execute()
}

export const deleteUser = async (userId: string): Promise<void> => {
  const exists = await db.selectFrom("users").select("id").where("id", "=", userId).executeTakeFirst()
  if (!exists) throw new Error("User not found")

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("orders").where("user_id", "=", userId).execute()
    await trx.deleteFrom("users").where("id", "=", userId).execute()
  })
}
