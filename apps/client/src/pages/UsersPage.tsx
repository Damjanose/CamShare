import { useEffect, useState } from "react"
import { listUsers, type AdminUser } from "@/services/adminService"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export const UsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    listUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listUsers()
      .then((data) => { if (!cancelled) setUsers(data) })
      .catch(() => { if (!cancelled) setError("Failed to load users") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <>
        <header className="mb-10">
          <div className="h-10 w-48 bg-surface-container-high rounded-xl animate-pulse mb-2" />
        </header>
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 border-b border-outline-variant/20 px-6 flex items-center gap-4">
              <div className="h-4 w-40 bg-surface-container-high rounded animate-pulse" />
              <div className="h-4 w-56 bg-surface-container-high rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse ml-auto" />
            </div>
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
          onClick={load}
          className="px-6 py-2 rounded-full bg-champagne-gold text-white font-label-md hover:scale-[1.02] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <>
        <header className="mb-10">
          <h1 className="font-display-lg text-display-lg text-primary mb-2">Users</h1>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <p className="font-headline-md text-primary">No users yet</p>
          <p className="font-body-md text-on-surface-variant">Registered accounts will appear here.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Users</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          All registered accounts — {users.length} total.
        </p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption">Name</th>
              <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption hidden sm:table-cell">Email</th>
              <th scope="col" className="text-right px-6 py-4 font-label-md text-on-surface-variant text-caption">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                <td className="px-6 py-4 font-body-md text-on-surface">{u.fullName}</td>
                <td className="px-6 py-4 font-body-md text-on-surface-variant hidden sm:table-cell">{u.email}</td>
                <td className="px-6 py-4 text-right font-body-md text-on-surface-variant">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
