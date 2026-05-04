import { getAccessToken, setAccessToken } from "./token-store"

let refreshPromise: Promise<string | null> | null = null

function dispatchSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:session-expired"))
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })

      if (!res.ok) {
        setAccessToken(null)
        dispatchSessionExpired()
        return null
      }

      const data = await res.json()
      setAccessToken(data.access_token)
      return data.access_token
    } catch {
      setAccessToken(null)
      dispatchSessionExpired()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Fetch helper que inyecta el Authorization header y
 * reintenta UNA sola vez si recibe 401 (refresh + retry).
 * Si el refresh también falla, despacha "auth:session-expired".
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken()

  const headers = new Headers(options.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    const newToken = await refreshAccessToken()

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`)
      response = await fetch(url, { ...options, headers })
    }
  }

  return response
}
