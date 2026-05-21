import { useEffect } from "react"
import { Link } from "react-router-dom"
import { StatCard } from "@/components/event/StatCard"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import { useEventsStore } from "@/stores/eventsStore"

export const DashboardPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const error = useEventsStore((s) => s.error)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const totalMemories = events.reduce((sum, e) => sum + e.photoCount, 0)
  const totalGuests = events.reduce((sum, e) => sum + e.guestCount, 0)

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-96 bg-surface-container-high rounded-lg animate-pulse" />
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </section>
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
          className="px-6 py-2 rounded-full bg-primary text-on-primary font-label-md hover:scale-[1.02] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <header className="mb-12">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">
          Welcome back, {user?.fullName.split(" ")[0]}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Your curation of exquisite moments continues. Here is a glance at your recent
          activity and collections.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <StatCard label="Total Events" value={events.length} />
        <StatCard
          label="Total Memories"
          value={totalMemories >= 1000 ? `${(totalMemories / 1000).toFixed(1)}k` : totalMemories}
          sub="photos & videos"
        />
        <StatCard
          label="Active Guests"
          value={totalGuests}
          sub="collaborators"
          subTone="amethyst"
        />
      </section>

      <section>
        <div className="flex justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Recent Events</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Your latest shared narratives and celebrations.
            </p>
          </div>
          <Link
            to="/events"
            className="text-primary font-label-md flex items-center gap-1 hover:underline whitespace-nowrap"
          >
            View All <Icon name="arrow_forward" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.filter(e => e.ownerId === user?.id && e.isActive).slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <Link to="/events/new" className="mt-12 block group">
          <div className="border-2 border-dashed border-outline-variant/50 rounded-3xl p-12 flex flex-col items-center justify-center bg-surface-container-lowest/50 hover:bg-white hover:border-primary transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="add_circle" className="text-primary text-3xl" />
            </div>
            <p className="font-headline-md text-primary">Start a New Memory Chapter</p>
            <p className="font-body-md text-on-surface-variant text-center mt-2 max-w-xs">
              Create an event to begin collecting and curating moments from your next big
              occasion.
            </p>
          </div>
        </Link>
      </section>
    </>
  )
}
