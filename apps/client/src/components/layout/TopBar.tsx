import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import camShareLogo from "@/assets/camshare-logo.png"

export const TopBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLogout = () => {
    setSettingsOpen(false)
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 bg-surface-glass border-b border-white/10 backdrop-blur-md shadow-sm">
      <Link to="/dashboard" className="flex items-center gap-2">
        <img src={camShareLogo} alt="CamShare" className="h-9 w-9 object-contain rounded-xl" />
        <span className="font-headline-md text-headline-md font-bold text-primary">CamShare</span>
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

        {/* Bell / notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((o) => !o); setSettingsOpen(false) }}
            className="text-primary hover:bg-surface-container rounded-full p-2 transition-colors"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Icon name="notifications" />
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 glass-panel rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="font-label-md text-label-md text-on-surface">Notifications</span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                  aria-label="Close notifications"
                >
                  <Icon name="close" className="text-body-md" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-on-surface-variant">
                <Icon name="notifications_none" className="text-[2rem] opacity-40" />
                <p className="font-label-md text-label-md opacity-60">No notifications yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div ref={settingsRef} className="relative">
          <button
            type="button"
            onClick={() => { setSettingsOpen((o) => !o); setNotifOpen(false) }}
            className="text-primary hover:bg-surface-container rounded-full p-2 transition-colors"
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <Icon name="settings" />
          </button>

          {settingsOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 glass-panel rounded-2xl shadow-xl z-50 overflow-hidden">
              <Link
                to="/terms"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-on-surface hover:bg-surface-container-high/50 transition-colors border-b border-white/10"
              >
                <span className="font-label-md text-label-md">Terms &amp; Conditions</span>
                <Icon name="chevron_right" className="text-on-surface-variant text-body-md" />
              </Link>
              <Link
                to="/privacy"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-on-surface hover:bg-surface-container-high/50 transition-colors border-b border-white/10"
              >
                <span className="font-label-md text-label-md">Privacy Policy</span>
                <Icon name="chevron_right" className="text-on-surface-variant text-body-md" />
              </Link>
              <Link
                to="/profile"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-on-surface hover:bg-surface-container-high/50 transition-colors border-b border-white/10"
              >
                <span className="font-label-md text-label-md">Profile Settings</span>
                <Icon name="chevron_right" className="text-on-surface-variant text-body-md" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-error hover:bg-error/5 transition-colors font-label-md text-label-md"
              >
                <Icon name="logout" className="text-body-md" />
                Sign out
              </button>
            </div>
          )}
        </div>

        {user?.avatarUrl && (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </header>
  )
}
