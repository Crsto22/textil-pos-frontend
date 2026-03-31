import type { ProductoResumen, ProductoResumenImagen } from "@/lib/types/producto"
import type {
  VarianteResumenColor,
  VarianteResumenImagen,
  VarianteResumenItem,
  VarianteResumenPageResponse,
  VarianteResumenProducto,
  VarianteResumenTalla,
} from "@/lib/types/variante"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function pickNumber(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = 0
) {
  if (!source) return fallback

  for (const key of keys) {
    const parsed = Number(source[key])
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function pickNullableNumber(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return null

  for (const key of keys) {
    const parsed = Number(source[key])
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function pickString(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = ""
): string {
  if (!source) return fallback

  for (const key of keys) {
    if (typeof source[key] === "string") {
      return source[key] as string
    }
  }

  return fallback
}

function pickNullableString(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return null

  for (const key of keys) {
    if (typeof source[key] === "string") {
      const value = (source[key] as string).trim()
      return value.length > 0 ? value : null
    }
  }

  return null
}

function pickBoolean(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = false
) {
  if (!source) return fallback

  for (const key of keys) {
    if (typeof source[key] === "boolean") {
      return source[key] as boolean
    }
  }

  return fallback
}

function parseVarianteResumenImagen(value: unknown): VarianteResumenImagen | null {
  const payload = asRecord(value)
  if (!payload) return null

  const idColorImagen = pickNullableNumber(payload, ["idColorImagen"])
  const url = pickString(payload, ["url"])
  const urlThumb = pickString(payload, ["urlThumb"])

  if (!url && !urlThumb) return null

  return {
    idColorImagen,
    url,
    urlThumb,
    orden: pickNumber(payload, ["orden"]),
    esPrincipal: pickBoolean(payload, ["esPrincipal"]),
    estado: pickString(payload, ["estado"], "ACTIVO"),
  }
}

function parseVarianteResumenImagenList(value: unknown): VarianteResumenImagen[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => parseVarianteResumenImagen(item))
    .filter((item): item is VarianteResumenImagen => item !== null)
}

function parseVarianteResumenProducto(value: unknown): VarianteResumenProducto | null {
  const payload = asRecord(value)
  if (!payload) return null

  const idProducto = pickNumber(payload, ["idProducto"])
  if (idProducto <= 0) return null

  const categoria = asRecord(payload.categoria)
  const sucursal = asRecord(payload.sucursal)

  const categoriaId =
    pickNullableNumber(payload, ["idCategoria"]) ??
    pickNullableNumber(categoria, ["idCategoria"])
  const categoriaNombre =
    pickString(payload, ["nombreCategoria"]) ||
    pickString(categoria, ["nombreCategoria", "nombre"])

  const sucursalId =
    pickNullableNumber(payload, ["idSucursal"]) ??
    pickNullableNumber(sucursal, ["idSucursal"])
  const sucursalNombre =
    pickString(payload, ["nombreSucursal"]) ||
    pickString(sucursal, ["nombreSucursal", "nombre"])

  return {
    idProducto,
    nombre: pickString(payload, ["nombre"], "Producto"),
    descripcion: pickString(payload, ["descripcion"]),
    estado: pickString(payload, ["estado"], "ACTIVO"),
    fechaCreacion: pickString(payload, ["fechaCreacion", "createdAt"]),
    categoria:
      categoriaId !== null || categoriaNombre
        ? {
            idCategoria: categoriaId,
            nombreCategoria: categoriaNombre || "Sin categoria",
          }
        : null,
    sucursal:
      sucursalId !== null || sucursalNombre
        ? {
            idSucursal: sucursalId,
            nombreSucursal: sucursalNombre || "Sin sucursal",
          }
        : null,
  }
}

function parseVarianteResumenColor(value: unknown): VarianteResumenColor | null {
  const payload = asRecord(value)
  if (!payload) return null

  const idColor = pickNullableNumber(payload, ["idColor"])
  const nombre = pickString(payload, ["nombre"], idColor ? `Color #${idColor}` : "Sin color")

  return {
    idColor,
    nombre,
    hex: pickNullableString(payload, ["hex", "codigo"]),
  }
}

function parseVarianteResumenTalla(value: unknown): VarianteResumenTalla | null {
  const payload = asRecord(value)
  if (!payload) return null

  const idTalla = pickNullableNumber(payload, ["idTalla"])
  const nombre = pickString(payload, ["nombre"], idTalla ? `Talla #${idTalla}` : "Sin talla")

  return {
    idTalla,
    nombre,
  }
}

export function parseVarianteResumenItem(value: unknown): VarianteResumenItem | null {
  const payload = asRecord(value)
  if (!payload) return null

  const idProductoVariante = pickNumber(payload, ["idProductoVariante"])
  const producto = parseVarianteResumenProducto(payload.producto)

  if (idProductoVariante <= 0 || !producto) return null

  return {
    idProductoVariante,
    sku: pickNullableString(payload, ["sku"]),
    codigoBarras: pickNullableString(payload, ["codigoBarras"]),
    estado: pickString(payload, ["estado"], "ACTIVO"),
    stock: pickNullableNumber(payload, ["stock"]),
    precio: pickNullableNumber(payload, ["precio"]),
    precioMayor: pickNullableNumber(payload, ["precioMayor"]),
    precioOferta: pickNullableNumber(payload, ["precioOferta"]),
    ofertaInicio: pickNullableString(payload, ["ofertaInicio"]),
    ofertaFin: pickNullableString(payload, ["ofertaFin"]),
    precioVigente: pickNullableNumber(payload, ["precioVigente"]),
    producto,
    color: parseVarianteResumenColor(payload.color),
    talla: parseVarianteResumenTalla(payload.talla),
    imagenPrincipal: parseVarianteResumenImagen(payload.imagenPrincipal),
    imagenes: parseVarianteResumenImagenList(payload.imagenes),
  }
}

function parseVarianteResumenItemList(value: unknown): VarianteResumenItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => parseVarianteResumenItem(item))
    .filter((item): item is VarianteResumenItem => item !== null)
}

export function parseVarianteResumenPageResponse(value: unknown): VarianteResumenPageResponse {
  const payload = asRecord(value)

  return {
    content: parseVarianteResumenItemList(payload?.content),
    page: pickNumber(payload, ["page", "number"]),
    size: pickNumber(payload, ["size"]),
    totalPages: pickNumber(payload, ["totalPages"]),
    totalElements: pickNumber(payload, ["totalElements"]),
    numberOfElements: pickNumber(payload, ["numberOfElements"]),
    first: pickBoolean(payload, ["first"]),
    last: pickBoolean(payload, ["last"]),
    empty: pickBoolean(payload, ["empty"]),
  }
}

function toProductoResumenImagen(
  image: VarianteResumenImagen | null
): ProductoResumenImagen | null {
  if (!image) return null

  return {
    url: image.url,
    urlThumb: image.urlThumb,
    orden: image.orden,
    esPrincipal: image.esPrincipal,
  }
}

export function mapVarianteResumenToProductoResumen(
  item: VarianteResumenItem
): ProductoResumen {
  const precioBase = item.precio ?? item.precioVigente ?? 0
  const colorId = item.color?.idColor ?? item.idProductoVariante
  const tallaId = item.talla?.idTalla ?? item.idProductoVariante
  const fallbackImage =
    item.imagenPrincipal ??
    item.imagenes.find((image) => image.esPrincipal) ??
    item.imagenes[0] ??
    null

  return {
    idProducto: item.producto.idProducto,
    sku: item.sku ?? "",
    nombre: item.producto.nombre,
    descripcion: item.producto.descripcion,
    estado: item.estado || item.producto.estado,
    fechaCreacion: item.producto.fechaCreacion,
    idCategoria: item.producto.categoria?.idCategoria ?? null,
    nombreCategoria: item.producto.categoria?.nombreCategoria ?? "Sin categoria",
    idSucursal: item.producto.sucursal?.idSucursal ?? null,
    nombreSucursal: item.producto.sucursal?.nombreSucursal ?? "Sin sucursal",
    precioMin: precioBase,
    precioMax: precioBase,
    colores: [
      {
        colorId,
        nombre: item.color?.nombre ?? `Color #${colorId}`,
        hex: item.color?.hex ?? null,
        imagenPrincipal: toProductoResumenImagen(fallbackImage),
        tallas: [
          {
            idProductoVariante: item.idProductoVariante,
            tallaId,
            nombre: item.talla?.nombre ?? `Talla #${tallaId}`,
            sku: item.sku,
            codigoBarras: item.codigoBarras,
            precio: item.precio,
            precioMayor: item.precioMayor,
            precioOferta: item.precioOferta,
            ofertaInicio: item.ofertaInicio,
            ofertaFin: item.ofertaFin,
            stock: item.stock,
            estado: item.estado,
          },
        ],
      },
    ],
  }
}
