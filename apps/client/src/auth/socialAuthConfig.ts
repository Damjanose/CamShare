export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "missing.apps.googleusercontent.com"

export const APPLE_CLIENT_ID =
  import.meta.env.VITE_APPLE_CLIENT_ID ?? "com.aeterna.signin.missing"

export const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI ??
  (typeof window !== "undefined" ? `${window.location.origin}/auth/apple/callback` : "")

export const isGoogleConfigured = () =>
  Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export const isAppleConfigured = () =>
  Boolean(import.meta.env.VITE_APPLE_CLIENT_ID)
