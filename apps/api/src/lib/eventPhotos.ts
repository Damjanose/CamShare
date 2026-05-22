import path from "node:path"
import fs from "node:fs"
import type { Response } from "express"
import archiver from "archiver"
import type { EventPhoto, AddPhotoInput, EventMember } from "@camshare/types"
import { db } from "./db.js"
import { emitToEvent } from "../realtime.js"

const iso = (d: Date) => d.toISOString()

const mapPhoto = (row: {
  id: string
  channel_id: string
  uploader_id: string
  url: string
  caption: string | null
  is_final: boolean
  created_at: Date
}): EventPhoto => ({
  id: row.id,
  channelId: row.channel_id,
  uploaderId: row.uploader_id,
  url: row.url,
  caption: row.caption,
  isFinal: row.is_final,
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

export type ListPhotosOptions = {
  uploaderId?: string
  submittedOnly?: boolean
}

export const listPhotos = async (channelId: string, userId: string, opts: ListPhotosOptions = {}): Promise<EventPhoto[] | null> => {
  const eventId = await getChannelEventId(channelId)
  if (!eventId) return null

  const member = await isMember(eventId, userId)
  if (!member) return null

  let query = db
    .selectFrom("event_photos")
    .selectAll("event_photos")
    .where("event_photos.channel_id", "=", channelId)

  if (opts.uploaderId) {
    query = query.where("event_photos.uploader_id", "=", opts.uploaderId)
  }

  if (opts.submittedOnly) {
    query = query
      .innerJoin("event_members as em", "em.user_id", "event_photos.uploader_id")
      .where("em.event_id", "=", eventId)
      .where("em.submitted_at", "is not", null)
      .where("event_photos.is_final", "=", true)
  }

  const rows = await query.orderBy("event_photos.created_at asc").execute()
  return rows.map(mapPhoto)
}

export const addPhoto = async (channelId: string, userId: string, input: AddPhotoInput): Promise<EventPhoto | null | "LIMIT_REACHED"> => {
  const eventId = await getChannelEventId(channelId)
  if (!eventId) return null

  const member = await isMember(eventId, userId)
  if (!member) return null

  // Check per-user photo limit
  const eventRow = await db
    .selectFrom("events")
    .select("max_photos_per_user")
    .where("id", "=", eventId)
    .executeTakeFirst()

  if (!eventRow) return null

  // Count check and insert below are not atomic — a small race window exists
  // for concurrent uploads by the same user. Acceptable for current use case.
  if (eventRow.max_photos_per_user !== null) {
    const countRow = await db
      .selectFrom("event_photos")
      .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
      .select(db.fn.countAll<string>().as("cnt"))
      .where("event_channels.event_id", "=", eventId)
      .where("event_photos.uploader_id", "=", userId)
      .executeTakeFirstOrThrow()

    if (Number(countRow.cnt) >= eventRow.max_photos_per_user) {
      return "LIMIT_REACHED"
    }
  }

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

export const deletePhoto = async (photoId: string, userId: string, isAdmin = false): Promise<boolean> => {
  const photo = await db.selectFrom("event_photos").selectAll().where("id", "=", photoId).executeTakeFirst()
  if (!photo) return false

  const eventId = await getChannelEventId(photo.channel_id)
  if (!eventId) return false

  const isUploader = photo.uploader_id === userId
  let isOwner = false
  if (!isUploader && !isAdmin) {
    const event = await db.selectFrom("events").select("owner_id").where("id", "=", eventId).executeTakeFirst()
    isOwner = !!event && event.owner_id === userId
  }

  if (!isUploader && !isOwner && !isAdmin) return false

  await db.deleteFrom("event_photos").where("id", "=", photoId).execute()
  emitToEvent(eventId, "event:photo_deleted", { photoId, channelId: photo.channel_id })

  return true
}

export type SetPhotoFinalResult = EventPhoto | null | "FORBIDDEN" | "ALREADY_SUBMITTED"

export const setPhotoFinal = async (photoId: string, userId: string, isFinal: boolean): Promise<SetPhotoFinalResult> => {
  const photo = await db.selectFrom("event_photos").selectAll().where("id", "=", photoId).executeTakeFirst()
  if (!photo) return null
  if (photo.uploader_id !== userId) return "FORBIDDEN"

  const eventId = await getChannelEventId(photo.channel_id)
  if (!eventId) return null

  const memberRow = await db
    .selectFrom("event_members")
    .select("submitted_at")
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .executeTakeFirst()

  if (!memberRow) return "FORBIDDEN"
  if (memberRow.submitted_at !== null) return "ALREADY_SUBMITTED"

  const updated = await db
    .updateTable("event_photos")
    .set({ is_final: isFinal })
    .where("id", "=", photoId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapPhoto(updated)
}

export type SubmitMemberResult = EventMember | null | "ALREADY_SUBMITTED"

export const submitMember = async (eventId: string, userId: string): Promise<SubmitMemberResult> => {
  const memberRow = await db
    .selectFrom("event_members")
    .select(["event_id", "user_id", "joined_at", "submitted_at"])
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .executeTakeFirst()

  if (!memberRow) return null
  if (memberRow.submitted_at !== null) return "ALREADY_SUBMITTED"

  const updated = await db
    .updateTable("event_members")
    .set({ submitted_at: new Date() })
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .returning(["event_id", "user_id", "joined_at", "submitted_at"])
    .executeTakeFirstOrThrow()

  emitToEvent(eventId, "event:member_submitted", { eventId, userId })

  return {
    eventId: updated.event_id,
    userId: updated.user_id,
    joinedAt: iso(updated.joined_at),
    submittedAt: updated.submitted_at ? iso(updated.submitted_at) : null,
  }
}

export type DownloadResult = "NOT_OWNER" | "INVALID_PHOTOS" | "stream"

export const streamPhotoZip = async (
  eventId: string,
  userId: string,
  photoIds: string[],
  res: Response,
): Promise<DownloadResult> => {
  const event = await db.selectFrom("events").select(["owner_id", "title"]).where("id", "=", eventId).executeTakeFirst()
  if (!event || event.owner_id !== userId) return "NOT_OWNER"

  // Fetch and validate photos — all must belong to this event
  const photos = await db
    .selectFrom("event_photos")
    .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
    .select(["event_photos.id", "event_photos.url"])
    .where("event_photos.id", "in", photoIds)
    .where("event_channels.event_id", "=", eventId)
    .execute()

  if (photos.length !== photoIds.length) return "INVALID_PHOTOS"

  const safeTitle = event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
  res.setHeader("Content-Type", "application/zip")
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.zip"`)

  const archive = archiver("zip", { zlib: { level: 6 } })
  archive.pipe(res)

  const uploadsDir = path.join(process.cwd(), "uploads")
  for (const photo of photos) {
    // URL format: http://host/uploads/filename.ext
    const filename = path.basename(new URL(photo.url).pathname)
    const filePath = path.join(uploadsDir, filename)
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: filename })
    }
  }

  await archive.finalize()
  return "stream"
}
