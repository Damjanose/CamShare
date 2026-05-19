import { randomUUID } from "node:crypto"
import path from "node:path"
import fs from "node:fs"
import type { Request, Response } from "express"
import multer from "multer"

const uploadsDir = path.join(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg"
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single("file")

export const handleUpload = (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  if (!req.file) return res.status(400).json({ message: "No file uploaded" })
  const baseUrl = `${req.protocol}://${req.get("host")}`
  return res.json({ url: `${baseUrl}/uploads/${req.file.filename}` })
}
