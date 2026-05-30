import { useGoogleLogin, type TokenResponse } from "@react-oauth/google"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import { APPLE_CLIENT_ID, APPLE_REDIRECT_URI } from "@/auth/socialAuthConfig"

type AppleAuthResponse = {
  authorization?: { code: string; id_token: string; state?: string }
  user?: { name?: { firstName?: string; lastName?: string }; email?: string }
  error?: { error: string }
}

export const useSocialAuth = (redirectTo = "/dashboard") => {
  const { googleLogin, appleLogin } = useAuth()
  const navigate = useNavigate()

  const googleSignIn = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (response: TokenResponse) => {
      await googleLogin(response.access_token)
      navigate(redirectTo, { replace: true })
    },
    onError: (error) => {
      console.warn("Google sign-in failed", error)
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
        return
      }
      try {
        await appleLogin(data.authorization!.id_token, data.user)
        navigate(redirectTo, { replace: true })
      } catch (err) {
        console.error("Apple login failed", err)
      }
    },
  }

  return { googleSignIn, appleLoginProps }
}
