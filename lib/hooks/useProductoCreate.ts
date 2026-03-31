"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import type { ComboboxOption } from "@/components/ui/combobox"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useCategoriaOptions } from "@/lib/hooks/useCategoriaOptions"
import { useColores } from "@/lib/hooks/useColores"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useTallas } from "@/lib/hooks/useTallas"
import type { CategoriaCreateRequest } from "@/lib/types/categoria"
import type { Color, ColorCreateRequest } from "@/lib/types/color"
import {
  MAX_MEDIA_PER_COLOR,
  type MediaItem,
  type ProductoCreateFormState,
  type VariantEditableField,
  type VariantReadonlyOfferInfo,
  type VariantRow,
  type VariantStatus,
  type VariantValues,
} from "@/lib/types/producto-create"
import type {
  ProductoActualizarCompletoResponse,
  ProductoDetalleResponse,
  ProductoDetalleImagen,
  ProductoImagenCreateRequest,
  ProductoImagenesUploadResponse,
  ProductoInsertarCompletoRequest,
  ProductoInsertarCompletoResponse,
  ProductoVarianteCreateRequest,
} from "@/lib/types/producto"
import type { Talla } from "@/lib/types/talla"
import type { TallaCreateRequest } from "@/lib/types/talla"
import { generateBarcode } from "@/lib/barcode-generator"

function hasValidId(value: number | null | undefined): value is number {
  return typeof value === "number" && value > 0
}

function isActiveEntity(estado: string | undefined) {
  return String(estado ?? "").toUpperCase() === "ACTIVO"
}

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function getResponseMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim() !== ""
  ) {
    return payload.message
  }

  return fallback
}

function isProductoImagenesUploadResponse(
  payload: unknown
): payload is ProductoImagenesUploadResponse {
  if (!payload || typeof payload !== "object") return false
  if (!("colorId" in payload) || !("imagenes" in payload)) return false

  const { colorId, imagenes } = payload

  return (
    typeof colorId === "number" &&
    Array.isArray(imagenes) &&
    imagenes.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "url" in item &&
        "urlThumb" in item &&
        typeof item.url === "string" &&
        typeof item.urlThumb === "string"
    )
  )
}

function isProductoDetalleResponse(payload: unknown): payload is ProductoDetalleResponse {
  if (!payload || typeof payload !== "object") return false
  if (!("producto" in payload) || !("variantes" in payload) || !("imagenes" in payload)) {
    return false
  }

  const { producto, variantes, imagenes } = payload

  return Boolean(
    producto &&
      typeof producto === "object" &&
      "idProducto" in producto &&
      Array.isArray(variantes) &&
      Array.isArray(imagenes)
  )
}

function revokeMedia(media: MediaItem[]) {
  media.forEach((item) => {
    if (item.file) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })
}

function isLocalMedia(item: MediaItem): item is MediaItem & { file: File } {
  return item.file instanceof File
}

function isRemoteMedia(item: MediaItem): item is MediaItem & {
  url: string
  urlThumb: string
} {
  return typeof item.url === "string" && item.url !== "" &&
    typeof item.urlThumb === "string" && item.urlThumb !== ""
}

function toMediaItemFromDetalleImagen(image: ProductoDetalleImagen): MediaItem {
  const fallbackFileName = (() => {
    try {
      const url = new URL(image.url)
      return url.pathname.split("/").pop() || `imagen-${image.idColorImagen}.webp`
    } catch {
      return `imagen-${image.idColorImagen}.webp`
    }
  })()

  return {
    id: `persisted-${image.idColorImagen}`,
    file: null,
    fileName: fallbackFileName,
    previewUrl: image.urlThumb || image.url,
    url: image.url,
    urlThumb: image.urlThumb,
    idColorImagen: image.idColorImagen,
  }
}

function parsePrecio(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

function parsePrecioMayor(value: string) {
  if (value.trim() === "") {
    return { value: null, invalid: false }
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, invalid: true }
  }

  return { value: parsed, invalid: false }
}

function parseStock(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

const SKU_SEGMENT_LENGTH = 3
const SKU_SEQUENCE_LENGTH = 3

function normalizeSkuCharacters(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function buildSkuFixedSegment(value: string, fallback: string): string {
  const token = normalizeSkuCharacters(value).slice(0, SKU_SEGMENT_LENGTH)
  return token !== "" ? token : fallback
}

function buildSkuTallaSegment(value: string): string {
  const token = normalizeSkuCharacters(value)
  return token !== "" ? token : "TAL"
}

function formatSkuSequence(sequence: number): string {
  const safeSequence = Number.isFinite(sequence) ? Math.max(1, Math.trunc(sequence)) : 1
  return String(safeSequence).padStart(SKU_SEQUENCE_LENGTH, "0")
}

function extractSkuSequence(value: string): number | null {
  const match = value.trim().toUpperCase().match(/-(\d{3})$/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function collectSkuStrings(value: unknown): string[] {
  const collected = new Set<string>()

  const visit = (current: unknown) => {
    if (Array.isArray(current)) {
      current.forEach(visit)
      return
    }

    if (!current || typeof current !== "object") return

    Object.entries(current).forEach(([key, nestedValue]) => {
      if (key === "sku" && typeof nestedValue === "string" && nestedValue.trim() !== "") {
        collected.add(nestedValue.trim())
      }

      visit(nestedValue)
    })
  }

  visit(value)

  return Array.from(collected)
}

function getNextSkuSequenceFromPayload(payload: unknown): number {
  return (
    collectSkuStrings(payload).reduce((maxSequence, sku) => {
      const sequence = extractSkuSequence(sku)
      if (sequence === null) return maxSequence
      return Math.max(maxSequence, sequence)
    }, 0) + 1
  )
}

function buildAutoSkuBase(
  productName: string,
  colorName: string,
  tallaName: string
): string {
  return [
    buildSkuFixedSegment(productName, "PRO"),
    buildSkuFixedSegment(colorName, "COL"),
    buildSkuTallaSegment(tallaName),
  ].join("-")
}

interface VariantDraftState {
  sku: string
  precio: string
  precioMayor: string
  stock: string
  isEmpty: boolean
  missingFields: string[]
}

function getVariantDraftState(
  variant: Pick<VariantRow, "sku" | "precio" | "precioMayor" | "stock">
): VariantDraftState {
  const sku = variant.sku.trim()
  const precio = variant.precio.trim()
  const precioMayor = variant.precioMayor.trim()
  const stock = variant.stock.trim()

  const requiredFields = [
    { label: "SKU", value: sku },
    { label: "precio", value: precio },
    { label: "stock", value: stock },
  ]
  const allFields = [...requiredFields, { label: "precio por mayor", value: precioMayor }]
  const filledRequiredFields = requiredFields.filter((field) => field.value !== "")
  const hasAnyValue = allFields.some((field) => field.value !== "")

  return {
    sku,
    precio,
    precioMayor,
    stock,
    isEmpty: !hasAnyValue,
    missingFields:
      !hasAnyValue || filledRequiredFields.length === requiredFields.length
        ? []
        : requiredFields
            .filter((field) => field.value === "")
            .map((field) => field.label),
  }
}

function formatRequiredFields(fields: string[]): string {
  if (fields.length === 0) return ""
  if (fields.length === 1) return fields[0]
  if (fields.length === 2) return `${fields[0]} y ${fields[1]}`
  return `${fields.slice(0, -1).join(", ")} y ${fields.at(-1)}`
}

function formatVariantCombinationLabel(variant: Pick<VariantRow, "color" | "talla">): string {
  return `${variant.color.nombre} - Talla ${variant.talla.nombre}`
}

function createEmptyVariantValues(): VariantValues {
  return {
    idProductoVariante: null,
    estado: "ACTIVO",
    sku: "",
    codigoBarras: "",
    precio: "",
    precioMayor: "",
    stock: "",
  }
}

function normalizeVariantStatus(value: string | null | undefined): VariantStatus {
  const normalized = String(value ?? "").trim().toUpperCase()
  return normalized.startsWith("INACTIV") ? "INACTIVO" : "ACTIVO"
}

function normalizeVariantValues(
  values: Partial<VariantValues> | undefined
): VariantValues {
  const base = createEmptyVariantValues()
  if (!values) return base

  return {
    ...base,
    ...values,
    idProductoVariante:
      typeof values.idProductoVariante === "number" ? values.idProductoVariante : null,
    estado: normalizeVariantStatus(values.estado),
    sku: typeof values.sku === "string" ? values.sku : "",
    codigoBarras: typeof values.codigoBarras === "string" ? values.codigoBarras : "",
    precio: typeof values.precio === "string" ? values.precio : "",
    precioMayor: typeof values.precioMayor === "string" ? values.precioMayor : "",
    stock: typeof values.stock === "string" ? values.stock : "",
  }
}

function mergeCatalogById<T>(
  previous: Record<number, T>,
  values: T[],
  getId: (value: T) => number
) {
  if (values.length === 0) return previous

  let changed = false
  const next = { ...previous }

  values.forEach((value) => {
    const id = getId(value)
    if (!hasValidId(id)) return

    if (!next[id] || next[id] !== value) {
      next[id] = value
      changed = true
    }
  })

  return changed ? next : previous
}

function normalizeMediaByColor(
  mediaByColor: Record<number, MediaItem[]>,
  selectedColorIds: number[]
) {
  const selectedIds = new Set(selectedColorIds)
  const normalized: Record<number, MediaItem[]> = {}

  Object.entries(mediaByColor).forEach(([colorId, media]) => {
    const parsedColorId = Number(colorId)
    if (!selectedIds.has(parsedColorId)) return
    normalized[parsedColorId] = media.slice(0, MAX_MEDIA_PER_COLOR)
  })

  return normalized
}

function buildVariantKey(idColor: number, idTalla: number) {
  return `${idColor}-${idTalla}`
}

function buildAutoSkuByVariantKey(
  selectedColors: Color[],
  selectedTallas: Talla[],
  productName: string,
  variantValues: Record<string, VariantValues>,
  startingSequence: number
): Record<string, string> {
  const skuByVariantKey: Record<string, string> = {}
  let nextSequence = Math.max(1, Math.trunc(startingSequence))

  selectedColors.forEach((color) => {
    selectedTallas.forEach((talla) => {
      const variantKey = buildVariantKey(color.idColor, talla.idTalla)

      const currentValues = normalizeVariantValues(variantValues[variantKey])
      const shouldPreserveExistingSku =
        hasValidId(currentValues.idProductoVariante) && currentValues.sku.trim() !== ""

      if (shouldPreserveExistingSku) return

      const baseSku = buildAutoSkuBase(productName, color.nombre, talla.nombre)

      skuByVariantKey[variantKey] = `${baseSku}-${formatSkuSequence(nextSequence)}`
      nextSequence += 1
    })
  })

  return skuByVariantKey
}

function hasBlockingAttributeData(
  variant: Pick<
    VariantRow,
    "idProductoVariante" | "sku" | "precio" | "precioMayor" | "stock" | "estado" | "readonlyOffer"
  >,
  isAutoSkuEnabled: boolean
): boolean {
  if (variant.estado === "INACTIVO") return false

  const draftState = getVariantDraftState(variant)
  const hasManualSku =
    draftState.sku !== "" && (!isAutoSkuEnabled || hasValidId(variant.idProductoVariante))
  const hasPriceOrStockData =
    draftState.precio !== "" || draftState.precioMayor !== "" || draftState.stock !== ""
  const hasReadonlyOffer = Boolean(variant.readonlyOffer)

  return hasManualSku || hasPriceOrStockData || hasReadonlyOffer
}

interface UseProductoCreateOptions {
  productoId?: number | null
}

export function useProductoCreate({ productoId = null }: UseProductoCreateOptions = {}) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const isEditing = hasValidId(productoId)

  const [form, setForm] = useState<ProductoCreateFormState>({
    idSucursal: isAdmin ? null : user?.idSucursal ?? null,
    idCategoria: null,
    nombre: "",
    descripcion: "",
  })
  const [loadingDetalle, setLoadingDetalle] = useState(isEditing)
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      setForm((previous) => ({
        ...previous,
        idSucursal: user?.idSucursal ?? null,
      }))
    }
  }, [isAdmin, user?.idSucursal])

  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

  const selectedSucursalId = isAdmin ? form.idSucursal : user?.idSucursal ?? null

  const {
    categorias,
    loadingCategorias,
    errorCategorias,
    searchCategoria,
    setSearchCategoria,
    createCategoriaAndReturn,
  } = useCategoriaOptions(hasValidId(selectedSucursalId), selectedSucursalId)

  const {
    displayedColores,
    displayedTotalPages: colorTotalPages,
    displayedTotalElements: colorTotalElements,
    displayedPage: colorPage,
    displayedLoading: loadingColores,
    search: searchColor,
    setSearch: setSearchColor,
    setDisplayedPage: setColorPage,
    error: errorColores,
    createColorAndReturn,
  } = useColores()

  const {
    displayedTallas,
    displayedTotalPages: tallaTotalPages,
    displayedTotalElements: tallaTotalElements,
    displayedPage: tallaPage,
    displayedLoading: loadingTallas,
    search: searchTalla,
    setSearch: setSearchTalla,
    setDisplayedPage: setTallaPage,
    error: errorTallas,
    createTallaAndReturn,
  } = useTallas()

  const availableColors = useMemo(() => {
    const activeColors = displayedColores.filter((color) => isActiveEntity(color.estado))
    return activeColors.length > 0 ? activeColors : displayedColores
  }, [displayedColores])

  const availableTallas = useMemo(() => {
    const activeTallas = displayedTallas.filter((talla) => isActiveEntity(talla.estado))
    return activeTallas.length > 0 ? activeTallas : displayedTallas
  }, [displayedTallas])

  const loadingAtributos = loadingColores || loadingTallas
  const errorAtributos = errorColores ?? errorTallas

  const hasValidSucursal = hasValidId(form.idSucursal)
  const hasValidCategoria = hasValidId(form.idCategoria)

  const categoriaMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.idCategoria, categoria])),
    [categorias]
  )

  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([])
  const [selectedTallaIds, setSelectedTallaIds] = useState<number[]>([])
  const [focusedColorId, setFocusedColorId] = useState<number | null>(null)

  const [selectedColorCatalog, setSelectedColorCatalog] = useState<Record<number, Color>>({})
  const [selectedTallaCatalog, setSelectedTallaCatalog] = useState<Record<number, Talla>>({})

  useEffect(() => {
    setSelectedColorCatalog((previous) =>
      mergeCatalogById(previous, availableColors, (color) => color.idColor)
    )
  }, [availableColors])

  useEffect(() => {
    setSelectedTallaCatalog((previous) =>
      mergeCatalogById(previous, availableTallas, (talla) => talla.idTalla)
    )
  }, [availableTallas])

  useEffect(() => {
    if (selectedColorIds.length === 0) {
      setFocusedColorId(null)
      return
    }

    if (!hasValidId(focusedColorId) || !selectedColorIds.includes(focusedColorId)) {
      setFocusedColorId(selectedColorIds[0])
    }
  }, [focusedColorId, selectedColorIds])

  const selectColor = useCallback((color: Color) => {
    setSelectedColorCatalog((previous) => ({
      ...previous,
      [color.idColor]: color,
    }))
    setSelectedColorIds((previous) =>
      previous.includes(color.idColor) ? previous : [...previous, color.idColor]
    )
    setFocusedColorId(color.idColor)
  }, [])

  const selectTalla = useCallback((talla: Talla) => {
    setSelectedTallaCatalog((previous) => ({
      ...previous,
      [talla.idTalla]: talla,
    }))
    setSelectedTallaIds((previous) =>
      previous.includes(talla.idTalla) ? previous : [...previous, talla.idTalla]
    )
  }, [])

  const selectedColors = useMemo(
    () =>
      selectedColorIds
        .map((idColor) => selectedColorCatalog[idColor])
        .filter((color): color is Color => Boolean(color)),
    [selectedColorCatalog, selectedColorIds]
  )

  const selectedTallas = useMemo(
    () =>
      selectedTallaIds
        .map((idTalla) => selectedTallaCatalog[idTalla])
        .filter((talla): talla is Talla => Boolean(talla)),
    [selectedTallaCatalog, selectedTallaIds]
  )

  const [mediaByColor, setMediaByColor] = useState<Record<number, MediaItem[]>>({})
  const mediaRef = useRef<Record<number, MediaItem[]>>(mediaByColor)

  useEffect(() => {
    mediaRef.current = mediaByColor
  }, [mediaByColor])

  useEffect(() => {
    return () => {
      Object.values(mediaRef.current).forEach((media) => revokeMedia(media))
    }
  }, [])

  useEffect(() => {
    setMediaByColor((previous) => {
      const selectedIds = new Set(selectedColorIds)
      let changed = false
      const next: Record<number, MediaItem[]> = {}

      for (const [colorId, media] of Object.entries(previous)) {
        const parsedColorId = Number(colorId)
        if (selectedIds.has(parsedColorId)) {
          next[parsedColorId] = media
          continue
        }

        revokeMedia(media)
        changed = true
      }

      return changed ? next : previous
    })
  }, [selectedColorIds])

  const replaceMediaByColor = useCallback(
    (nextMediaByColor: Record<number, MediaItem[]>) => {
      setMediaByColor((previous) => {
        const normalized = normalizeMediaByColor(nextMediaByColor, selectedColorIds)
        const nextIds = new Set<string>()

        Object.values(normalized).forEach((media) => {
          media.forEach((item) => {
            nextIds.add(item.id)
          })
        })

        Object.values(previous).forEach((media) => {
          media.forEach((item) => {
            if (!nextIds.has(item.id)) {
              if (item.file) {
                URL.revokeObjectURL(item.previewUrl)
              }
            }
          })
        })

        return normalized
      })
    },
    [selectedColorIds]
  )

  const handleCreateColor = useCallback(
    async (payload: ColorCreateRequest) => {
      const result = await createColorAndReturn(payload)
      if (!result.success) return false

      if (result.color) {
        selectColor(result.color)
      }

      return true
    },
    [createColorAndReturn, selectColor]
  )

  const handleCreateTalla = useCallback(
    async (payload: TallaCreateRequest) => {
      const result = await createTallaAndReturn(payload)
      if (!result.success) return false

      if (result.talla) {
        selectTalla(result.talla)
      }

      return true
    },
    [createTallaAndReturn, selectTalla]
  )

  const [variantValues, setVariantValues] = useState<Record<string, VariantValues>>({})
  const [variantReadonlyOffers, setVariantReadonlyOffers] = useState<
    Record<string, VariantReadonlyOfferInfo | null>
  >({})
  const [inactiveVariantKeys, setInactiveVariantKeys] = useState<string[]>([])
  const [deletingVariantKeys, setDeletingVariantKeys] = useState<string[]>([])
  const [isAutoSkuEnabled, setIsAutoSkuEnabled] = useState(!isEditing)
  const [isAutoBarcodeEnabled, setIsAutoBarcodeEnabled] = useState(!isEditing)
  const [nextAutoSkuSequenceSeed, setNextAutoSkuSequenceSeed] = useState(1)

  const loadNextAutoSkuSequence = useCallback(
    async (signal?: AbortSignal) => {
      const response = await authFetch("/api/variante/listar", {
        signal,
        cache: "no-store",
      })
      const payload = await parseJsonSafe(response)

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "No se pudo obtener la secuencia actual de SKU")
        )
      }

      const nextSequence = getNextSkuSequenceFromPayload(payload)
      setNextAutoSkuSequenceSeed(nextSequence)

      return nextSequence
    },
    []
  )

  useEffect(() => {
    const controller = new AbortController()

    void loadNextAutoSkuSequence(controller.signal).catch((requestError) => {
      if (isAbortError(requestError)) return
      console.error("[SKU/AUTO-SEQUENCE]", requestError)
    })

    return () => {
      controller.abort()
    }
  }, [loadNextAutoSkuSequence])

  useEffect(() => {
    if (!isEditing || !hasValidId(productoId)) {
      setLoadingDetalle(false)
      setErrorDetalle(null)
      return
    }

    const controller = new AbortController()

    const loadDetalle = async () => {
      setLoadingDetalle(true)
      setErrorDetalle(null)

      try {
        const response = await authFetch(`/api/producto/detalle/${productoId}`, {
          signal: controller.signal,
        })
        const payload = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          throw new Error(
            getResponseMessage(payload, "No se pudo cargar el detalle del producto")
          )
        }

        if (!isProductoDetalleResponse(payload)) {
          throw new Error("La respuesta del detalle de producto no tiene el formato esperado")
        }

        const detailColorCatalog: Record<number, Color> = {}
        const detailTallaCatalog: Record<number, Talla> = {}
        const nextSelectedColorIds: number[] = []
        const nextSelectedTallaIds: number[] = []
        const nextVariantValues: Record<string, VariantValues> = {}
        const nextVariantReadonlyOffers: Record<string, VariantReadonlyOfferInfo | null> = {}
        const nextInactiveVariantKeys: string[] = []
        const nextMediaByColor: Record<number, MediaItem[]> = {}

        const pushUniqueId = (list: number[], value: number) => {
          if (hasValidId(value) && !list.includes(value)) {
            list.push(value)
          }
        }

        payload.variantes.forEach((variant) => {
          pushUniqueId(nextSelectedColorIds, variant.colorId)
          pushUniqueId(nextSelectedTallaIds, variant.tallaId)

          detailColorCatalog[variant.colorId] = {
            idColor: variant.colorId,
            nombre: variant.colorNombre,
            codigo: variant.colorHex,
            estado: variant.estado ?? "ACTIVO",
          }

          detailTallaCatalog[variant.tallaId] = {
            idTalla: variant.tallaId,
            nombre: variant.tallaNombre,
            estado: variant.estado ?? "ACTIVO",
          }

          const variantKey = buildVariantKey(variant.colorId, variant.tallaId)

          nextVariantValues[variantKey] = {
            idProductoVariante: variant.idProductoVariante,
            estado: normalizeVariantStatus(variant.estado),
            sku: variant.sku ?? "",
            codigoBarras: variant.codigoBarras ?? "",
            precio: String(variant.precio),
            precioMayor:
              typeof variant.precioMayor === "number" && variant.precioMayor > 0
                ? String(variant.precioMayor)
                : "",
            stock: String(variant.stock),
          }

          if (normalizeVariantStatus(variant.estado) === "INACTIVO") {
            nextInactiveVariantKeys.push(variantKey)
          }

          nextVariantReadonlyOffers[variantKey] =
            typeof variant.precioOferta === "number" && variant.precioOferta > 0
              ? {
                  precioBase: variant.precio,
                  precioOferta: variant.precioOferta,
                  ofertaInicio: variant.ofertaInicio,
                  ofertaFin: variant.ofertaFin,
                }
              : null
        })

        payload.imagenes
          .slice()
          .sort((a, b) => {
            if (a.colorId !== b.colorId) return a.colorId - b.colorId
            return a.orden - b.orden
          })
          .forEach((image) => {
            pushUniqueId(nextSelectedColorIds, image.colorId)
            if (!detailColorCatalog[image.colorId]) {
              detailColorCatalog[image.colorId] = {
                idColor: image.colorId,
                nombre: image.colorNombre,
                codigo: image.colorHex,
                estado: image.estado ?? "ACTIVO",
              }
            }

            const currentMedia = nextMediaByColor[image.colorId] ?? []
            if (currentMedia.length >= MAX_MEDIA_PER_COLOR) return
            nextMediaByColor[image.colorId] = [
              ...currentMedia,
              toMediaItemFromDetalleImagen(image),
            ]
          })

        const initialInactiveVariantKeys = new Set(nextInactiveVariantKeys)
        nextSelectedColorIds.forEach((idColor) => {
          nextSelectedTallaIds.forEach((idTalla) => {
            const variantKey = buildVariantKey(idColor, idTalla)
            const values = normalizeVariantValues(nextVariantValues[variantKey])

            if (getVariantDraftState(values).isEmpty) {
              initialInactiveVariantKeys.add(variantKey)
            }
          })
        })

        setForm((previous) => ({
          ...previous,
          idSucursal: isAdmin
            ? payload.producto.idSucursal ?? null
            : user?.idSucursal ?? payload.producto.idSucursal ?? null,
          idCategoria: payload.producto.idCategoria ?? null,
          nombre: payload.producto.nombre ?? "",
          descripcion: payload.producto.descripcion ?? "",
        }))
        setSelectedColorCatalog((previous) => ({ ...previous, ...detailColorCatalog }))
        setSelectedTallaCatalog((previous) => ({ ...previous, ...detailTallaCatalog }))
        setSelectedColorIds(nextSelectedColorIds)
        setSelectedTallaIds(nextSelectedTallaIds)
        setVariantValues(nextVariantValues)
        setVariantReadonlyOffers(nextVariantReadonlyOffers)
        setInactiveVariantKeys(Array.from(initialInactiveVariantKeys))
        setDeletingVariantKeys([])
        setMediaByColor((previous) => {
          Object.values(previous).forEach((media) => revokeMedia(media))
          return nextMediaByColor
        })
        setFocusedColorId(nextSelectedColorIds[0] ?? null)
        setErrorDetalle(null)
      } catch (requestError) {
        if (isAbortError(requestError)) return
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el detalle del producto"
        setErrorDetalle(message)
        toast.error(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDetalle(false)
        }
      }
    }

    void loadDetalle()

    return () => {
      controller.abort()
    }
  }, [isAdmin, isEditing, productoId, user?.idSucursal])

  useEffect(() => {
    const allowedKeys = new Set<string>()
    selectedColorIds.forEach((idColor) => {
      selectedTallaIds.forEach((idTalla) => {
        allowedKeys.add(`${idColor}-${idTalla}`)
      })
    })

    setVariantValues((previous) => {
      let changed = false
      const next: Record<string, VariantValues> = {}

      for (const [key, value] of Object.entries(previous)) {
        if (allowedKeys.has(key)) {
          next[key] = value
          continue
        }
        changed = true
      }

      return changed ? next : previous
    })

    setVariantReadonlyOffers((previous) => {
      let changed = false
      const next: Record<string, VariantReadonlyOfferInfo | null> = {}

      for (const [key, value] of Object.entries(previous)) {
        if (allowedKeys.has(key)) {
          next[key] = value
          continue
        }
        changed = true
      }

      return changed ? next : previous
    })

    setInactiveVariantKeys((previous) => {
      const next = previous.filter((key) => allowedKeys.has(key))
      return next.length === previous.length ? previous : next
    })
  }, [selectedColorIds, selectedTallaIds])

  useEffect(() => {
    if (!isAutoSkuEnabled) return

    const autoSkuByVariantKey = buildAutoSkuByVariantKey(
      selectedColors,
      selectedTallas,
      form.nombre,
      variantValues,
      nextAutoSkuSequenceSeed
    )
    const autoSkuEntries = Object.entries(autoSkuByVariantKey)

    if (autoSkuEntries.length === 0) return

    setVariantValues((previous) => {
      let changed = false
      const next: Record<string, VariantValues> = { ...previous }

      autoSkuEntries.forEach(([variantKey, sku]) => {
        const current = normalizeVariantValues(next[variantKey])
        if (current.sku === sku) return

        next[variantKey] = {
          ...current,
          sku,
        }
        changed = true
      })

      return changed ? next : previous
    })
  }, [
    form.nombre,
    isAutoSkuEnabled,
    nextAutoSkuSequenceSeed,
    selectedColors,
    selectedTallas,
    variantValues,
  ])

  useEffect(() => {
    if (!isAutoBarcodeEnabled) return

    const variantKeys: string[] = []
    selectedColors.forEach((color) => {
      selectedTallas.forEach((talla) => {
        variantKeys.push(`${color.idColor}-${talla.idTalla}`)
      })
    })

    if (variantKeys.length === 0) return

    setVariantValues((previous) => {
      let changed = false
      const next: Record<string, VariantValues> = { ...previous }

      variantKeys.forEach((variantKey) => {
        const current = normalizeVariantValues(next[variantKey])
        if (current.codigoBarras && current.codigoBarras.trim() !== "") return

        next[variantKey] = {
          ...current,
          codigoBarras: generateBarcode(),
        }
        changed = true
      })

      return changed ? next : previous
    })
  }, [isAutoBarcodeEnabled, selectedColors, selectedTallas])

  const variantRows = useMemo<VariantRow[]>(() => {
    const rows: VariantRow[] = []
    const inactiveKeys = new Set(inactiveVariantKeys)

    selectedColors.forEach((color) => {
      selectedTallas.forEach((talla) => {
        const key = `${color.idColor}-${talla.idTalla}`
        const values = normalizeVariantValues(variantValues[key])

        rows.push({
          key,
          idProductoVariante: values.idProductoVariante ?? null,
          estado: inactiveKeys.has(key) ? "INACTIVO" : values.estado,
          color,
          talla,
          sku: values.sku,
          codigoBarras: values.codigoBarras,
          precio: values.precio,
          precioMayor: values.precioMayor,
          stock: values.stock,
          readonlyOffer: variantReadonlyOffers[key] ?? null,
        })
      })
    })

    return rows
  }, [inactiveVariantKeys, selectedColors, selectedTallas, variantReadonlyOffers, variantValues])

  const handleVariantFieldChange = useCallback(
    (key: string, field: VariantEditableField, value: string) => {
      if (field === "sku" && isAutoSkuEnabled) {
        return
      }
      if (field === "codigoBarras" && isAutoBarcodeEnabled) {
        return
      }

      setVariantValues((previous) => {
        const current = normalizeVariantValues(previous[key])

        return {
          ...previous,
          [key]: {
            ...current,
            [field]: value,
          },
        }
      })
    },
    [isAutoSkuEnabled, isAutoBarcodeEnabled]
  )

  const [generatingBarcodeKeys, setGeneratingBarcodeKeys] = useState<Set<string>>(
    () => new Set()
  )

  const handleGenerateBarcode = useCallback(
    (variantKey: string) => {
      if (isAutoBarcodeEnabled) return

      const codigoBarras = generateBarcode()

      setVariantValues((previous) => {
        const current = normalizeVariantValues(previous[variantKey])
        return {
          ...previous,
          [variantKey]: { ...current, codigoBarras },
        }
      })

      toast.success("Código de barras generado")
    },
    [isAutoBarcodeEnabled]
  )

  const handleAutoSkuToggle = useCallback((enabled: boolean) => {
    setIsAutoSkuEnabled(enabled)
  }, [])

  const handleAutoBarcodeToggle = useCallback((enabled: boolean) => {
    setIsAutoBarcodeEnabled(enabled)
  }, [])

  const handleApplyVariantFieldToAll = useCallback(
    (
      field: Extract<VariantEditableField, "precio" | "precioMayor" | "stock">,
      value: string,
      variantKeys?: string[]
    ) => {
      if (variantRows.length === 0) return
      const targetVariantKeys = new Set(variantKeys ?? variantRows.map((variant) => variant.key))
      if (targetVariantKeys.size === 0) return

      setVariantValues((previous) => {
        const next = { ...previous }
        let changed = false

        variantRows.forEach((variant) => {
          if (!targetVariantKeys.has(variant.key)) return
          if (variant.estado === "INACTIVO") return
          const current = normalizeVariantValues(next[variant.key])

          next[variant.key] = {
            ...current,
            [field]: value,
          }
          changed = true
        })

        return changed ? next : previous
      })
    },
    [variantRows]
  )

  const handleSetVariantStatus = useCallback((key: string, status: VariantStatus) => {
    const targetVariant = variantRows.find((variant) => variant.key === key) ?? null

    setVariantValues((previous) => {
      const current = normalizeVariantValues(previous[key])

      return {
        ...previous,
        [key]: {
          ...current,
          estado: status,
        },
      }
    })

    setInactiveVariantKeys((previous) => {
      const next = new Set(previous)
      if (status === "INACTIVO") {
        next.add(key)
      } else {
        next.delete(key)
      }

      if (next.size === previous.length && previous.every((item) => next.has(item))) {
        return previous
      }

      return Array.from(next)
    })

    if (status === "INACTIVO" && targetVariant) {
      const colorRows = variantRows.filter(
        (variant) => variant.color.idColor === targetVariant.color.idColor
      )
      const willDeactivateColor =
        colorRows.length > 0 &&
        colorRows.every((variant) =>
          variant.key === key ? true : variant.estado === "INACTIVO"
        )

      if (willDeactivateColor) {
        setSelectedColorIds((previous) =>
          previous.filter((idColor) => idColor !== targetVariant.color.idColor)
        )
      }
    }
  }, [variantRows])

  const toggleColorSelection = useCallback(
    (idColor: number) => {
      const isSelected = selectedColorIds.includes(idColor)

      if (isSelected) {
        const blockingVariants = variantRows.filter(
          (variant) =>
            variant.color.idColor === idColor &&
            hasBlockingAttributeData(variant, isAutoSkuEnabled)
        )

        if (blockingVariants.length > 0) {
          const colorName =
            selectedColorCatalog[idColor]?.nombre ??
            availableColors.find((item) => item.idColor === idColor)?.nombre ??
            `Color #${idColor}`

          toast.error(
            `No se puede quitar el color ${colorName}. Estas combinaciones tienen datos activos: ${blockingVariants
              .map((variant) => formatVariantCombinationLabel(variant))
              .join(", ")}. Limpia sus datos o deshabilita esas variantes primero.`
          )
          return
        }

        setSelectedColorIds((previous) => previous.filter((id) => id !== idColor))
        return
      }

      setSelectedColorIds((previous) =>
        previous.includes(idColor) ? previous : [...previous, idColor]
      )

      const color = availableColors.find((item) => item.idColor === idColor)
      if (color) {
        setSelectedColorCatalog((previous) => ({
          ...previous,
          [idColor]: color,
        }))
      }
    },
    [availableColors, isAutoSkuEnabled, selectedColorCatalog, selectedColorIds, variantRows]
  )

  const toggleTallaSelection = useCallback(
    (idTalla: number) => {
      const isSelected = selectedTallaIds.includes(idTalla)

      if (isSelected) {
        const blockingVariants = variantRows.filter(
          (variant) =>
            variant.talla.idTalla === idTalla &&
            hasBlockingAttributeData(variant, isAutoSkuEnabled)
        )

        if (blockingVariants.length > 0) {
          const tallaName =
            selectedTallaCatalog[idTalla]?.nombre ??
            availableTallas.find((item) => item.idTalla === idTalla)?.nombre ??
            `Talla #${idTalla}`

          toast.error(
            `No se puede quitar la talla ${tallaName}. Estas combinaciones tienen datos activos: ${blockingVariants
              .map((variant) => formatVariantCombinationLabel(variant))
              .join(", ")}. Limpia sus datos o deshabilita esas variantes primero.`
          )
          return
        }

        setSelectedTallaIds((previous) => previous.filter((id) => id !== idTalla))
        return
      }

      setSelectedTallaIds((previous) =>
        previous.includes(idTalla) ? previous : [...previous, idTalla]
      )

      const talla = availableTallas.find((item) => item.idTalla === idTalla)
      if (talla) {
        setSelectedTallaCatalog((previous) => ({
          ...previous,
          [idTalla]: talla,
        }))
      }
    },
    [availableTallas, isAutoSkuEnabled, selectedTallaCatalog, selectedTallaIds, variantRows]
  )

  const handleRemoveVariant = useCallback(
    async (key: string): Promise<boolean> => {
      const variant = variantRows.find((item) => item.key === key)
      if (!variant) return false

      const variantId = variant.idProductoVariante
      const isPersistedVariant = hasValidId(variantId)

      if (!isPersistedVariant) {
        handleSetVariantStatus(key, "INACTIVO")
        return true
      }

      if (deletingVariantKeys.includes(key)) return false

      setDeletingVariantKeys((previous) =>
        previous.includes(key) ? previous : [...previous, key]
      )

      try {
        const response = await authFetch(`/api/variante/eliminar/${variantId}`, {
          method: "DELETE",
        })
        const payload = await parseJsonSafe(response)

        if (!response.ok) {
          toast.error(
            getResponseMessage(
              payload,
              `No se pudo eliminar la variante ${variant.color.nombre}/${variant.talla.nombre}`
            )
          )
          return false
        }

        handleSetVariantStatus(key, "INACTIVO")
        toast.success(getResponseMessage(payload, "Variante eliminada logicamente"))
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Error inesperado al eliminar variante"
        toast.error(message)
        return false
      } finally {
        setDeletingVariantKeys((previous) =>
          previous.filter((variantKey) => variantKey !== key)
        )
      }
    },
    [deletingVariantKeys, handleSetVariantStatus, variantRows]
  )

  const selectedCategoriaName = hasValidId(form.idCategoria)
    ? categoriaMap.get(form.idCategoria)?.nombreCategoria
    : undefined

  const totalSelectedMedia = useMemo(
    () =>
      selectedColorIds.reduce(
        (accumulator, colorId) => accumulator + (mediaByColor[colorId]?.length ?? 0),
        0
      ),
    [mediaByColor, selectedColorIds]
  )

  const handleSucursalChange = useCallback(
    (value: string) => {
      const idSucursal = Number(value)
      setForm((previous) => ({
        ...previous,
        idSucursal: Number.isFinite(idSucursal) ? idSucursal : null,
        idCategoria: null,
      }))
      setSearchCategoria("")
    },
    [setSearchCategoria]
  )

  const handleCategoriaChange = useCallback((value: string) => {
    const idCategoria = Number(value)
    setForm((previous) => ({
      ...previous,
      idCategoria: Number.isFinite(idCategoria) ? idCategoria : null,
    }))
  }, [])

  const handleNombreChange = useCallback((value: string) => {
    setForm((previous) => ({ ...previous, nombre: value }))
  }, [])

  const handleDescripcionChange = useCallback((value: string) => {
    setForm((previous) => ({ ...previous, descripcion: value }))
  }, [])

  const handleCreateCategoria = useCallback(
    async (payload: CategoriaCreateRequest) => {
      const result = await createCategoriaAndReturn(payload)
      if (!result.success) return false

      if (result.categoria) {
        setForm((previous) => ({
          ...previous,
          idCategoria: result.categoria?.idCategoria ?? previous.idCategoria,
        }))
        setSearchCategoria("")
      } else {
        setSearchCategoria(payload.nombreCategoria.trim())
      }

      return true
    },
    [createCategoriaAndReturn, setSearchCategoria]
  )

  const [isSaving, setIsSaving] = useState(false)

  const saveProducto = useCallback(async () => {
    if (isSaving) return false

    const idSucursal = selectedSucursalId
    if (!hasValidId(idSucursal)) {
      toast.error("Debe seleccionar una sucursal")
      return false
    }

    const idCategoria = form.idCategoria
    if (!hasValidId(idCategoria)) {
      toast.error("Debe seleccionar una categoria")
      return false
    }

    const nombre = form.nombre.trim()
    const descripcion = form.descripcion.trim()

    if (nombre === "") {
      toast.error("El nombre del producto es obligatorio")
      return false
    }

    if (selectedColors.length === 0) {
      toast.error("Debe seleccionar al menos un color")
      return false
    }

    if (selectedTallas.length === 0) {
      toast.error("Debe seleccionar al menos una talla")
      return false
    }

    if (variantRows.length === 0) {
      toast.error("Debe registrar al menos una variante")
      return false
    }

    let autoSkuByVariantKeyForSave: Record<string, string> = {}

    if (isAutoSkuEnabled) {
      try {
        const nextSequence = await loadNextAutoSkuSequence()
        autoSkuByVariantKeyForSave = buildAutoSkuByVariantKey(
          selectedColors,
          selectedTallas,
          nombre,
          variantValues,
          nextSequence
        )

        const autoSkuEntries = Object.entries(autoSkuByVariantKeyForSave)
        if (autoSkuEntries.length > 0) {
          setVariantValues((previous) => {
            let changed = false
            const next = { ...previous }

            autoSkuEntries.forEach(([variantKey, sku]) => {
              const current = normalizeVariantValues(next[variantKey])
              if (current.sku === sku) return

              next[variantKey] = {
                ...current,
                sku,
              }
              changed = true
            })

            return changed ? next : previous
          })
        }
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo validar la secuencia de SKU"
        toast.error(message)
        return false
      }
    }

    const variantes: ProductoVarianteCreateRequest[] = []
    const seenSkus = new Set<string>()
    const effectiveVariantRows = variantRows.map((variant) => ({
      ...variant,
      sku: autoSkuByVariantKeyForSave[variant.key] ?? variant.sku,
    }))

    for (const variant of effectiveVariantRows) {
      const draftState = getVariantDraftState(variant)
      const isInactiveVariant = variant.estado === "INACTIVO"

      if (draftState.isEmpty) {
        continue
      }

      if (draftState.missingFields.length > 0) {
        toast.error(
          isInactiveVariant
            ? `La variante inactiva ${variant.color.nombre}/${variant.talla.nombre} conserva datos incompletos. Completa ${formatRequiredFields(draftState.missingFields)} o habilitala nuevamente antes de guardar.`
            : `Falta agregar ${formatRequiredFields(draftState.missingFields)} para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const sku = draftState.sku

      const normalizedSku = sku.toUpperCase()
      if (seenSkus.has(normalizedSku)) {
        toast.error(`No puede repetir SKU dentro del mismo producto (${sku})`)
        return false
      }
      seenSkus.add(normalizedSku)

      const precio = parsePrecio(draftState.precio)
      if (precio === null) {
        toast.error(
          `Precio invalido para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const precioMayorResult = parsePrecioMayor(draftState.precioMayor)
      if (precioMayorResult.invalid) {
        toast.error(
          `Precio por mayor invalido para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      if (
        precioMayorResult.value !== null &&
        precioMayorResult.value >= precio
      ) {
        toast.error(
          `El precio por mayor debe ser menor al precio regular para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const stock = parseStock(draftState.stock)
      if (stock === null) {
        toast.error(
          `Stock invalido para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const codigoBarras = variant.codigoBarras?.trim() || null

      variantes.push({
        ...(hasValidId(variant.idProductoVariante)
          ? { idProductoVariante: variant.idProductoVariante }
          : {}),
        colorId: variant.color.idColor,
        tallaId: variant.talla.idTalla,
        estado: variant.estado,
        sku,
        ...(codigoBarras !== null ? { codigoBarras } : {}),
        precio,
        ...(precioMayorResult.value !== null
          ? { precioMayor: precioMayorResult.value }
          : {}),
        stock,
        ...(variant.readonlyOffer
          ? {
              precioOferta: variant.readonlyOffer.precioOferta,
              ofertaInicio: variant.readonlyOffer.ofertaInicio,
              ofertaFin: variant.readonlyOffer.ofertaFin,
            }
          : {}),
      })
    }

    if (variantes.length === 0) {
      toast.error("Debe registrar al menos una variante con SKU, precio y stock")
      return false
    }

    setIsSaving(true)

    try {
      const imagenesByColor = await Promise.all(
        selectedColors.map(async (color): Promise<ProductoImagenCreateRequest[]> => {
          const media = (mediaByColor[color.idColor] ?? []).slice(0, MAX_MEDIA_PER_COLOR)
          const localMedia = media.filter(isLocalMedia)

          let uploadedImages: ProductoImagenesUploadResponse["imagenes"] = []
          if (localMedia.length > 0) {
            const uploadFormData = new FormData()
            uploadFormData.append("colorId", String(color.idColor))
            if (hasValidId(productoId)) {
              uploadFormData.append("productoId", String(productoId))
            }

            localMedia.forEach((item) => {
              uploadFormData.append("files", item.file, item.file.name)
            })

            const uploadResponse = await authFetch("/api/producto/imagenes", {
              method: "POST",
              body: uploadFormData,
            })
            const uploadPayload = await parseJsonSafe(uploadResponse)

            if (!uploadResponse.ok) {
              throw new Error(
                getResponseMessage(
                  uploadPayload,
                  `No se pudieron subir las imagenes para ${color.nombre}`
                )
              )
            }

            if (!isProductoImagenesUploadResponse(uploadPayload)) {
              throw new Error(
                `La respuesta de imagenes para ${color.nombre} no tiene el formato esperado`
              )
            }

            uploadedImages = [...uploadPayload.imagenes]
              .sort((a, b) => {
                const aOrden = typeof a.ordenSugerido === "number" ? a.ordenSugerido : 999
                const bOrden = typeof b.ordenSugerido === "number" ? b.ordenSugerido : 999
                return aOrden - bOrden
              })
              .slice(0, localMedia.length)

            if (uploadedImages.length !== localMedia.length) {
              throw new Error(
                `No se recibieron todas las imagenes subidas para ${color.nombre}`
              )
            }
          }

          let uploadedIndex = 0
          return media.map((item, index) => {
            if (isLocalMedia(item)) {
              const uploaded = uploadedImages[uploadedIndex]
              uploadedIndex += 1
              if (!uploaded) {
                throw new Error(
                  `No se pudo mapear la imagen subida para ${color.nombre}`
                )
              }

              return {
                colorId: color.idColor,
                orden: index + 1,
                esPrincipal: index === 0,
                url: uploaded.url,
                urlThumb: uploaded.urlThumb,
              }
            }

            if (!isRemoteMedia(item)) {
              throw new Error(
                `Se detecto una imagen invalida para ${color.nombre}`
              )
            }

            return {
              colorId: color.idColor,
              orden: index + 1,
              esPrincipal: index === 0,
              url: item.url,
              urlThumb: item.urlThumb,
            }
          })
        })
      )

      const imagenes = imagenesByColor.flat()

      const payload: ProductoInsertarCompletoRequest = {
        idSucursal,
        idCategoria,
        nombre,
        variantes,
        imagenes,
        ...(descripcion !== "" ? { descripcion } : {}),
      }

      const endpoint =
        isEditing && hasValidId(productoId)
          ? `/api/producto/actualizar-completo/${productoId}`
          : "/api/producto/insertar-completo"
      const method = isEditing ? "PUT" : "POST"

      const saveResponse = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const savePayload = (await parseJsonSafe(saveResponse)) as
        | ProductoInsertarCompletoResponse
        | ProductoActualizarCompletoResponse
        | null

      if (!saveResponse.ok) {
        throw new Error(
          getResponseMessage(
            savePayload,
            isEditing
              ? "No se pudo actualizar el producto completo"
              : "No se pudo crear el producto completo"
          )
        )
      }

      toast.success(
        isEditing ? "Producto actualizado exitosamente" : "Producto creado exitosamente"
      )
      return true
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Error inesperado al guardar"
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    form.descripcion,
    form.idCategoria,
    form.nombre,
    isEditing,
    isAutoSkuEnabled,
    isSaving,
    loadNextAutoSkuSequence,
    mediaByColor,
    productoId,
    selectedColors,
    selectedSucursalId,
    selectedTallas,
    variantValues,
    variantRows,
  ])

  const isBusy =
    loadingDetalle ||
    isSaving ||
    loadingAtributos ||
    loadingCategorias ||
    (isAdmin && loadingSucursales)

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasValidSucursal &&
      !sucursalOptions.some((option) => option.value === String(form.idSucursal))
        ? [
            {
              value: String(form.idSucursal),
              label: `Sucursal #${form.idSucursal}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [form.idSucursal, hasValidSucursal, sucursalOptions]
  )

  const categoriaComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasValidCategoria &&
      !categorias.some(
        (categoria) => categoria.idCategoria === form.idCategoria
      )
        ? [
            {
              value: String(form.idCategoria),
              label: `Categoria #${form.idCategoria}`,
            },
            ...categorias.map((categoria) => ({
              value: String(categoria.idCategoria),
              label: categoria.nombreCategoria,
              description: categoria.nombreSucursal,
            })),
          ]
        : categorias.map((categoria) => ({
            value: String(categoria.idCategoria),
            label: categoria.nombreCategoria,
            description: categoria.nombreSucursal,
          })),
    [categorias, form.idCategoria, hasValidCategoria]
  )

  return {
    user,
    isAdmin,
    isEditing,
    loadingDetalle,
    errorDetalle,
    form,
    isSaving,
    isBusy,
    sucursalComboboxOptions,
    searchSucursal,
    setSearchSucursal,
    loadingSucursales,
    errorSucursales,
    categoriaComboboxOptions,
    searchCategoria,
    setSearchCategoria,
    loadingCategorias,
    errorCategorias,
    selectedCategoriaName,
    availableColors,
    availableTallas,
    loadingAtributos,
    errorAtributos,
    loadingColores,
    errorColores,
    searchColor,
    setSearchColor,
    colorPage,
    setColorPage,
    colorTotalPages,
    colorTotalElements,
    loadingTallas,
    errorTallas,
    searchTalla,
    setSearchTalla,
    tallaPage,
    setTallaPage,
    tallaTotalPages,
    tallaTotalElements,
    selectedColorIds,
    selectedTallaIds,
    selectedColors,
    selectedTallas,
    focusedColorId,
    mediaByColor,
    replaceMediaByColor,
    variantRows,
    deletingVariantKeys,
    isAutoSkuEnabled,
    isAutoBarcodeEnabled,
    totalSelectedMedia,
    setFocusedColorId,
    handleSucursalChange,
    handleCategoriaChange,
    handleNombreChange,
    handleDescripcionChange,
    handleCreateCategoria,
    handleCreateColor,
    handleCreateTalla,
    toggleColorSelection,
    toggleTallaSelection,
    handleAutoSkuToggle,
    handleAutoBarcodeToggle,
    handleVariantFieldChange,
    handleGenerateBarcode,
    generatingBarcodeKeys,
    handleApplyVariantFieldToAll,
    handleRemoveVariant,
    handleSetVariantStatus,
    saveProducto,
  }
}

