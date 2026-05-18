import { useState } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../types/auth-context"
import { extractFieldErrors } from "../utils/form-errors"

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const clearFieldError = (field: string) => {
    setError(null)
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    try {
      await login({ email, password })
      navigate("/categories")
    } catch (err) {
      const { fieldErrors: nextFieldErrors, formError } = extractFieldErrors(err)
      setFieldErrors(nextFieldErrors)
      setError(formError ?? "Invalid credentials")
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5">
            <h1 className="h2 fw-bold mb-2">Welcome back</h1>
            <p className="text-secondary mb-4">Log in to browse categories and products.</p>
            <form onSubmit={onSubmit} className="d-grid gap-3">
              <input
                className={`form-control form-control-lg ${fieldErrors.email ? "is-invalid" : ""}`}
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearFieldError("email")
                }}
              />
              {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
              <div className="password-field-wrap">
                <input
                  className={`form-control form-control-lg password-input ${fieldErrors.password ? "is-invalid" : ""}`}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError("password")
                  }}
                />
                <button
                  className="password-toggle-btn"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
              <button className="btn btn-primary btn-lg" type="submit">
                Login
              </button>
            </form>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            <p className="mb-0 mt-4 text-secondary">
              No account?{" "}
              <Link className="fw-semibold" to="/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
