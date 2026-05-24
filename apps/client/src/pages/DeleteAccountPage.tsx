import { type FormEvent, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Button } from "@/components/primitives/Button"
import { Icon } from "@/components/primitives/Icon"
import { PasswordInput } from "@/components/primitives/PasswordInput"
import { useAuthStore } from "@/stores/authStore"

export const DeleteAccountPage = () => {
  const navigate = useNavigate()
  const deleteAccount = useAuthStore((s) => s.deleteAccount)

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      await deleteAccount(password)
      navigate("/", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-12">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-sm mb-6"
        >
          <Icon name="arrow_back" className="text-base" />
          Back to Profile
        </Link>
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Delete Account</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          This action will schedule your account for permanent deletion.
        </p>
      </header>

      <GlassPanel className="p-8 mb-6 border border-error/20">
        <div className="flex items-center gap-3 mb-6 text-error">
          <Icon name="warning" />
          <h2 className="font-headline-md text-headline-md">What happens when you delete your account</h2>
        </div>

        <ul className="space-y-3 mb-8">
          {[
            "Your account will be deactivated immediately and you will be logged out.",
            "You have 30 days to log back in and reactivate your account — everything will be restored.",
            "If you do not log in within 30 days, your account and all associated data will be permanently deleted.",
            "Permanent deletion cannot be undone.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Icon name="info" className="text-base text-on-surface-variant mt-0.5 shrink-0" />
              <span className="font-body-md text-body-md text-on-surface-variant">{item}</span>
            </li>
          ))}
        </ul>

        <div className="h-px bg-outline-variant/40 mb-8" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-4">
              Enter your password to confirm you want to delete your account.
            </p>
            <PasswordInput
              label="Current Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-label-md text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading || !password}
              className="bg-error text-on-error shadow-lg shadow-error/30 hover:shadow-xl hover:shadow-error/40"
            >
              {loading ? "Deleting…" : "Delete My Account"}
            </Button>
            <Link
              to="/profile"
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </GlassPanel>
    </div>
  )
}
