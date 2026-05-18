import { Link, useNavigate } from "react-router-dom"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"

export const TopBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 bg-surface-glass border-b border-white/10 backdrop-blur-md shadow-sm">
      <Link to="/dashboard" className="flex items-center gap-2">
        <Icon name="auto_awesome" className="text-primary text-2xl" />
        <span className="font-headline-md text-headline-md font-bold text-primary">Aeterna</span>
      </Link>
      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
          <Icon name="search" className="text-on-surface-variant text-body-md" />
          <input
            type="text"
            className="bg-transparent border-none focus:ring-0 outline-none text-body-md w-48 placeholder:text-on-surface-variant/50"
            placeholder="Search memories…"
          />
        </div>
        <button
          type="button"
          className="text-primary hover:bg-surface-container rounded-full p-2 transition-colors"
          aria-label="Notifications"
        >
          <Icon name="notifications" />
        </button>
        <button
          type="button"
          className="text-primary hover:bg-surface-container rounded-full p-2 transition-colors"
          aria-label="Settings"
        >
          <Icon name="settings" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="hidden md:inline text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          Sign out
        </button>
        {user?.avatarUrl && (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </header>
  )
}
