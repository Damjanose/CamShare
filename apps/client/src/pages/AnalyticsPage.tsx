import { useEffect } from "react"
import { Link } from "react-router-dom"
import { StatCard } from "@/components/event/StatCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export const AnalyticsPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const error = useEventsStore((s) => s.error)
  const initialized = useEventsStore((s) => s.initialized)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  // session cache: fetch once on first visit, skip on subsequent navigations
  useEffect(() => {
    if (!initialized && !loading && !error) fetchEvents()
  }, [initialized, loading, error, fetchEvents])

  const owned = events.filter((e) => e.ownerId === user?.id)
  const totalPhotos = owned.reduce((s, e) => s + e.photoCount, 0)
  const totalGuests = owned.reduce((s, e) => s + e.guestCount, 0)
  const avgPhotos = owned.length > 0 ? Math.round(totalPhotos / owned.length) : 0

  const topEvents = [...owned].sort((a, b) => b.photoCount - a.photoCount)
  const maxPhotoCount = owned.reduce((m, e) => Math.max(m, e.photoCount), 0)

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-48 bg-surface-container-high rounded-xl animate-pulse mb-2" />
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-container-high rounded-3xl animate-pulse" />
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

  if (owned.length === 0) {
    return (
      <>
        <header className="mb-10">
          <h1 className="font-display-lg text-display-lg text-primary mb-2">Analytics</h1>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="analytics" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">No data yet</p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              Create an event to start seeing your activity stats.
            </p>
          </div>
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-champagne-gold text-white font-label-md hover:scale-[1.02] transition-transform"
          >
            <Icon name="add_circle" /> Create Event
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Analytics</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          An overview of your photo-sharing activity.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        <StatCard label="Total Events" value={owned.length} />
        <StatCard
          label="Total Photos"
          value={totalPhotos >= 1000 ? `${(totalPhotos / 1000).toFixed(1)}k` : totalPhotos}
          sub="uploads"
        />
        <StatCard label="Total Guests" value={totalGuests} sub="collaborators" subTone="amethyst" />
        <StatCard label="Avg Photos / Event" value={avgPhotos} sub="per event" />
      </section>

      <section className="mb-14">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Top Events</h2>
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption">#</th>
                <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption">Event</th>
                <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption hidden md:table-cell">Date</th>
                <th scope="col" className="text-right px-6 py-4 font-label-md text-on-surface-variant text-caption">Photos</th>
                <th scope="col" className="text-right px-6 py-4 font-label-md text-on-surface-variant text-caption hidden sm:table-cell">Guests</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.map((event, i) => (
                <tr key={event.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="px-6 py-4 font-label-md text-on-surface-variant">{i + 1}</td>
                  <td className="px-6 py-4">
                    <span className="font-body-md text-on-surface">{event.title}</span>
                    {!event.isActive && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-caption">archived</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-body-md text-on-surface-variant hidden md:table-cell">
                    {event.eventDate ? formatDate(event.eventDate) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right font-label-md text-primary">{event.photoCount}</td>
                  <td className="px-6 py-4 text-right font-body-md text-on-surface-variant hidden sm:table-cell">{event.guestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Activity</h2>
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          {topEvents.map((event) => (
            <div key={event.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body-md text-on-surface truncate max-w-[60%]" title={event.title}>
                  {event.title.length > 30 ? `${event.title.slice(0, 30)}…` : event.title}
                </span>
                <span className="font-label-md text-on-surface-variant ml-2 shrink-0">{event.photoCount} photos</span>
              </div>
              <div className="h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: maxPhotoCount > 0 ? `${(event.photoCount / maxPhotoCount) * 100}%` : "0%",
                    background: "linear-gradient(90deg, #735c00, #d4af37)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
