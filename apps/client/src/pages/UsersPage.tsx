import { useEffect, useRef, useState } from "react"
import { listUsers, adminSetUserPassword, adminDeleteUser, type AdminUser } from "@/services/adminService"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

type ModalState = { user: AdminUser } | null

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

const DeleteUserModal = ({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUser
  onClose: () => void
  onDeleted: (userId: string) => void
}) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await adminDeleteUser(user.id)
      onDeleted(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.")
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 p-8">
        <h2 className="font-headline-sm text-primary mb-1">Delete user?</h2>
        <p className="font-body-sm text-on-surface-variant mb-2 truncate">
          {user.fullName} &middot; {user.email}
        </p>
        <p className="font-body-sm text-red-500 mb-6">
          This is permanent and cannot be undone. All their data will be removed.
        </p>

        {error && <p className="font-body-sm text-red-500 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full border border-outline-variant font-label-md text-on-surface-variant hover:bg-surface-container-lowest transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-label-md hover:scale-[1.02] transition-all disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

const ChangePasswordModal = ({
  user,
  onClose,
}: {
  user: AdminUser
  onClose: () => void
}) => {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const validate = () => {
    if (newPassword.length < 8) return "Password must be at least 8 characters."
    if (newPassword !== confirm) return "Passwords do not match."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    try {
      await adminSetUserPassword(user.id, newPassword)
      setSuccess(true)
      setTimeout(onClose, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 p-8">
        <h2 className="font-headline-sm text-primary mb-1">Change password</h2>
        <p className="font-body-sm text-on-surface-variant mb-6 truncate">
          {user.fullName} &middot; {user.email}
        </p>

        {success ? (
          <p className="text-center font-body-md text-green-600 py-4">Password updated.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-xs uppercase tracking-wide">
                New password
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 pr-11 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-champagne-gold/50"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  disabled={saving}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-xs uppercase tracking-wide">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 pr-11 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-champagne-gold/50"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  disabled={saving}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p className="font-body-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full border border-outline-variant font-label-md text-on-surface-variant hover:bg-surface-container-lowest transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-full bg-champagne-gold text-white font-label-md hover:scale-[1.02] transition-all disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export const UsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [deleteModal, setDeleteModal] = useState<ModalState>(null)

  const handleDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setDeleteModal(null)
  }

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
      {modal && (
        <ChangePasswordModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {deleteModal && (
        <DeleteUserModal user={deleteModal.user} onClose={() => setDeleteModal(null)} onDeleted={handleDeleted} />
      )}

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
              <th scope="col" className="w-24 px-3 py-4" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                <td className="px-6 py-4 font-body-md text-on-surface">{u.fullName}</td>
                <td className="px-6 py-4 font-body-md text-on-surface-variant hidden sm:table-cell">{u.email}</td>
                <td className="px-6 py-4 text-right font-body-md text-on-surface-variant">{formatDate(u.createdAt)}</td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Change password"
                      onClick={() => setModal({ user: u })}
                      className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="7.5" cy="15.5" r="5.5" />
                        <path d="m21 2-9.6 9.6" />
                        <path d="m15.5 7.5 3 3L22 7l-3-3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Delete user"
                      onClick={() => setDeleteModal({ user: u })}
                      className="p-2 rounded-full text-on-surface-variant hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
