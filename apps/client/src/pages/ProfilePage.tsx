import { type FormEvent, useRef, useState } from "react"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Button } from "@/components/primitives/Button"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import { useAuthStore } from "@/stores/authStore"
import { apiClient } from "@/api/client"
import { AvatarPreviewModal } from "@/components/profile/AvatarPreviewModal"

export const ProfilePage = () => {
  const { user } = useAuth()
  const updateUser = useAuthStore((s) => s.updateUser)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState(false)

  const passwordMismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleNameSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setNameLoading(true)
    setNameError(null)
    setNameSuccess(false)
    try {
      await apiClient.patch("/auth/me", { fullName })
      updateUser({ fullName })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setNameLoading(false)
    }
  }

  const handleAvatarConfirm = async (url: string) => {
    try {
      await apiClient.patch("/auth/me", { avatarUrl: url })
      updateUser({ avatarUrl: url })
      setAvatarFile(null)
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to save avatar")
    }
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    if (passwordMismatch) return
    setPassLoading(true)
    setPassError(null)
    setPassSuccess(false)
    try {
      await apiClient.patch("/auth/me/password", { currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPassSuccess(true)
      setTimeout(() => setPassSuccess(false), 3000)
    } catch (err) {
      setPassError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Profile</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Manage your personal information and security settings.
        </p>
      </header>

      {/* Personal Info */}
      <GlassPanel className="p-8 mb-6">
        <div className="flex items-center gap-3 mb-8 text-primary">
          <Icon name="person" />
          <h2 className="font-headline-md text-headline-md">Personal Info</h2>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container flex items-center justify-center">
                  <Icon name="person" className="text-3xl text-on-surface-variant" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Change profile photo"
            >
              <Icon name="photo_camera" className="text-white" />
            </button>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface">{user?.fullName}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-label-md text-sm text-primary hover:underline mt-1 block"
            >
              Change photo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setAvatarFile(file)
              e.target.value = ""
            }}
          />
        </div>

        <form onSubmit={handleNameSave}>
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
            Full Name
          </label>
          <input
            type="text"
            className="form-underline font-headline-md text-headline-md mb-6 w-full"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          {nameError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-label-md text-sm">
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-label-md text-sm">
              Profile updated
            </div>
          )}

          <Button type="submit" variant="primary" disabled={nameLoading || !fullName.trim()}>
            {nameLoading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </GlassPanel>

      {/* Security */}
      <GlassPanel className="p-8">
        <div className="flex items-center gap-3 mb-8 text-primary">
          <Icon name="lock" />
          <h2 className="font-headline-md text-headline-md">Security</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
              Current Password
            </label>
            <input
              type="password"
              className="form-underline font-body-lg text-body-lg w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
              New Password
            </label>
            <input
              type="password"
              className="form-underline font-body-lg text-body-lg w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              className="form-underline font-body-lg text-body-lg w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordMismatch && (
              <p className="text-error font-label-md text-sm mt-2">Passwords don't match</p>
            )}
          </div>

          {passError && (
            <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-label-md text-sm">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-label-md text-sm">
              Password changed
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={
              passLoading ||
              passwordMismatch ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {passLoading ? "Updating…" : "Change Password"}
          </Button>
        </form>
      </GlassPanel>

      <AvatarPreviewModal
        file={avatarFile}
        onConfirm={handleAvatarConfirm}
        onClose={() => setAvatarFile(null)}
      />
    </div>
  )
}
