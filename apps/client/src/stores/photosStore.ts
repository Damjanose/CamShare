import { create } from "zustand"
import { mockPhotos } from "@/data/mockPhotos"
import type { Photo } from "@/types/domain"

type PhotosState = {
  photos: Photo[]
  forEvent: (eventId: string) => Photo[]
  toggleFavorite: (photoId: string) => void
}

export const usePhotosStore = create<PhotosState>((set, get) => ({
  photos: mockPhotos,
  forEvent: (eventId) => get().photos.filter((photo) => photo.eventId === eventId),
  toggleFavorite: (photoId) => {
    set({
      photos: get().photos.map((photo) =>
        photo.id === photoId ? { ...photo, favorited: !photo.favorited } : photo,
      ),
    })
  },
}))
