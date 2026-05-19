const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://10.81.202.106:3001"
const REFRESH_KEY = "camshare_refresh_token"

let _accessToken: string | null = null

export const setTokens = (access: string, refresh: string) => {
  _accessToken = access
  localStorage.setItem(REFRESH_KEY, refresh)
}

export const clearTokens = () => {
  _accessToken = null
  localStorage.removeItem(REFRESH_KEY)
}

const tryRefresh = async (): Promise<boolean> => {
  const rt = localStorage.getItem(REFRESH_KEY)
  if (!rt) return false
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setTokens(data.tokens.accessToken, data.tokens.refreshToken)
    return true
  } catch {
    return false
  }
}

const doRequest = async <T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !retried) {
    const refreshed = await tryRefresh()
    if (refreshed) return doRequest(method, path, body, true)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => doRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => doRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => doRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => doRequest<T>("DELETE", path),
}
