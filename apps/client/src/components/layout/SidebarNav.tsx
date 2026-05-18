import { Link, NavLink } from "react-router-dom"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import { cn } from "@/lib/cn"

type SidebarItem = {
  to: string
  label: string
  icon: string
  end?: boolean
}

const items: SidebarItem[] = [
  { to: "/dashboard", label: "Memories", icon: "auto_awesome", end: true },
  { to: "/events", label: "Collections", icon: "collections" },
  { to: "/shared", label: "Shared", icon: "group" },
  { to: "/analytics", label: "Analytics", icon: "analytics" },
  { to: "/archive", label: "Archive", icon: "inventory_2" },
]

export const SidebarNav = () => {
  const { user } = useAuth()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 flex-col p-6 z-40 bg-surface-glass border-r border-white/10 backdrop-blur-xl shadow-2xl shadow-primary/5 pt-28">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container shadow-sm">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center">
              <Icon name="person" className="text-on-surface-variant" />
            </div>
          )}
        </div>
        <div>
          <p className="font-headline-md text-headline-md text-primary leading-tight">
            {user?.fullName ?? "Guest"}
          </p>
          <p className="font-label-md text-caption text-on-surface-variant">
            {user?.tier ?? "Free"}
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary-container/20 font-bold translate-x-1"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50 hover:translate-x-1",
              )
            }
          >
            <Icon name={item.icon} />
            <span className="font-label-md text-label-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <Link
        to="/events/new"
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl font-label-md text-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] py-4"
      >
        <Icon name="add" /> Create Event
      </Link>
    </aside>
  )
}
