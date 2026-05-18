import { Icon } from "@/components/primitives/Icon"
import { usePhotosStore } from "@/stores/photosStore"
import type { Photo } from "@/types/domain"

type GalleryItemProps = {
  photo: Photo
  onOpen?: (photo: Photo) => void
}

export const GalleryItem = ({ photo, onOpen }: GalleryItemProps) => {
  const toggleFavorite = usePhotosStore((s) => s.toggleFavorite)

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-zoom-in transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20"
      onClick={() => onOpen?.(photo)}
    >
      <img
        src={photo.url}
        alt=""
        className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
      />
      {photo.isVideo && (
        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white font-label-md text-caption">
          <Icon name="play_circle" className="text-sm" /> {photo.videoDurationLabel}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(photo.id)
            }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
            aria-label={photo.favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Icon name="favorite" filled={photo.favorited} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40">
            <img
              src={photo.uploaderAvatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-label-md text-label-md">
            By {photo.uploaderName}
          </span>
        </div>
      </div>
    </div>
  )
}
