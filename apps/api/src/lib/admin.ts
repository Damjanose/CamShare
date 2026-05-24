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
