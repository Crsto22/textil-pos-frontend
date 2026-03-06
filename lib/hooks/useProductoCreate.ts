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
import type { Color } from "@/lib/types/color"
import {
  MAX_MEDIA_PER_COLOR,
  type MediaItem,
  type ProductoCreateFormState,
  type VariantRow,
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

function parsePrecioOferta(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function parseStock(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
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

  const {
    categorias,
    loadingCategorias,
    errorCategorias,
    searchCategoria,
    setSearchCategoria,
  } = useCategoriaOptions(true)

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

  const selectedSucursalId = isAdmin ? form.idSucursal : user?.idSucursal ?? null
  const hasValidSucursal = hasValidId(form.idSucursal)
  const hasValidCategoria = hasValidId(form.idCategoria)

  const filteredCategorias = useMemo(() => {
    if (!hasValidId(selectedSucursalId)) return categorias
    return categorias.filter(
      (categoria) => categoria.idSucursal === selectedSucursalId
    )
  }, [categorias, selectedSucursalId])

  const categoriaMap = useMemo(
    () => new Map(filteredCategorias.map((categoria) => [categoria.idCategoria, categoria])),
    [filteredCategorias]
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

  const toggleColorSelection = useCallback(
    (idColor: number) => {
      setSelectedColorIds((previous) => {
        if (previous.includes(idColor)) {
          return previous.filter((id) => id !== idColor)
        }
        return [...previous, idColor]
      })

      const color = availableColors.find((item) => item.idColor === idColor)
      if (color) {
        setSelectedColorCatalog((previous) => ({
          ...previous,
          [idColor]: color,
        }))
      }
    },
    [availableColors]
  )

  const toggleTallaSelection = useCallback(
    (idTalla: number) => {
      setSelectedTallaIds((previous) => {
        if (previous.includes(idTalla)) {
          return previous.filter((id) => id !== idTalla)
        }
        return [...previous, idTalla]
      })

      const talla = availableTallas.find((item) => item.idTalla === idTalla)
      if (talla) {
        setSelectedTallaCatalog((previous) => ({
          ...previous,
          [idTalla]: talla,
        }))
      }
    },
    [availableTallas]
  )

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

  const [variantValues, setVariantValues] = useState<Record<string, VariantValues>>({})
  const [excludedVariantKeys, setExcludedVariantKeys] = useState<string[]>([])
  const [deletingVariantKeys, setDeletingVariantKeys] = useState<string[]>([])

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

          nextVariantValues[buildVariantKey(variant.colorId, variant.tallaId)] = {
            idProductoVariante: variant.idProductoVariante,
            sku: variant.sku ?? "",
            precio: String(variant.precio),
            ofertaActiva:
              typeof variant.precioOferta === "number" && variant.precioOferta > 0,
            precioOferta:
              typeof variant.precioOferta === "number"
                ? String(variant.precioOferta)
                : "",
            stock: String(variant.stock),
          }
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
        setExcludedVariantKeys([])
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

    setExcludedVariantKeys((previous) => {
      const next = previous.filter((key) => allowedKeys.has(key))
      return next.length === previous.length ? previous : next
    })
  }, [selectedColorIds, selectedTallaIds])

  const variantRows = useMemo<VariantRow[]>(() => {
    const rows: VariantRow[] = []
    const excludedKeys = new Set(excludedVariantKeys)

    selectedColors.forEach((color) => {
      selectedTallas.forEach((talla) => {
        const key = `${color.idColor}-${talla.idTalla}`
        if (excludedKeys.has(key)) return
        const values = variantValues[key] ?? {
          idProductoVariante: null,
          sku: "",
          precio: "",
          ofertaActiva: false,
          precioOferta: "",
          stock: "",
        }

        rows.push({
          key,
          idProductoVariante: values.idProductoVariante ?? null,
          color,
          talla,
          sku: values.sku,
          precio: values.precio,
          ofertaActiva: values.ofertaActiva,
          precioOferta: values.precioOferta,
          stock: values.stock,
        })
      })
    })

    return rows
  }, [excludedVariantKeys, selectedColors, selectedTallas, variantValues])

  const handleVariantFieldChange = useCallback(
    (key: string, field: keyof VariantValues, value: string) => {
      setVariantValues((previous) => ({
        ...previous,
        [key]: {
          idProductoVariante: previous[key]?.idProductoVariante ?? null,
          sku: previous[key]?.sku ?? "",
          precio: previous[key]?.precio ?? "",
          ofertaActiva: previous[key]?.ofertaActiva ?? false,
          precioOferta: previous[key]?.precioOferta ?? "",
          stock: previous[key]?.stock ?? "",
          [field]: value,
        },
      }))
    },
    []
  )

  const handleApplyVariantFieldToAll = useCallback(
    (field: keyof VariantValues, value: string) => {
      if (variantRows.length === 0) return

      setVariantValues((previous) => {
        const next = { ...previous }

        variantRows.forEach((variant) => {
          const current = next[variant.key] ?? {
            idProductoVariante: null,
            sku: "",
            precio: "",
            ofertaActiva: false,
            precioOferta: "",
            stock: "",
          }
          next[variant.key] = {
            idProductoVariante: current.idProductoVariante ?? null,
            sku: current.sku,
            precio: current.precio,
            ofertaActiva: current.ofertaActiva,
            precioOferta: current.precioOferta,
            stock: current.stock,
            [field]: value,
          }
        })

        return next
      })
    },
    [variantRows]
  )

  const handleVariantOfferToggle = useCallback(
    (key: string, enabled: boolean) => {
      setVariantValues((previous) => ({
        ...previous,
        [key]: {
          idProductoVariante: previous[key]?.idProductoVariante ?? null,
          sku: previous[key]?.sku ?? "",
          precio: previous[key]?.precio ?? "",
          ofertaActiva: enabled,
          precioOferta: enabled ? previous[key]?.precioOferta ?? "" : "",
          stock: previous[key]?.stock ?? "",
        },
      }))
    },
    []
  )

  const handleToggleOfferForAll = useCallback(
    (enabled: boolean) => {
      if (variantRows.length === 0) return

      setVariantValues((previous) => {
        const next = { ...previous }

        variantRows.forEach((variant) => {
          const current = next[variant.key] ?? {
            idProductoVariante: null,
            sku: "",
            precio: "",
            ofertaActiva: false,
            precioOferta: "",
            stock: "",
          }

          next[variant.key] = {
            ...current,
            idProductoVariante: current.idProductoVariante ?? null,
            ofertaActiva: enabled,
            precioOferta: enabled ? current.precioOferta : "",
          }
        })

        return next
      })
    },
    [variantRows]
  )

  const removeVariantFromDraft = useCallback(
    (key: string) => {
      const nextExcludedKeys = new Set(excludedVariantKeys)
      nextExcludedKeys.add(key)

      const remainingColorIds = new Set<number>()
      const remainingTallaIds = new Set<number>()
      const remainingVariantKeys = new Set<string>()

      selectedColorIds.forEach((idColor) => {
        selectedTallaIds.forEach((idTalla) => {
          const variantKey = buildVariantKey(idColor, idTalla)
          if (nextExcludedKeys.has(variantKey)) return

          remainingColorIds.add(idColor)
          remainingTallaIds.add(idTalla)
          remainingVariantKeys.add(variantKey)
        })
      })

      setExcludedVariantKeys(Array.from(nextExcludedKeys))

      setSelectedColorIds((previous) =>
        previous.filter((idColor) => remainingColorIds.has(idColor))
      )
      setSelectedTallaIds((previous) =>
        previous.filter((idTalla) => remainingTallaIds.has(idTalla))
      )

      setVariantValues((previous) => {
        let changed = false
        const next: Record<string, VariantValues> = {}

        for (const [variantKey, variantValue] of Object.entries(previous)) {
          if (!remainingVariantKeys.has(variantKey)) {
            changed = true
            continue
          }
          next[variantKey] = variantValue
        }

        return changed ? next : previous
      })
    },
    [excludedVariantKeys, selectedColorIds, selectedTallaIds]
  )

  const handleRemoveVariant = useCallback(
    async (key: string): Promise<boolean> => {
      const variant = variantRows.find((item) => item.key === key)
      if (!variant) return false

      const variantId = variant.idProductoVariante
      const isPersistedVariant = isEditing && hasValidId(variantId)

      if (!isPersistedVariant) {
        removeVariantFromDraft(key)
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

        removeVariantFromDraft(key)
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
    [deletingVariantKeys, isEditing, removeVariantFromDraft, variantRows]
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

    const variantes: ProductoVarianteCreateRequest[] = []
    const seenSkus = new Set<string>()

    for (const variant of variantRows) {
      const sku = variant.sku.trim()
      if (sku === "") {
        toast.error(
          `El SKU es obligatorio para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const normalizedSku = sku.toUpperCase()
      if (seenSkus.has(normalizedSku)) {
        toast.error(`No puede repetir SKU dentro del mismo producto (${sku})`)
        return false
      }
      seenSkus.add(normalizedSku)

      const precio = parsePrecio(variant.precio)
      if (precio === null) {
        toast.error(
          `Precio invalido para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const precioOferta = variant.ofertaActiva
        ? parsePrecioOferta(variant.precioOferta)
        : null
      if (variant.ofertaActiva && precioOferta === null) {
        toast.error(
          `Debe ingresar un precio oferta valido para ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }
      if (precioOferta !== null && precioOferta >= precio) {
        toast.error(
          `El precio oferta debe ser menor al precio regular para ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      const stock = parseStock(variant.stock)
      if (stock === null) {
        toast.error(
          `Stock invalido para la variante ${variant.color.nombre}/${variant.talla.nombre}`
        )
        return false
      }

      variantes.push({
        colorId: variant.color.idColor,
        tallaId: variant.talla.idTalla,
        sku,
        precio,
        ...(precioOferta !== null ? { precioOferta } : {}),
        stock,
      })
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
    isSaving,
    mediaByColor,
    productoId,
    selectedColors,
    selectedSucursalId,
    selectedTallas.length,
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
      !filteredCategorias.some(
        (categoria) => categoria.idCategoria === form.idCategoria
      )
        ? [
            {
              value: String(form.idCategoria),
              label: `Categoria #${form.idCategoria}`,
            },
            ...filteredCategorias.map((categoria) => ({
              value: String(categoria.idCategoria),
              label: categoria.nombreCategoria,
              description: categoria.nombreSucursal,
            })),
          ]
        : filteredCategorias.map((categoria) => ({
            value: String(categoria.idCategoria),
            label: categoria.nombreCategoria,
            description: categoria.nombreSucursal,
          })),
    [filteredCategorias, form.idCategoria, hasValidCategoria]
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
    totalSelectedMedia,
    setFocusedColorId,
    handleSucursalChange,
    handleCategoriaChange,
    handleNombreChange,
    handleDescripcionChange,
    toggleColorSelection,
    toggleTallaSelection,
    handleVariantFieldChange,
    handleApplyVariantFieldToAll,
    handleVariantOfferToggle,
    handleToggleOfferForAll,
    handleRemoveVariant,
    saveProducto,
  }
}

