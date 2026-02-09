/**
 * Auth Token Store
 *
 * Almacena el access_token SOLO en memoria (variable de módulo).
 * - No persiste en localStorage ni en cookies.
 * - Se pierde al recargar la página (se renueva via /api/auth/refresh).
 */

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = null
}
