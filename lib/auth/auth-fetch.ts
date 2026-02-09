import { getAccessToken, setAccessToken } from "./token-store"

/**
 * Flag para evitar múltiples refreshes simultáneos.
 * Si ya hay un refresh en curso, las demás peticiones esperan
 * a que termine para reutilizar el nuevo token.
 */
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  // Si ya hay un refresh en curso, reutilizar la misma promesa
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })

      if (!res.ok) {
        setAccessToken(null)
        return null
      }

      const data = await res.json()
      setAccessToken(data.access_token)
      return data.access_token
    } catch {
      setAccessToken(null)
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

  // Si 401 → intentar refresh y reintentar UNA vez
  if (response.status === 401) {
    const newToken = await refreshAccessToken()

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`)
      response = await fetch(url, { ...options, headers })
    }
  }

  return response
}
