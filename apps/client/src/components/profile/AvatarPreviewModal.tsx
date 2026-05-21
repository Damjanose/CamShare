import { useEffect, useRef, useState } from "react"
import { Icon } from "@/components/primitives/Icon"
import { Button } from "@/components/primitives/Button"
import { apiClient } from "@/api/client"

type Props = {
  file: File | null
  onConfirm: (url: string) => void
  onClose: () => void
}

export const AvatarPreviewModal = ({ file, onConfirm, onClose }: Props) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!file) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [file, onClose])

  if (!file) return null

  const handleConfirm = async () => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const { url } = await apiClient.upload<{ url: string }>("/upload", form)
      onConfirm(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, please try again")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Confirm Profile Photo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        {preview && (
          <div className="flex justify-center mb-6">
            <img
              src={preview}
              alt="Avatar preview"
              className="w-36 h-36 rounded-full object-cover border-4 border-primary/20 shadow-lg"
            />
          </div>
        )}

        {error && (
          <p className="text-error font-label-md text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={uploading}>
            {uploading ? "Uploading…" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  )
}
