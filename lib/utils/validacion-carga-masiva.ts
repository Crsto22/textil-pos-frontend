import { authFetch } from "@/lib/auth/auth-fetch"

export interface ValidacionCargaMasivaResult {
  missingCategorias: string[]
  missingColores: string[]
  missingTallas: string[]
  /** Mapa de colorNombre (lowercase) → código hex para los colores que existen en BD */
  colorHexMap: Record<string, string>
}

async function fetchAllPagesNames(
  url: string,
  extractName: (item: Record<string, unknown>) => string
): Promise<string[]> {
  const all: string[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    try {
      const res = await authFetch(`${url}?page=${page}`)
      if (!res.ok) break
      const data = (await res.json()) as {
        content?: Record<string, unknown>[]
        totalPages?: number
      }
      const items = data.content ?? []
      all.push(...items.map(extractName).filter(Boolean))
      totalPages = data.totalPages ?? 1
    } catch {
      break
    }
    page++
  }

  return all
}

async function fetchAllColoresDB(
  url: string
): Promise<Array<{ nombre: string; codigo: string | null }>> {
  const all: Array<{ nombre: string; codigo: string | null }> = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    try {
      const res = await authFetch(`${url}?page=${page}`)
      if (!res.ok) break
      const data = (await res.json()) as {
        content?: Array<Record<string, unknown>>
        totalPages?: number
      }
      const items = data.content ?? []
      all.push(
        ...items.map((item) => ({
          nombre: String(item.nombre ?? "").trim(),
          codigo: item.codigo ? String(item.codigo).trim() : null,
        }))
      )
      totalPages = data.totalPages ?? 1
    } catch {
      break
    }
    page++
  }

  return all
}

function normalizeHex(codigo: string | null): string | null {
  if (!codigo) return null
  const trimmed = codigo.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return null
}

export async function validarCargaMasiva(
  categoriasExcel: string[],
  coloresExcel: string[],
  tallasExcel: string[]
): Promise<ValidacionCargaMasivaResult> {
  const [categoriasDB, coloresDB, tallasDB] = await Promise.all([
    fetchAllPagesNames("/api/categoria/listar", (item) =>
      String(item.nombreCategoria ?? "")
    ),
    fetchAllColoresDB("/api/color/listar"),
    fetchAllPagesNames("/api/talla/listar", (item) => String(item.nombre ?? "")),
  ])

  // Construir set de nombres y mapa nombre → hex para colores existentes
  const coloresSet = new Set<string>()
  const colorHexMap: Record<string, string> = {}

  for (const color of coloresDB) {
    if (!color.nombre) continue
    const key = color.nombre.toLowerCase()
    coloresSet.add(key)
    const hex = normalizeHex(color.codigo)
    if (hex) {
      colorHexMap[key] = hex
    }
  }

  const categoriasSet = new Set(categoriasDB.map((n) => n.trim().toLowerCase()))
  const tallasSet = new Set(tallasDB.map((n) => n.trim().toLowerCase()))

  const missingCategorias = [
    ...new Set(
      categoriasExcel.filter(
        (c) => c.trim() && !categoriasSet.has(c.trim().toLowerCase())
      )
    ),
  ]
  const missingColores = [
    ...new Set(
      coloresExcel.filter(
        (c) => c.trim() && !coloresSet.has(c.trim().toLowerCase())
      )
    ),
  ]
  const missingTallas = [
    ...new Set(
      tallasExcel.filter(
        (t) => t.trim() && !tallasSet.has(t.trim().toLowerCase())
      )
    ),
  ]

  return { missingCategorias, missingColores, missingTallas, colorHexMap }
}
