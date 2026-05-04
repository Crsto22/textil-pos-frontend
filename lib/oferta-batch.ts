import { authFetch } from "@/lib/auth/auth-fetch"
import {
  convertirFechaHoraLocalParaBackend,
  convertirFechaHoraLocalParaInput,
  normalizarFechaHoraLocal,
} from "@/lib/oferta-utils"
import type {
  OfertaBatchDraftItem,
  OfertaBatchPriceMode,
  OfertaBulkFormDraft,
  OfertaFormDraft,
  ProductoVarianteOfertaLoteItemRequest,
  ProductoVarianteOfertaSucursalItemRequest,
} from "@/lib/types/oferta"
import type { ProductoDetalleVariante } from "@/lib/types/producto"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function parsePrecioOfertaInput(value: string): number | null {
  const normalizedValue = value.trim().replace(",", ".")
  if (normalizedValue === "") return null

  const parsed = Number(normalizedValue)
  return Number.isFinite(parsed) ? parsed : null
}

export function createOfertaFormDraft(
  source?:
    | Pick<ProductoDetalleVariante, "precioOferta" | "ofertaInicio" | "ofertaFin">
    | Pick<OfertaBatchDraftItem, "precioOferta" | "ofertaInicio" | "ofertaFin">
): OfertaFormDraft {
  return {
    precioOfertaInput:
      source && typeof source.precioOferta === "number" ? String(source.precioOferta) : "",
    ofertaInicioInput: convertirFechaHoraLocalParaInput(source?.ofertaInicio),
    ofertaFinInput: convertirFechaHoraLocalParaInput(source?.ofertaFin),
  }
}

export function createOfertaBulkFormDraft(
  source?: Partial<Pick<OfertaBulkFormDraft, "priceMode" | "priceInput" | "schedulePreset">>
): OfertaBulkFormDraft {
  return {
    priceMode: source?.priceMode ?? "PRECIO_FIJO",
    priceInput: source?.priceInput ?? "",
    schedulePreset: source?.schedulePreset ?? "PERSONALIZADO",
    ...createOfertaFormDraft(),
  }
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function resolveOfertaPriceFromMode(
  precioBase: number,
  mode: OfertaBatchPriceMode,
  rawValue: string
): { ok: true; value: number } | { ok: false; message: string } {
  if (!Number.isFinite(precioBase) || precioBase <= 0) {
    return {
      ok: false,
      message: "La variante seleccionada no tiene un precio regular valido.",
    }
  }

  const parsedValue = parsePrecioOfertaInput(rawValue)
  if (parsedValue === null) {
    return {
      ok: false,
      message: "Debe ingresar un valor numerico valido para aplicar la oferta.",
    }
  }

  let precioOferta = parsedValue

  if (mode === "DESCUENTO_PORCENTAJE") {
    if (parsedValue >= 100) {
      return {
        ok: false,
        message: "El porcentaje de descuento debe ser menor a 100.",
      }
    }
    precioOferta = precioBase * (1 - parsedValue / 100)
  }

  if (mode === "DESCUENTO_MONTO") {
    precioOferta = precioBase - parsedValue
  }

  precioOferta = roundCurrency(precioOferta)

  if (precioOferta <= 0) {
    return {
      ok: false,
      message: "El precio oferta resultante debe ser mayor a 0.",
    }
  }

  if (precioOferta >= precioBase) {
    return {
      ok: false,
      message: "El precio oferta resultante debe ser menor al precio regular.",
    }
  }

  return {
    ok: true,
    value: precioOferta,
  }
}

interface BuildOfertaBatchDraftItemParams {
  productoId: number
  productoNombre: string
  variante: ProductoDetalleVariante
  form: OfertaFormDraft
  imageUrl?: string | null
}

export function buildOfertaBatchDraftItem({
  productoId,
  productoNombre,
  variante,
  form,
  imageUrl = null,
}: BuildOfertaBatchDraftItemParams):
  | { ok: true; item: OfertaBatchDraftItem }
  | { ok: false; message: string } {
  const precioOferta = parsePrecioOfertaInput(form.precioOfertaInput)
  const ofertaInicio = normalizarFechaHoraLocal(form.ofertaInicioInput)
  const ofertaFin = normalizarFechaHoraLocal(form.ofertaFinInput)
  const contextLabel = `${productoNombre} / ${variante.colorNombre} / ${variante.tallaNombre}`

  if (precioOferta === null) {
    return {
      ok: false,
      message: `Debe ingresar un precio oferta valido para ${contextLabel}.`,
    }
  }

  if (precioOferta <= 0) {
    return {
      ok: false,
      message: `El precio oferta debe ser mayor a 0 para ${contextLabel}.`,
    }
  }

  if (precioOferta >= variante.precio) {
    return {
      ok: false,
      message: `El precio oferta debe ser menor al precio regular para ${contextLabel}.`,
    }
  }

  if (ofertaInicio === "" || ofertaFin === "") {
    return {
      ok: false,
      message: `Debe completar fecha de inicio y fecha de fin para ${contextLabel}.`,
    }
  }

  const ofertaInicioPayload = convertirFechaHoraLocalParaBackend(ofertaInicio)
  const ofertaFinPayload = convertirFechaHoraLocalParaBackend(ofertaFin)

  if (!ofertaInicioPayload || !ofertaFinPayload) {
    return {
      ok: false,
      message: `La vigencia de oferta no tiene un formato valido para ${contextLabel}.`,
    }
  }

  if (ofertaFinPayload <= ofertaInicioPayload) {
    return {
      ok: false,
      message: `La fecha fin debe ser mayor a la fecha inicio para ${contextLabel}.`,
    }
  }

  return {
    ok: true,
    item: {
      idProductoVariante: variante.idProductoVariante,
      productoId,
      productoNombre,
      sku: variante.sku,
      colorNombre: variante.colorNombre,
      tallaNombre: variante.tallaNombre,
      imageUrl,
      precio: variante.precio,
      precioOferta,
      ofertaInicio: ofertaInicioPayload,
      ofertaFin: ofertaFinPayload,
      modo: typeof variante.precioOferta === "number" ? "ACTUALIZAR" : "CREAR",
    },
  }
}

export function buildOfertaRemovalItems(
  idsProductoVariante: number[]
): ProductoVarianteOfertaLoteItemRequest[] {
  return idsProductoVariante.map((idProductoVariante) => ({
    idProductoVariante,
    precioOferta: null,
    ofertaInicio: null,
    ofertaFin: null,
  }))
}

export async function patchOfertaSucursal(
  idProductoVariante: number,
  idSucursal: number,
  data: { precioOferta: number | null; ofertaInicio: string | null; ofertaFin: string | null }
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const response = await authFetch(
      `/api/variante/oferta/${idProductoVariante}/sucursal/${idSucursal}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    )
    const payload = await parseJsonSafe(response)

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "No se pudo actualizar la oferta de sucursal."
      return { ok: false, message }
    }

    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : data.precioOferta === null
          ? "Oferta de sucursal eliminada correctamente."
          : "Oferta de sucursal actualizada correctamente."

    return { ok: true, message }
  } catch (requestError) {
    return {
      ok: false,
      message:
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar la oferta de sucursal.",
    }
  }
}

export async function patchOfertasSucursalLote(
  items: ProductoVarianteOfertaSucursalItemRequest[]
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const response = await authFetch("/api/variante/ofertas/sucursal/lote", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
    const data = await parseJsonSafe(response)

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "No se pudieron actualizar las ofertas de sucursal."
      return { ok: false, message }
    }

    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Ofertas de sucursal actualizadas correctamente."

    return { ok: true, message }
  } catch (requestError) {
    return {
      ok: false,
      message:
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron actualizar las ofertas de sucursal.",
    }
  }
}

export async function patchOfertasLote(
  items: ProductoVarianteOfertaLoteItemRequest[]
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const response = await authFetch("/api/variante/ofertas/lote", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
    const data = await parseJsonSafe(response)

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "No se pudieron actualizar las ofertas."
      return { ok: false, message }
    }

    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Ofertas actualizadas correctamente."

    return { ok: true, message }
  } catch (requestError) {
    return {
      ok: false,
      message:
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron actualizar las ofertas.",
    }
  }
}
