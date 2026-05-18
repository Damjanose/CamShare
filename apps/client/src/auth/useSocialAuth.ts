import { useGoogleLogin, type TokenResponse } from "@react-oauth/google"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import {
  APPLE_CLIENT_ID,
  APPLE_REDIRECT_URI,
  isAppleConfigured,
  isGoogleConfigured,
} from "@/auth/socialAuthConfig"

type AppleAuthResponse = {
  authorization?: { code: string; id_token: string; state?: string }
  user?: { name?: { firstName?: string; lastName?: string }; email?: string }
  error?: { error: string }
}

/**
 * Wires the OAuth libraries up to our mock auth flow.
 * - Google: useGoogleLogin from @react-oauth/google
 * - Apple: returns props for <AppleLogin> from react-apple-login
 *
 * Without env-var-supplied client IDs, the OAuth popups will fail; the hook still
 * finalizes the mock sign-in so the visual flow works end-to-end.
 */
export const useSocialAuth = (redirectTo = "/dashboard") => {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const finalizeAsLogin = async (email: string) => {
    await login(email, "social")
    navigate(redirectTo, { replace: true })
  }

  const finalizeAsRegister = async (fullName: string, email: string) => {
    await register({ fullName, email, password: "social" })
    navigate(redirectTo, { replace: true })
  }

  const googleSignIn = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (response: TokenResponse) => {
      const email = `google-${response.access_token.slice(0, 8)}@aeterna.local`
      await finalizeAsLogin(email)
    },
    onError: (error) => {
      console.warn("Google sign-in failed", error)
      if (!isGoogleConfigured()) {
        void finalizeAsLogin("guest@aeterna.local")
      }
    },
  })

  const appleLoginProps = {
    clientId: APPLE_CLIENT_ID,
    redirectURI: APPLE_REDIRECT_URI,
    scope: "name email",
    responseType: "code id_token" as const,
    responseMode: "form_post" as const,
    usePopup: true,
    callback: async (data: AppleAuthResponse) => {
      if (data.error) {
        console.warn("Apple sign-in error", data.error)
        if (!isAppleConfigured()) {
          await finalizeAsLogin("guest@aeterna.local")
        }
        return
      }
      const email = data.user?.email ?? "apple-user@aeterna.local"
      const name = [data.user?.name?.firstName, data.user?.name?.lastName]
        .filter(Boolean)
        .join(" ")
      if (name) {
        await finalizeAsRegister(name, email)
      } else {
        await finalizeAsLogin(email)
      }
    },
  }

  return { googleSignIn, appleLoginProps }
}
