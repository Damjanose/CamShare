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

type Props = {
  isOpen: boolean
  onToggle: () => void
}

export const SidebarNav = ({ isOpen, onToggle }: Props) => {
  const { user } = useAuth()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex fixed left-0 top-0 h-full flex-col z-40 bg-surface-glass border-r border-white/10 backdrop-blur-xl shadow-2xl shadow-primary/5 pt-20",
          "transition-all duration-300 ease-in-out",
          // Desktop: width-based expand/collapse
          isOpen ? "md:w-72 md:px-6 md:py-6" : "md:w-16 md:px-2 md:py-6",
          // Mobile: translate in/out (always full width)
          isOpen ? "w-72 px-6 py-6 translate-x-0" : "w-72 px-6 py-6 -translate-x-full md:translate-x-0",
        )}
      >
        {/* Collapse / expand toggle — right edge, desktop only */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3 top-32 hidden md:flex w-6 h-6 rounded-full items-center justify-center bg-surface-container-high border border-outline-variant/40 shadow-md hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 z-10"
        >
          <Icon
            name={isOpen ? "chevron_left" : "chevron_right"}
            className="text-[14px] text-on-surface-variant"
          />
        </button>

        {/* User profile section */}
        <div
          className={cn(
            "flex items-center gap-3 mb-8",
            !isOpen && "md:justify-center md:mb-6",
          )}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container shadow-sm flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <Icon name="person" className="text-on-surface-variant" />
              </div>
            )}
          </div>
          {(isOpen) && (
            <div className="overflow-hidden">
              <p className="font-headline-md text-headline-md text-primary leading-tight truncate">
                {user?.fullName ?? "Guest"}
              </p>
              <p className="font-label-md text-caption text-on-surface-variant">
                {user?.tier ?? "Free"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={!isOpen ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 py-3 rounded-xl transition-all duration-200",
                  isOpen ? "px-4" : "md:justify-center md:px-0 px-4",
                  isActive
                    ? "text-primary bg-primary-container/20 font-bold"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50",
                  isOpen && (isActive ? "translate-x-1" : "hover:translate-x-1"),
                )
              }
            >
              <Icon name={item.icon} className="flex-shrink-0" />
              {isOpen && <span className="font-label-md text-label-md">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Create Event */}
        <Link
          to="/events/new"
          title={!isOpen ? "Create Event" : undefined}
          className={cn(
            "mt-auto inline-flex items-center justify-center gap-2 rounded-xl font-label-md text-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-champagne-gold text-white shadow-lg shadow-champagne-gold/30 hover:shadow-xl hover:shadow-champagne-gold/40 hover:scale-[1.02]",
            isOpen ? "py-4 px-4" : "md:py-3 md:px-3 py-4 px-4",
          )}
        >
          <Icon name="add" className="flex-shrink-0" />
          {isOpen && "Create Event"}
        </Link>
      </aside>
    </>
  )
}
