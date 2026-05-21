import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FcGoogle } from "react-icons/fc"
import { FaApple } from "react-icons/fa"
import AppleLogin from "react-apple-login"
import { AuthShell } from "@/components/layout/AuthShell"
import { Button } from "@/components/primitives/Button"
import { FloatInput } from "@/components/primitives/FloatInput"
import { PasswordInput } from "@/components/primitives/PasswordInput"
import { useAuth } from "@/auth/AuthContext"
import { useSocialAuth } from "@/auth/useSocialAuth"

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { googleSignIn, appleLoginProps } = useSocialAuth("/dashboard")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await register({ fullName, email, password })
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Begin your first chapter"
      subtitle="Create your account and start collecting memories from every event."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        <FloatInput
          label="Full Name"
          placeholder="Julianne Vance"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <FloatInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <p className="text-caption text-on-surface-variant">
          By creating an account you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Notice
          </a>
          .
        </p>

        <Button variant="gold" size="lg" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account"}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-outline-variant/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white/85 px-4 text-caption uppercase tracking-widest text-on-surface-variant">
              or sign up with
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
          Already curating?{" "}
          <Link to="/login" className="text-primary font-label-md hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
