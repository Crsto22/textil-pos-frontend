const BACKEND_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "")
    : ""

/**
 * Converts a relative backend path (e.g. /storage/productos/...)
 * to an absolute URL using NEXT_PUBLIC_BACKEND_URL.
 * Absolute URLs (http/https/blob) are returned unchanged.
 */
export function resolveBackendUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^(https?:|blob:|data:)/.test(url)) return url
  if (!BACKEND_BASE) return url
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`
}
