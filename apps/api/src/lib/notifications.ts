import { db } from "./db.js"
import type { NotificationDto } from "@jewellery/types"

const iso = (d: Date) => d.toISOString()

const mapRow = (row: {
  id: string
  type: string
  title: string
  body: string | null
  read_at: Date | null
  metadata: unknown | null
  created_at: Date
}): NotificationDto => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  readAt: row.read_at ? iso(row.read_at) : null,
  metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null,
  createdAt: iso(row.created_at),
})

export const listNotifications = async (userId: string) => {
  const rows = await db
    .selectFrom("notifications")
    .selectAll()
    .where("user_id", "=", userId)
    .orderBy("created_at desc")
    .limit(100)
    .execute()
  return rows.map(mapRow)
}

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const updated = await db
    .updateTable("notifications")
    .set({ read_at: new Date() })
    .where("id", "=", notificationId)
    .where("user_id", "=", userId)
    .returningAll()
    .executeTakeFirst()
  if (!updated) return undefined
  return mapRow(updated)
}

export const markAllNotificationsRead = async (userId: string) => {
  await db.updateTable("notifications").set({ read_at: new Date() }).where("user_id", "=", userId).where("read_at", "is", null).execute()
}
