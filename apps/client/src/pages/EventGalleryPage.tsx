import { useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { GalleryItem } from "@/components/event/GalleryItem"
import { LightboxModal } from "@/components/event/LightboxModal"
import { MasonryGrid } from "@/components/primitives/MasonryGrid"
import { Button } from "@/components/primitives/Button"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { usePhotosStore } from "@/stores/photosStore"
import type { Photo } from "@/types/domain"

type Filter = "all" | "recent" | "favorites" | "video"

const tabs: { id: Filter; label: string }[] = [
  { id: "all", label: "Gallery" },
  { id: "recent", label: "Recent" },
  { id: "favorites", label: "Favorites" },
  { id: "video", label: "Video" },
]

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`
}

export const EventGalleryPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const event = useEventsStore((s) => s.events.find((e) => e.id === eventId))
  const allPhotos = usePhotosStore((s) => s.photos)
  const photos = eventId ? allPhotos.filter((p) => p.eventId === eventId) : []
  const [filter, setFilter] = useState<Filter>("all")
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)

  const filteredPhotos = useMemo(() => {
    switch (filter) {
      case "favorites":
        return photos.filter((p) => p.favorited)
      case "recent":
        return [...photos].sort(
          (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
        )
      case "video":
        return photos.filter((p) => p.isVideo)
      default:
        return photos
    }
  }, [filter, photos])

  if (!event) return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-container-max mx-auto">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1 font-label-md text-label-md">
              <Icon name="calendar_today" className="text-sm" />
              {event.eventDate ? formatDate(event.eventDate) : "Date TBD"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to={`/events/${event.id}/invite`}>
            <Button variant="ghost">
              <Icon name="qr_code" /> Share QR
            </Button>
          </Link>
          <Button variant="primary">
            <Icon name="auto_fix_high" /> Highlight Media
          </Button>
        </div>
      </section>

      <section className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/30 mb-10 gap-4">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`pb-4 font-label-md text-label-md transition-all ${
                filter === tab.id
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {tab.label}
              {tab.id === "all" && (
                <span className="ml-1 text-caption opacity-70">({photos.length})</span>
              )}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-6 pb-4">
          <button
            type="button"
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all font-label-md text-label-md"
          >
            <Icon name="download" /> Download All
          </button>
          <button
            type="button"
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all font-label-md text-label-md"
          >
            <Icon name="grid_view" /> Layout
          </button>
        </div>
      </section>

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-outline-variant/40 rounded-3xl">
          <Icon name="image_search" className="text-5xl text-primary mb-4 block" />
          <p className="font-headline-md text-on-surface mb-2">No memories yet</p>
          <p className="text-on-surface-variant">
            Share the QR with your guests to start collecting moments.
          </p>
        </div>
      ) : (
        <MasonryGrid>
          {filteredPhotos.map((photo) => (
            <GalleryItem key={photo.id} photo={photo} onOpen={setLightboxPhoto} />
          ))}
        </MasonryGrid>
      )}

      <LightboxModal photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
    </div>
  )
}
