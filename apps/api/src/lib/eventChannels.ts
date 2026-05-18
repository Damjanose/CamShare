import type { EventChannel, CreateChannelInput } from "@camshare/types"
import { db } from "./db.js"

const iso = (d: Date) => d.toISOString()

const mapChannel = (row: {
  id: string
  event_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: Date
}): EventChannel => ({
  id: row.id,
  eventId: row.event_id,
  name: row.name,
  description: row.description,
  sortOrder: row.sort_order,
  createdAt: iso(row.created_at),
})

const isMember = async (eventId: string, userId: string): Promise<boolean> => {
  const row = await db
    .selectFrom("event_members")
    .select("user_id")
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .executeTakeFirst()
  return !!row
}

const isOwner = async (eventId: string, userId: string): Promise<boolean> => {
  const row = await db.selectFrom("events").select("owner_id").where("id", "=", eventId).executeTakeFirst()
  return !!row && row.owner_id === userId
}

export const listChannels = async (eventId: string, userId: string): Promise<EventChannel[] | null> => {
  const member = await isMember(eventId, userId)
  if (!member) return null

  const rows = await db
    .selectFrom("event_channels")
    .selectAll()
    .where("event_id", "=", eventId)
    .orderBy("sort_order asc")
    .orderBy("created_at asc")
    .execute()

  return rows.map(mapChannel)
}

export const createChannel = async (eventId: string, userId: string, input: CreateChannelInput): Promise<EventChannel | null> => {
  const owner = await isOwner(eventId, userId)
  if (!owner) return null

  const row = await db
    .insertInto("event_channels")
    .values({
      event_id: eventId,
      name: input.name,
      description: input.description ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapChannel(row)
}

export const updateChannel = async (
  eventId: string,
  channelId: string,
  userId: string,
  input: Partial<CreateChannelInput>,
): Promise<EventChannel | null> => {
  const owner = await isOwner(eventId, userId)
  if (!owner) return null

  const existing = await db
    .selectFrom("event_channels")
    .select("id")
    .where("id", "=", channelId)
    .where("event_id", "=", eventId)
    .executeTakeFirst()
  if (!existing) return null

  const updated = await db
    .updateTable("event_channels")
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.sortOrder !== undefined && { sort_order: input.sortOrder }),
    })
    .where("id", "=", channelId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapChannel(updated)
}

export const deleteChannel = async (eventId: string, channelId: string, userId: string): Promise<boolean> => {
  const owner = await isOwner(eventId, userId)
  if (!owner) return false

  const result = await db
    .deleteFrom("event_channels")
    .where("id", "=", channelId)
    .where("event_id", "=", eventId)
    .executeTakeFirst()

  return Number(result.numDeletedRows) > 0
}
