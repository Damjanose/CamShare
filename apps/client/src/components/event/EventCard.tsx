import { Link } from "react-router-dom"
import { Icon } from "@/components/primitives/Icon"
import type { Event } from "@/types/domain"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })

export const EventCard = ({ event }: { event: Event }) => {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-primary/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 block"
    >
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={event.coverImageUrl ?? ""}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6 absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
        <p className="font-label-md text-caption text-white/80 mb-1 uppercase tracking-widest">
          {event.eventDate ? formatDate(event.eventDate) : "Date TBD"}
        </p>
        <h3 className="font-headline-md text-headline-md mb-2">{event.title}</h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-caption font-label-md">
            <Icon name="photo_library" className="text-[18px]" /> {event.photoCount} Uploads
          </span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="flex items-center gap-1 text-caption font-label-md">
            <Icon name="group" className="text-[18px]" /> {event.guestCount} Guests
          </span>
        </div>
      </div>
    </Link>
  )
}
