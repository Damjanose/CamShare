import { useEffect, useState } from "react"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

export const ArchivePage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const error = useEventsStore((s) => s.error)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)
  const restoreEvent = useEventsStore((s) => s.restoreEvent)

  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

  // session cache: only fetch when store is empty (navigating back doesn't re-fetch)
  useEffect(() => {
    if (events.length === 0 && !loading && !error) fetchEvents()
  }, [events.length, loading, error, fetchEvents])

  if (!user) return null

  const archived = events.filter((e) => e.ownerId === user.id && !e.isActive)

  const handleRestore = async (id: string) => {
    setRestoringIds((prev) => new Set(prev).add(id))
    setErrors((prev) => { const next = { ...prev }; delete next[id]; return next })
    try {
      await restoreEvent(id)
    } catch {
      setErrors((prev) => ({ ...prev, [id]: "Failed to restore. Please try again." }))
    } finally {
      setRestoringIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-48 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-72 bg-surface-container-high rounded-lg animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <p className="font-body-lg text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={() => fetchEvents()}
          className="px-6 py-2 rounded-full bg-primary text-on-primary font-label-md hover:scale-[1.02] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Archive</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Events you have deactivated. Restore any event to make it active again.
        </p>
      </header>

      {archived.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="inventory_2" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">Nothing here yet</p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              Archived events will appear here. Deactivate an event from its settings to archive it.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {archived.map((event) => (
            <div key={event.id} className="flex flex-col gap-2">
              <div className="relative group">
                <EventCard event={event} />
                <div className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                <div className="absolute bottom-6 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <button
                    type="button"
                    onClick={() => handleRestore(event.id)}
                    disabled={restoringIds.has(event.id)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-primary font-label-md shadow-lg hover:scale-[1.03] transition-transform disabled:opacity-60 disabled:cursor-not-allowed pointer-events-auto"
                  >
                    {restoringIds.has(event.id) ? (
                      <><Icon name="progress_activity" className="animate-spin" /> Restoring…</>
                    ) : (
                      <><Icon name="restore" /> Restore</>
                    )}
                  </button>
                </div>
              </div>
              {errors[event.id] && (
                <p className="text-error font-label-md text-caption px-2">{errors[event.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
