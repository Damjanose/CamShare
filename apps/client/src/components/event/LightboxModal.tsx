import { useEffect } from "react"
import { Icon } from "@/components/primitives/Icon"
import type { Photo } from "@/types/domain"

type LightboxModalProps = {
  photo: Photo | null
  onClose: () => void
}

export const LightboxModal = ({ photo, onClose }: LightboxModalProps) => {
  useEffect(() => {
    if (!photo) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [photo, onClose])

  if (!photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-on-surface/80 backdrop-blur-xl flex items-center justify-center p-margin-mobile md:p-margin-desktop"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <Icon name="close" />
      </button>
      <div
        className="relative max-w-5xl w-full max-h-[85vh] flex flex-col gap-6"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={photo.url}
          alt=""
          className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
        />
        <div className="flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/30">
            <img src={photo.uploaderAvatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-label-md text-label-md">{photo.uploaderName}</p>
            <p className="text-caption opacity-70">
              {new Date(photo.takenAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
