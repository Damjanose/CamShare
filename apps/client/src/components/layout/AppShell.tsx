import { useState } from "react"
import { Outlet } from "react-router-dom"
import { cn } from "@/lib/cn"
import { SidebarNav } from "./SidebarNav"
import { TopBar } from "./TopBar"

export const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-canvas-white text-on-surface">
      <TopBar />
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <main
        className={cn(
          "pt-32 px-margin-mobile md:px-margin-desktop pb-20 min-h-screen transition-all duration-300",
          sidebarOpen ? "md:ml-72" : "md:ml-16",
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
