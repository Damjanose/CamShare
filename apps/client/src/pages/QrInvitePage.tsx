import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { QrCard } from "@/components/event/QrCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { usePhotosStore } from "@/stores/photosStore"

const formatLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

export const QrInvitePage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const event = useEventsStore((s) => (eventId ? s.getById(eventId) : undefined))
  const photos = usePhotosStore((s) => (eventId ? s.forEvent(eventId) : []))
  const [copied, setCopied] = useState(false)

  if (!event) return <Navigate to="/dashboard" replace />

  const inviteUrl = `${window.location.origin}/invite/${event.inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-12 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div>
          <nav className="flex gap-2 text-on-surface-variant mb-4 font-label-md text-label-md">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Collections
            </Link>
            <span>/</span>
            <Link
              to={`/events/${event.id}`}
              className="text-primary hover:underline"
            >
              {event.name}
            </Link>
          </nav>
          <h1 className="font-headline-lg text-[40px] leading-tight text-on-surface">
            {event.name}
          </h1>
          <p className="text-on-surface-variant mt-2 font-body-md italic opacity-80">
            {formatLongDate(event.date)} • {event.location}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to={`/events/${event.id}`}
            className="px-6 py-2 rounded-full border border-outline-variant font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            View Gallery
          </Link>
          <button
            type="button"
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Publish Live
          </button>
        </div>
      </header>

      <div className="flex gap-10 border-b border-outline-variant/30 mb-12 overflow-x-auto hide-scrollbar">
        {["Event Details", "Gallery Design", "Guest List", "QR Invite", "Settings"].map(
          (tab, index) => (
            <button
              key={tab}
              type="button"
              className={`pb-4 font-label-md text-label-md whitespace-nowrap transition-colors ${
                index === 3
                  ? "text-primary border-b-2 border-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-7 flex flex-col items-center justify-start">
          <QrCard
            value={inviteUrl}
            title="Scan to Join the Memory"
            subtitle={`Unique invite code for the private gallery of ${event.name}.`}
          />
          <div className="w-full max-w-lg grid grid-cols-1 gap-4 mt-10">
            <ActionRow icon="download" label="Download QR for Print" hint="High-res PNG / SVG" />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-between px-6 py-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:bg-surface-container-high transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <Icon name="link" className="text-primary" />
                <span className="font-label-md text-label-md text-on-surface">
                  {copied ? "Link copied to clipboard" : "Copy Invite Link"}
                </span>
              </div>
              <Icon
                name={copied ? "check_circle" : "content_copy"}
                className="text-on-surface-variant opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </button>
            <ActionRow icon="mail" label="Email Invitation" hint="Send to guest list" />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="sticky top-32">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
                Live Guest View
              </h4>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-caption text-on-surface-variant font-medium">
                  Synced Preview
                </span>
              </div>
            </div>
            <PhoneMockup
              event={event}
              previewPhotos={photos.slice(0, 4).map((p) => p.url)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const ActionRow = ({ icon, label, hint }: { icon: string; label: string; hint: string }) => (
  <button
    type="button"
    className="flex items-center justify-between px-6 py-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:bg-surface-container-high transition-all active:scale-[0.98]"
  >
    <div className="flex items-center gap-4">
      <Icon name={icon} className="text-primary" />
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
    </div>
    <span className="text-caption text-on-surface-variant opacity-60">{hint}</span>
  </button>
)

const PhoneMockup = ({
  event,
  previewPhotos,
}: {
  event: { name: string; coverUrl: string }
  previewPhotos: string[]
}) => {
  return (
    <div className="relative mx-auto w-[320px] h-[650px] bg-[#1a1a1a] rounded-[3rem] border-[8px] border-[#333] shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-2xl z-30" />
      <div className="hide-scrollbar w-full h-full bg-canvas-white overflow-y-auto relative z-10 flex flex-col">
        <div className="h-64 w-full relative">
          <img
            src={event.coverUrl}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas-white to-transparent" />
          <div className="absolute bottom-4 left-6">
            <h5 className="font-headline-md text-on-surface text-xl">{event.name}</h5>
            <p className="text-[12px] text-on-surface-variant">Welcome Guest</p>
          </div>
        </div>
        <div className="px-6 py-6 flex-1 flex flex-col gap-6">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-caption text-primary font-bold uppercase tracking-wider mb-2">
              Private Access
            </p>
            <p className="text-on-surface text-sm leading-relaxed">
              You've been invited to view and contribute to this memory archive. Upload your
              favorite moments from tonight.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-md"
            >
              Enter Gallery
            </button>
            <button
              type="button"
              className="w-full py-4 bg-white border border-outline-variant text-on-surface rounded-xl font-bold"
            >
              Upload Photos
            </button>
          </div>
          {previewPhotos.length > 0 && (
            <div>
              <p className="text-caption text-on-surface-variant font-medium mb-3">Live Feed</p>
              <div className="grid grid-cols-2 gap-2">
                {previewPhotos.map((url) => (
                  <div
                    key={url}
                    className="aspect-square bg-surface-container rounded-lg overflow-hidden"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="h-16 border-t border-surface-variant flex items-center justify-around bg-surface-glass backdrop-blur-md px-6">
          <Icon name="home" filled className="text-primary" />
          <Icon name="photo_library" className="text-on-surface-variant" />
          <Icon name="person" className="text-on-surface-variant" />
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[#333] rounded-full z-20" />
    </div>
  )
}
