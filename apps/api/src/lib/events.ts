import { randomUUID } from "crypto"
import type { Event, EventMember, CreateEventInput, UpdateEventInput } from "@camshare/types"
import { db } from "./db.js"
import { emitToEvent, emitToUser } from "../realtime.js"

const iso = (d: Date) => d.toISOString()

const mapEvent = (row: {
  id: string
  owner_id: string
  title: string
  description: string | null
  event_date: Date | null
  end_date: Date | null
  cover_image_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
  max_photos_per_user?: number | null
  max_file_size_mb?: number | null
  guest_count?: string | null
  photo_count?: string | null
}): Event => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  description: row.description,
  eventDate: row.event_date ? iso(row.event_date) : null,
  endDate: row.end_date ? iso(row.end_date) : null,
  coverImageUrl: row.cover_image_url,
  isActive: row.is_active,
  guestCount: Number(row.guest_count ?? 0),
  photoCount: Number(row.photo_count ?? 0),
  maxPhotosPerUser: row.max_photos_per_user ?? null,
  maxFileSizeMb: row.max_file_size_mb ?? null,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const fetchWithCounts = (eventId: string) =>
  db
    .selectFrom("events")
    .selectAll("events")
    .select((eb) => [
      eb
        .selectFrom("event_members")
        .whereRef("event_members.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>().as("c"))
        .as("guest_count"),
      eb
        .selectFrom("event_photos")
        .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
        .whereRef("event_channels.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>().as("c"))
        .as("photo_count"),
    ])
    .where("events.id", "=", eventId)
    .executeTakeFirst()

const isMember = async (eventId: string, userId: string): Promise<boolean> => {
  const row = await db
    .selectFrom("event_members")
    .select("user_id")
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .executeTakeFirst()
  return !!row
}

export const createEvent = async (ownerId: string, input: CreateEventInput): Promise<Event> => {
  const event = await db.transaction().execute(async (trx) => {
    const row = await trx
      .insertInto("events")
      .values({
        owner_id: ownerId,
        title: input.title,
        description: input.description ?? null,
        event_date: input.eventDate ? new Date(input.eventDate) : null,
        end_date: input.endDate ? new Date(input.endDate) : null,
        cover_image_url: input.coverImageUrl ?? null,
        max_photos_per_user: input.maxPhotosPerUser ?? null,
        max_file_size_mb: input.maxFileSizeMb ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await trx.insertInto("event_members").values({ event_id: row.id, user_id: ownerId }).execute()

    return row
  })

  return mapEvent({ ...event, guest_count: "1", photo_count: "0" })
}

export const listMyEvents = async (userId: string): Promise<Event[]> => {
  // Delete expired events — cascade removes all channels, photos, members, tokens
  await db
    .deleteFrom("events")
    .where("end_date", "is not", null)
    .where("end_date", "<", new Date())
    .execute()

  const rows = await db
    .selectFrom("events")
    .innerJoin("event_members as em", "em.event_id", "events.id")
    .where("em.user_id", "=", userId)
    .selectAll("events")
    .select((eb) => [
      eb
        .selectFrom("event_members")
        .whereRef("event_members.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>().as("c"))
        .as("guest_count"),
      eb
        .selectFrom("event_photos")
        .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
        .whereRef("event_channels.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>().as("c"))
        .as("photo_count"),
    ])
    .orderBy("events.created_at desc")
    .execute()

  return rows.map(mapEvent)
}

export const getEvent = async (eventId: string, userId: string): Promise<Event | null> => {
  const member = await isMember(eventId, userId)
  if (!member) return null

  const row = await fetchWithCounts(eventId)
  return row ? mapEvent(row) : null
}

export const updateEvent = async (
  eventId: string,
  userId: string,
  input: UpdateEventInput,
): Promise<Event | null> => {
  const row = await db
    .selectFrom("events")
    .select(["id", "owner_id"])
    .where("id", "=", eventId)
    .executeTakeFirst()
  if (!row || row.owner_id !== userId) return null

  await db
    .updateTable("events")
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.eventDate !== undefined && { event_date: input.eventDate ? new Date(input.eventDate) : null }),
      ...(input.endDate !== undefined && { end_date: input.endDate ? new Date(input.endDate) : null }),
      ...(input.coverImageUrl !== undefined && { cover_image_url: input.coverImageUrl }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
      ...(input.maxPhotosPerUser !== undefined && { max_photos_per_user: input.maxPhotosPerUser }),
      ...(input.maxFileSizeMb !== undefined && { max_file_size_mb: input.maxFileSizeMb }),
      updated_at: new Date(),
    })
    .where("id", "=", eventId)
    .execute()

  const updated = await fetchWithCounts(eventId)
  return updated ? mapEvent(updated) : null
}

export const deleteEvent = async (eventId: string, userId: string): Promise<boolean> => {
  const row = await db.selectFrom("events").select(["id", "owner_id"]).where("id", "=", eventId).executeTakeFirst()
  if (!row || row.owner_id !== userId) return false

  await db.deleteFrom("events").where("id", "=", eventId).execute()
  return true
}

export const generateJoinToken = async (eventId: string, userId: string): Promise<string | null> => {
  const row = await db.selectFrom("events").select(["id", "owner_id"]).where("id", "=", eventId).executeTakeFirst()
  if (!row || row.owner_id !== userId) return null

  const existing = await db.selectFrom("event_join_tokens").select("token").where("event_id", "=", eventId).executeTakeFirst()
  if (existing) return existing.token

  const token = randomUUID()
  await db.insertInto("event_join_tokens").values({ event_id: eventId, token, expires_at: null }).execute()
  return token
}

export const joinEvent = async (token: string, userId: string): Promise<Event | null> => {
  const tokenRow = await db
    .selectFrom("event_join_tokens")
    .select(["event_id", "expires_at"])
    .where("token", "=", token)
    .executeTakeFirst()

  if (!tokenRow) return null
  if (tokenRow.expires_at && tokenRow.expires_at < new Date()) return null

  await db
    .insertInto("event_members")
    .values({ event_id: tokenRow.event_id, user_id: userId })
    .onConflict((oc) => oc.columns(["event_id", "user_id"]).doNothing())
    .execute()

  const eventRow = await fetchWithCounts(tokenRow.event_id)
  if (!eventRow) return null
  const event = mapEvent(eventRow)

  const joinerDetails = await db
    .selectFrom("user_details")
    .select("full_name")
    .where("user_id", "=", userId)
    .executeTakeFirst()

  const payload = {
    userId,
    eventId: tokenRow.event_id,
    fullName: joinerDetails?.full_name ?? "Someone",
  }

  emitToEvent(tokenRow.event_id, "event:member_joined", payload)
  emitToUser(eventRow.owner_id, "event:member_joined", payload)

  return event
}

export const listMembers = async (eventId: string, userId: string): Promise<EventMember[] | null> => {
  const member = await isMember(eventId, userId)
  if (!member) return null

  const rows = await db
    .selectFrom("event_members")
    .selectAll()
    .where("event_id", "=", eventId)
    .orderBy("joined_at asc")
    .execute()

  return rows.map((r) => ({
    eventId: r.event_id,
    userId: r.user_id,
    joinedAt: iso(r.joined_at),
  }))
}
