import { Link, NavLink, type NavLinkProps } from "react-router-dom"
import type { ReactNode } from "react"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import { cn } from "@/lib/cn"
import camShareLogo from "@/assets/camshare-logo.png"

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "font-label-md text-label-md transition-colors duration-300",
    isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary",
  )

type NavLinkSpec = { to: NavLinkProps["to"]; label: string }
const links: NavLinkSpec[] = [
  { to: "/", label: "Overview" },
  { to: "/#features", label: "Features" },
  { to: "/#showcase", label: "Showcase" },
]

export const MarketingShell = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-canvas-white text-on-surface overflow-x-hidden">
      <header className="bg-surface-glass backdrop-blur-3xl border-b border-outline-variant/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={camShareLogo} alt="CamShare" className="h-9 w-9 object-contain rounded-xl" />
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
              CamShare
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {links.map((l) => (
              <NavLink key={l.label} to={l.to} className={navItemClass} end>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] px-6 py-2 text-label-md"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden md:inline text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] px-6 py-2 text-label-md"
              >
                New Event
              </Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="px-margin-mobile md:px-margin-desktop py-12 bg-white border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <img src={camShareLogo} alt="CamShare" className="h-7 w-7 object-contain rounded-lg" />
              <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                CamShare
              </span>
            </div>
            <p className="text-caption text-on-surface-variant">
              © {new Date().getFullYear()} CamShare. All memories preserved.
            </p>
          </div>
          <div className="flex gap-10">
            <Link className="text-label-md text-on-surface-variant hover:text-primary transition-colors" to="/about">
              About
            </Link>
            <Link className="text-label-md text-on-surface-variant hover:text-primary transition-colors" to="/privacy">
              Privacy
            </Link>
            <Link className="text-label-md text-on-surface-variant hover:text-primary transition-colors" to="/terms">
              Terms
            </Link>
          </div>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <Icon name="share" className="text-on-surface-variant text-xl" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <Icon name="public" className="text-on-surface-variant text-xl" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
