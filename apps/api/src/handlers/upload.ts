import { randomUUID } from "node:crypto"
import path from "node:path"
import fs from "node:fs"
import type { Request, Response, RequestHandler } from "express"
import multer from "multer"
import { db } from "../lib/db.js"

const uploadsDir = path.join(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg"
    cb(null, `${randomUUID()}${ext}`)
  },
})

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  cb(null, allowedMimeTypes.includes(file.mimetype))
}

// Non-event uploads — hard 10 MB ceiling
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).single("file")

// Event-aware upload — respects max_file_size_mb from the event row
export const eventUploadMiddleware: RequestHandler = async (req, res, next) => {
  const eventId = req.query.eventId as string | undefined
  let limitBytes = 10 * 1024 * 1024 // default 10 MB

  if (eventId) {
    try {
      const event = await db
        .selectFrom("events")
        .select("max_file_size_mb")
        .where("id", "=", eventId)
        .executeTakeFirst()

      if (event !== undefined) {
        // null means unlimited — use 100 MB ceiling
        limitBytes = event.max_file_size_mb !== null
          ? event.max_file_size_mb * 1024 * 1024
          : 100 * 1024 * 1024
      }
    } catch (err) {
      return next(err)
    }
  }

  const upload = multer({ storage, fileFilter, limits: { fileSize: limitBytes } }).single("file")

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({
        message: `File too large (limit: ${limitBytes / 1024 / 1024} MB)`,
      })
    }
    if (err) return next(err)
    next()
  })
}

export const handleUpload = (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  if (!req.file) return res.status(400).json({ message: "No file uploaded" })
  const baseUrl = `${req.protocol}://${req.get("host")}`
  return res.json({ url: `${baseUrl}/uploads/${req.file.filename}` })
}
