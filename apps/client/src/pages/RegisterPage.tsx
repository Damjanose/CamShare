import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthShell } from "@/components/layout/AuthShell"
import { Button } from "@/components/primitives/Button"
import { FloatInput } from "@/components/primitives/FloatInput"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await register({ fullName, email, password })
    setSubmitting(false)
    navigate("/dashboard", { replace: true })
  }

  return (
    <AuthShell
      title="Begin your first chapter"
      subtitle="Create your account and start collecting memories from every event."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
        <FloatInput
          label="Password"
          type="password"
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
          <Button variant="outline" type="button">
            <Icon name="g_translate" /> Google
          </Button>
          <Button variant="outline" type="button">
            <Icon name="apple" /> Apple
          </Button>
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
