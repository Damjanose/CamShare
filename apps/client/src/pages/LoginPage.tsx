import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { FcGoogle } from "react-icons/fc"
import { FaApple } from "react-icons/fa"
import AppleLogin from "react-apple-login"
import { AuthShell } from "@/components/layout/AuthShell"
import { Button } from "@/components/primitives/Button"
import { FloatInput } from "@/components/primitives/FloatInput"
import { useAuth } from "@/auth/AuthContext"
import { useSocialAuth } from "@/auth/useSocialAuth"

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard"
  const { googleSignIn, appleLoginProps } = useSocialAuth(redirectTo)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await login(email, password)
    setSubmitting(false)
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back to your archive"
      subtitle="Sign in to continue curating the chapters that matter most."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FloatInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FloatInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center justify-between text-caption">
          <label className="flex items-center gap-2 text-on-surface-variant">
            <input
              type="checkbox"
              className="rounded border-outline-variant text-primary focus:ring-primary"
            />
            Remember me
          </label>
          <a href="#" className="text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <Button variant="gold" size="lg" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-outline-variant/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white/85 px-4 text-caption uppercase tracking-widest text-on-surface-variant">
              or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" type="button" onClick={() => googleSignIn()}>
            <FcGoogle aria-hidden className="text-xl" /> Google
          </Button>
          <AppleLogin
            {...appleLoginProps}
            render={({ onClick, disabled }) => (
              <Button
                variant="outline"
                type="button"
                onClick={onClick}
                disabled={disabled}
              >
                <FaApple aria-hidden className="text-xl" /> Apple
              </Button>
            )}
          />
        </div>

        <p className="text-center text-body-md text-on-surface-variant mt-2">
          New to Aeterna?{" "}
          <Link to="/register" className="text-primary font-label-md hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
