import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { Icon } from "@/components/primitives/Icon"
import camShareLogo from "@/assets/camshare-logo.png"

export const AuthShell = ({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle?: string
}) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-canvas-white flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full bg-soft-amethyst/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 w-[640px] h-[640px] rounded-full bg-champagne-gold/20 blur-3xl"
      />
      <header className="relative z-10 flex items-center justify-between px-margin-mobile md:px-margin-desktop py-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={camShareLogo} alt="CamShare" className="h-9 w-9 object-contain rounded-xl" />
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
            CamShare
          </span>
        </Link>
        <Link
          to="/"
          className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          Back home
        </Link>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-margin-mobile md:px-margin-desktop pb-16">
        <div className="w-full max-w-[460px]">
          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">{title}</h1>
            {subtitle && (
              <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">{subtitle}</p>
            )}
          </div>
          <div className="glass-panel-strong rounded-3xl p-8 md:p-10 shadow-gold-glow">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
