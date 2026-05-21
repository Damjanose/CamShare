import { useEffect, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { QrCard } from "@/components/event/QrCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { usePhotosStore } from "@/stores/photosStore"
import { apiClient } from "@/api/client"

const formatLongDate = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`
}

export const QrInvitePage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const event = useEventsStore((s) => s.events.find((e) => e.id === eventId))
  const allPhotos = usePhotosStore((s) => s.photos)
  const photos = eventId ? allPhotos.filter((p) => p.eventId === eventId) : []
  const [copied, setCopied] = useState(false)
  const [joinToken, setJoinToken] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    apiClient
      .post<{ token: string }>(`/events/${eventId}/join-token`)
      .then((data) => setJoinToken(data.token))
      .catch(() => setJoinToken(null))
  }, [eventId])

  if (!event) return <Navigate to="/dashboard" replace />

  const inviteUrl = joinToken ? `${window.location.origin}/invite/${joinToken}` : null

  const handleCopy = async () => {
    if (!inviteUrl) return
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
              {event.title}
            </Link>
          </nav>
          <h1 className="font-headline-lg text-[40px] leading-tight text-on-surface">
            {event.title}
          </h1>
          <p className="text-on-surface-variant mt-2 font-body-md italic opacity-80">
            {event.eventDate ? formatLongDate(event.eventDate) : "Date TBD"}
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
            className="px-6 py-2 rounded-full bg-champagne-gold text-white font-label-md text-label-md shadow-lg shadow-champagne-gold/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Publish Live
          </button>
        </div>
      </header>

      <div className="flex gap-10 border-b border-outline-variant/30 mb-12 overflow-x-auto hide-scrollbar">
        <Link
          to={`/events/${event.id}`}
          className="pb-4 font-label-md text-label-md whitespace-nowrap text-on-surface-variant hover:text-primary transition-colors"
        >
          Gallery
        </Link>
        <span className="pb-4 font-label-md text-label-md whitespace-nowrap text-primary border-b-2 border-primary font-bold">
          QR Invite
        </span>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-7 flex flex-col items-center justify-start">
          {inviteUrl ? (
            <>
              <QrCard
                value={inviteUrl}
                title="Scan to Join the Memory"
                subtitle={`Unique invite code for the private gallery of ${event.title}.`}
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
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-on-surface-variant font-body-md">
              Generating invite link…
            </div>
          )}
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
  event: { title: string; coverImageUrl: string | null }
  previewPhotos: string[]
}) => {
  return (
    <div className="relative mx-auto w-[300px] h-[620px] bg-[#131313] rounded-[3rem] border-[7px] border-[#2a2a2a] shadow-2xl overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#2a2a2a] rounded-b-2xl z-30" />

      {/* Screen — dark surface */}
      <div className="hide-scrollbar w-full h-full bg-[#131313] overflow-y-auto relative z-10 flex flex-col">

        {/* Subtle atmospheric purple tint top-left */}
        <div
          className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(211,188,252,0.08) 0%, transparent 70%)" }}
        />

        <div className="px-5 pt-10 pb-4 flex-1 flex flex-col">
          {/* Header */}
          <p className="text-[9px] font-bold tracking-[3px] uppercase mb-1" style={{ color: "#f2ca50" }}>
            YOUR EVENTS
          </p>
          <p className="text-[22px] font-bold mb-4" style={{ color: "#e5e2e1", fontFamily: "serif" }}>
            Moments
          </p>

          {/* Section label */}
          <p className="text-[8px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: "#99907c" }}>
            UPCOMING
          </p>

          {/* Event card */}
          <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: 140 }}>
            <img src={event.coverImageUrl ?? ""} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(19,19,19,0.85) 0%, transparent 55%)" }} />
            {/* Glass badge */}
            <div
              className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(242,202,80,0.18)", color: "#f2ca50", border: "1px solid rgba(242,202,80,0.3)" }}
            >
              LIVE
            </div>
            <div className="absolute bottom-3 left-3">
              <p className="text-[13px] font-semibold leading-tight" style={{ color: "#e5e2e1", fontFamily: "serif" }}>
                {event.title}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: "#d0c5af" }}>Tap to enter gallery</p>
            </div>
          </div>

          {/* Memories section */}
          <p className="text-[8px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: "#99907c" }}>
            MEMORIES
          </p>
          {previewPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {previewPhotos.slice(0, 4).map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ height: 72 }}>
                  <img src={url} alt="" className="w-full h-full object-cover" style={{ opacity: 0.85 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl" style={{ height: 72, background: "#201f1f" }} />
              ))}
            </div>
          )}
        </div>

        {/* Floating bottom nav — matches real BottomNav exactly */}
        <div className="absolute bottom-3 left-4 right-4 z-20" style={{ height: 56 }}>
          {/* Glass pill */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-around px-2"
            style={{
              background: "rgba(19,19,19,0.6)",
              border: "1px solid rgba(242,202,80,0.10)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Icon name="auto_awesome" filled className="!text-[18px] !text-[#f2ca50]" />
            <Icon name="calendar_month" className="!text-[18px] !text-[#d0c5af]" />
            <span className="w-10" />
            <Icon name="favorite_border" className="!text-[18px] !text-[#d0c5af]" />
            <Icon name="person_outline" className="!text-[18px] !text-[#d0c5af]" />
          </div>

          {/* Centre QR button — elevated, pink→gold gradient, pink glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full"
            style={{
              width: 52,
              height: 52,
              top: -12,
              background: "linear-gradient(135deg, #fa94b6, #f2ca50)",
              boxShadow: "0 6px 18px rgba(250,148,182,0.55)",
            }}
          >
            <Icon name="qr_code_scanner" filled className="!text-[22px] !text-[#3c2f00]" />
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#353534] rounded-full z-30" />
    </div>
  )
}
