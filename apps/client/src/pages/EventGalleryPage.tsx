import { useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import type { EventPhoto, EventMemberWithName } from "@/types/domain"
import { Icon } from "@/components/primitives/Icon"
import { MasonryGrid } from "@/components/primitives/MasonryGrid"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"
import { apiClient } from "@/api/client"

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`
}

export const EventGalleryPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const { user, accessToken } = useAuth()
  const event = useEventsStore((s) => s.events.find((e) => e.id === eventId))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const channelId = event?.defaultChannelId ?? null

  const photosQuery = useQuery({
    queryKey: ["event-all-photos", eventId, channelId],
    queryFn: () =>
      apiClient.get<EventPhoto[]>(
        `/events/${eventId}/channels/${channelId}/photos`,
      ),
    enabled: !!eventId && !!channelId,
  })

  const membersQuery = useQuery({
    queryKey: ["event-members", eventId],
    queryFn: () => apiClient.get<EventMemberWithName[]>(`/events/${eventId}/members`),
    enabled: !!eventId,
  })

  const members = membersQuery.data ?? []
  const allPhotos: EventPhoto[] = photosQuery.data ?? []

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

  if (!event || event.ownerId !== user?.id) return <Navigate to="/dashboard" replace />

  // event is non-null past this point
  const ev = event
  const loading = photosQuery.isLoading || membersQuery.isLoading

  function togglePhoto(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(allPhotos.map((p) => p.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function downloadAlbum() {
    if (selectedIds.size === 0 || !eventId || !accessToken) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001"
      const resp = await fetch(`${apiBase}/events/${eventId}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoIds: Array.from(selectedIds) }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error((err as any).message ?? "Download failed")
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${ev.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-container-max mx-auto">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{ev.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1 font-label-md text-label-md">
              <Icon name="calendar_today" className="text-sm" />
              {ev.eventDate ? formatDate(ev.eventDate) : "Date TBD"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to={`/events/${ev.id}/invite`}>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors"
            >
              <Icon name="qr_code" /> Share QR
            </button>
          </Link>
        </div>
      </section>

      <div className="flex gap-10 lg:gap-16 items-start">
        {/* Main gallery */}
        <div className="flex-1 min-w-0">
          {downloadError && (
            <div className="mb-6 p-4 rounded-xl bg-surface-container border border-outline-variant/40 flex items-center gap-3 text-error">
              <Icon name="error" />
              <span className="font-body-md flex-grow">{downloadError}</span>
              <button type="button" onClick={() => setDownloadError(null)} aria-label="Dismiss">
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
              <p className="font-headline-md text-on-surface mb-2">No photos yet</p>
              <p className="text-on-surface-variant">
                Guests upload their photos via the mobile app. Check back soon.
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
                      <SelectablePhotoTile
                        key={photo.id}
                        photo={photo}
                        selected={selectedIds.has(photo.id)}
                        onToggle={() => togglePhoto(photo.id)}
                      />
                    ))}
                  </MasonryGrid>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Final Album sticky panel */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-32 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 flex flex-col gap-4">
            <h3 className="font-headline-sm text-on-surface">Final Album</h3>
            <p className="text-on-surface-variant font-body-sm text-sm">
              {selectedIds.size === 0
                ? "Click photos to add them to your final album."
                : `${selectedIds.size} of ${allPhotos.length} photo${selectedIds.size === 1 ? "" : "s"} selected`}
            </p>

            {allPhotos.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-label-md text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-outline-variant">·</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-label-md text-on-surface-variant hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={downloadAlbum}
              disabled={selectedIds.size === 0 || downloading}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Icon name={downloading ? "hourglass_empty" : "download"} />
              {downloading ? "Preparing ZIP…" : "Download Final Album"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: bottom bar for selection */}
      {selectedIds.size > 0 && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 bg-surface-container-high border border-outline-variant/40 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl">
          <span className="flex-1 font-label-md text-on-surface">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-on-surface-variant font-label-md text-sm"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={downloadAlbum}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm disabled:opacity-40"
          >
            <Icon name="download" className="text-sm" />
            {downloading ? "…" : "Download"}
          </button>
        </div>
      )}
    </div>
  )
}

const SelectablePhotoTile = ({
  photo,
  selected,
  onToggle,
}: {
  photo: EventPhoto
  selected: boolean
  onToggle: () => void
}) => (
  <div
    className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-champagne-gold/30"
    onClick={onToggle}
  >
    <img
      src={photo.url}
      alt={photo.caption ?? ""}
      loading="lazy"
      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Selection checkbox */}
    <div
      className={`absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
        selected
          ? "bg-primary border-primary"
          : "bg-black/40 border-white/60 opacity-0 group-hover:opacity-100"
      }`}
    >
      {selected && <Icon name="check" className="text-on-primary !text-sm" />}
    </div>

    {/* Guest's pick badge */}
    {photo.isFinal && (
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-on-primary rounded-full px-2 py-0.5 text-[10px] font-label-md">
        <Icon name="star" className="!text-[10px]" /> Pick
      </div>
    )}

    {/* Caption */}
    {photo.caption && (
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white font-caption text-xs line-clamp-2">{photo.caption}</p>
      </div>
    )}
  </div>
)
