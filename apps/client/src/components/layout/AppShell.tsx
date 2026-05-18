import { Outlet } from "react-router-dom"
import { SidebarNav } from "./SidebarNav"
import { TopBar } from "./TopBar"

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-canvas-white text-on-surface">
      <TopBar />
      <SidebarNav />
      <main className="md:ml-72 pt-32 px-margin-mobile md:px-margin-desktop pb-20 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
