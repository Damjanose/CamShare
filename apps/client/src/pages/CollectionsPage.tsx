import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { EventCard } from "@/components/event/EventCard"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

type SortKey = "newest" | "oldest" | "most_photos"

export const CollectionsPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const error = useEventsStore((s) => s.error)
  const initialized = useEventsStore((s) => s.initialized)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")

  useEffect(() => {
    if (!initialized && !loading && !error) fetchEvents()
  }, [initialized, loading, error, fetchEvents])

  const owned = events.filter((e) => e.ownerId === user?.id && e.isActive)

  const filtered = owned.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sort === "most_photos") return b.photoCount - a.photoCount
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-96 bg-surface-container-high rounded-lg animate-pulse" />
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary mb-2">Collections</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            All the events you have created and curated.
          </p>
        </div>
        <Link
          to="/events/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-champagne-gold text-white font-label-md whitespace-nowrap hover:scale-[1.02] transition-transform shadow-md"
        >
          <Icon name="add" /> Create Event
        </Link>
      </header>

      <GlassPanel className="p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl" />
            <input
              type="text"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-4 py-3 rounded-2xl bg-white border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_photos">Most Photos</option>
          </select>
        </div>
      </GlassPanel>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="collections" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">
              {search ? "No events match your search" : "No collections yet"}
            </p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              {search
                ? "Try a different search term."
                : "Create your first event to start collecting memories."}
            </p>
          </div>
          {!search && (
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-champagne-gold text-white font-label-md hover:scale-[1.02] transition-transform"
            >
              <Icon name="add_circle" /> Create Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  )
}
