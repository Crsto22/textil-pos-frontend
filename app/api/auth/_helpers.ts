import { NextResponse } from "next/server"

/**
 * Parsea los headers Set-Cookie del backend y los re-setea usando
 * la API cookies.set() de NextResponse.
 *
 * ⚠️  NO usar headers.append("Set-Cookie", ...) junto con cookies.set()
 *     porque NextResponse los maneja internamente y se sobreescriben.
 *     Usar SOLO cookies.set() evita ese conflicto.
 */
export function forwardCookies(
  backendRes: Response,
  nextRes: NextResponse
): void {
  const setCookieHeaders = backendRes.headers.getSetCookie()

  for (const raw of setCookieHeaders) {
    const parsed = parseSetCookie(raw)
    if (parsed) {
      nextRes.cookies.set(parsed.name, parsed.value, parsed.options)
    }
  }
}

interface CookieOptions {
  path?: string
  maxAge?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "lax" | "strict" | "none"
}

/**
 * Parsea un header Set-Cookie crudo a { name, value, options }.
 * Ej: "refresh_token=abc123; Path=/api/auth; Max-Age=604800; HttpOnly; SameSite=Lax"
 */
function parseSetCookie(
  raw: string
): { name: string; value: string; options: CookieOptions } | null {
  const parts = raw.split(";").map((p) => p.trim())
  const [nameValue, ...attrs] = parts
  if (!nameValue) return null

  const eqIdx = nameValue.indexOf("=")
  if (eqIdx === -1) return null

  const name = nameValue.substring(0, eqIdx)
  const value = nameValue.substring(eqIdx + 1)

  const options: CookieOptions = {}

  for (const attr of attrs) {
    const lower = attr.toLowerCase()
    if (lower === "httponly") {
      options.httpOnly = true
    } else if (lower === "secure") {
      options.secure = true
    } else if (lower.startsWith("path=")) {
      options.path = attr.substring(5)
    } else if (lower.startsWith("max-age=")) {
      options.maxAge = parseInt(attr.substring(8), 10)
    } else if (lower.startsWith("samesite=")) {
      options.sameSite = attr.substring(9).toLowerCase() as CookieOptions["sameSite"]
    }
  }

  return { name, value, options }
}

/**
 * Parsea la respuesta del backend como JSON de forma segura.
 * Si el body no es JSON válido (texto plano), usa el texto como message.
 */
export async function safeParseJson(
  res: Response,
  fallbackMessage: string
): Promise<{ message: string }> {
  const text = await res.text()

  try {
    const json = JSON.parse(text)
    return { message: json.message || fallbackMessage }
  } catch {
    return { message: text || fallbackMessage }
  }
}
