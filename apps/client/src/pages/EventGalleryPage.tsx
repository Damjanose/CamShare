import { useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query"
import type { EventPhoto, EventChannel, EventMemberWithName } from "@/types/domain"
import { Button } from "@/components/primitives/Button"
import { Icon } from "@/components/primitives/Icon"
import { MasonryGrid } from "@/components/primitives/MasonryGrid"
import { useEventsStore } from "@/stores/eventsStore"
import { apiClient } from "@/api/client"

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`
}

export const EventGalleryPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const event = useEventsStore((s) => s.events.find((e) => e.id === eventId))
  const qc = useQueryClient()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const channelsQuery = useQuery({
    queryKey: ["event-channels", eventId],
    queryFn: () => apiClient.get<EventChannel[]>(`/events/${eventId}/channels`),
    enabled: !!eventId,
  })

  const channels = channelsQuery.data ?? []

  const photoQueries = useQueries({
    queries: channels.map((ch) => ({
      queryKey: ["event-channel-photos", ch.id],
      queryFn: () => apiClient.get<EventPhoto[]>(`/events/${eventId}/channels/${ch.id}/photos`),
    })),
  })

  const membersQuery = useQuery({
    queryKey: ["event-members", eventId],
    queryFn: () => apiClient.get<EventMemberWithName[]>(`/events/${eventId}/members`),
    enabled: !!eventId,
  })

  const members = membersQuery.data ?? []

  const deleteMutation = useMutation({
    mutationFn: ({ channelId, photoId }: { channelId: string; photoId: string }) =>
      apiClient.delete(`/events/${eventId}/channels/${channelId}/photos/${photoId}`),
    onSuccess: (_data, { channelId }) => {
      qc.invalidateQueries({ queryKey: ["event-channel-photos", channelId] })
    },
  })

  const allPhotos: EventPhoto[] = photoQueries.flatMap((q) => q.data ?? [])

  const groups = useMemo(() => {
    const nameMap = new Map(members.map((m) => [m.userId, m.fullName]))
    const byUploader = new Map<string, EventPhoto[]>()
    for (const photo of allPhotos) {
      const existing = byUploader.get(photo.uploaderId) ?? []
      existing.push(photo)
      byUploader.set(photo.uploaderId, existing)
    }
    return Array.from(byUploader.entries()).map(([uploaderId, photos]) => ({
      uploaderId,
      name: nameMap.get(uploaderId) ?? "Unknown Guest",
      photos,
    }))
  }, [allPhotos, members])

  if (!event) return <Navigate to="/dashboard" replace />

  const loading = channelsQuery.isLoading || membersQuery.isLoading

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
        </div>
      </section>

      {deleteError && (
        <div className="mb-6 p-4 rounded-xl bg-surface-container border border-outline-variant/40 flex items-center gap-3 text-error">
          <Icon name="error" />
          <span className="font-body-md flex-grow">{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)} aria-label="Dismiss">
            <Icon name="close" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24">
          <p className="text-on-surface-variant font-body-md">Loading gallery…</p>
        </div>
      ) : allPhotos.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-outline-variant/40 rounded-3xl">
          <Icon name="image_search" className="text-5xl text-primary mb-4 block" />
          <p className="font-headline-md text-on-surface mb-2">No memories yet</p>
          <p className="text-on-surface-variant">
            Share the QR with your guests to start collecting moments.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {groups.map(({ uploaderId, name, photos }) => (
            <section key={uploaderId}>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-6">
                {name}
                <span className="text-on-surface-variant font-body-md ml-2">
                  ({photos.length} {photos.length === 1 ? "photo" : "photos"})
                </span>
              </h2>
              <MasonryGrid>
                {photos.map((photo) => (
                  <PhotoTile
                    key={photo.id}
                    photo={photo}
                    deleting={
                      deleteMutation.isPending &&
                      deleteMutation.variables?.photoId === photo.id
                    }
                    onDelete={async () => {
                      setDeleteError(null)
                      try {
                        await deleteMutation.mutateAsync({
                          channelId: photo.channelId,
                          photoId: photo.id,
                        })
                      } catch (err) {
                        setDeleteError(
                          err instanceof Error ? err.message : "Failed to delete photo",
                        )
                      }
                    }}
                  />
                ))}
              </MasonryGrid>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

const PhotoTile = ({
  photo,
  deleting,
  onDelete,
}: {
  photo: EventPhoto
  deleting: boolean
  onDelete: () => void
}) => (
  <div className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-champagne-gold/30">
    <img
      src={photo.url}
      alt={photo.caption ?? ""}
      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
      {photo.caption && (
        <p className="text-white font-caption text-xs line-clamp-2">{photo.caption}</p>
      )}
    </div>
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all disabled:cursor-not-allowed"
      aria-label="Delete photo"
    >
      <Icon name={deleting ? "hourglass_empty" : "delete"} className="text-sm" />
    </button>
  </div>
)
