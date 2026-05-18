import { Link } from "react-router-dom"
import { StatCard } from "@/components/event/StatCard"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { useAuth } from "@/auth/AuthContext"
import { useEventsStore } from "@/stores/eventsStore"

export const DashboardPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)

  const totalMemories = events.reduce((sum, event) => sum + event.photoCount, 0)
  const totalGuests = events.reduce((sum, event) => sum + event.guestCount, 0)

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

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <StatCard label="Total Events" value={events.length} sub="+2 this month" subTone="primary" />
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
        <GlassPanel className="bg-white/40 border-white p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="font-label-md text-on-surface-variant">Storage</p>
            <span className="font-label-md text-primary">65%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary-container w-[65%] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          </div>
          <p className="text-[10px] mt-2 text-on-surface-variant uppercase tracking-widest">
            32.5 GB of 50 GB Used
          </p>
        </GlassPanel>
      </section>

      <section>
        <div className="flex justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Recent Events</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Your latest shared narratives and celebrations.
            </p>
          </div>
          <button
            type="button"
            className="text-primary font-label-md flex items-center gap-1 hover:underline whitespace-nowrap"
          >
            View All <Icon name="arrow_forward" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.slice(0, 3).map((event) => (
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
