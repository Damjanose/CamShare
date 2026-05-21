import { useEffect } from "react"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

export const SharedPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const error = useEventsStore((s) => s.error)
  const initialized = useEventsStore((s) => s.initialized)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  useEffect(() => {
    if (!initialized && !loading && !error) fetchEvents()
  }, [initialized, loading, error, fetchEvents])

  if (!user) return null

  const shared = events.filter((e) => e.ownerId !== user.id && e.isActive)

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-80 bg-surface-container-high rounded-lg animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <p className="font-body-lg text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={() => fetchEvents()}
          className="px-6 py-2 rounded-full bg-champagne-gold text-white font-label-md hover:scale-[1.02] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Shared With Me</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Events you have been invited to as a guest.
        </p>
      </header>

      {shared.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="group" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">No shared events yet</p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              You haven't been invited to any events yet. Ask a host to share their event QR code with you.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shared.map((event) => (
            <div key={event.id} className="relative">
              <EventCard event={event} />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white font-label-md text-caption backdrop-blur-sm pointer-events-none">
                Shared event
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
