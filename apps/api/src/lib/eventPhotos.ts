import type { EventPhoto, AddPhotoInput } from "@camshare/types"
import { db } from "./db.js"
import { emitToEvent } from "../realtime.js"

const iso = (d: Date) => d.toISOString()

const mapPhoto = (row: {
  id: string
  channel_id: string
  uploader_id: string
  url: string
  caption: string | null
  created_at: Date
}): EventPhoto => ({
  id: row.id,
  channelId: row.channel_id,
  uploaderId: row.uploader_id,
  url: row.url,
  caption: row.caption,
  createdAt: iso(row.created_at),
})

const getChannelEventId = async (channelId: string): Promise<string | null> => {
  const row = await db.selectFrom("event_channels").select("event_id").where("id", "=", channelId).executeTakeFirst()
  return row?.event_id ?? null
}

const isMember = async (eventId: string, userId: string): Promise<boolean> => {
  const row = await db
    .selectFrom("event_members")
    .select("user_id")
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .executeTakeFirst()
  return !!row
}

export const listPhotos = async (channelId: string, userId: string): Promise<EventPhoto[] | null> => {
  const eventId = await getChannelEventId(channelId)
  if (!eventId) return null

  const member = await isMember(eventId, userId)
  if (!member) return null

  const rows = await db
    .selectFrom("event_photos")
    .selectAll()
    .where("channel_id", "=", channelId)
    .orderBy("created_at asc")
    .execute()

  return rows.map(mapPhoto)
}

export const addPhoto = async (channelId: string, userId: string, input: AddPhotoInput): Promise<EventPhoto | null> => {
  const eventId = await getChannelEventId(channelId)
  if (!eventId) return null

  const member = await isMember(eventId, userId)
  if (!member) return null

  const row = await db
    .insertInto("event_photos")
    .values({
      channel_id: channelId,
      uploader_id: userId,
      url: input.url,
      caption: input.caption ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const photo = mapPhoto(row)
  emitToEvent(eventId, "event:photo_added", photo)

  return photo
}

export const deletePhoto = async (photoId: string, userId: string): Promise<boolean> => {
  const photo = await db.selectFrom("event_photos").selectAll().where("id", "=", photoId).executeTakeFirst()
  if (!photo) return false

  const eventId = await getChannelEventId(photo.channel_id)
  if (!eventId) return false

  const isUploader = photo.uploader_id === userId
  let isOwner = false
  if (!isUploader) {
    const event = await db.selectFrom("events").select("owner_id").where("id", "=", eventId).executeTakeFirst()
    isOwner = !!event && event.owner_id === userId
  }

  if (!isUploader && !isOwner) return false

  await db.deleteFrom("event_photos").where("id", "=", photoId).execute()
  emitToEvent(eventId, "event:photo_deleted", { photoId, channelId: photo.channel_id })

  return true
}
