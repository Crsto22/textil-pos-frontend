"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  buildCatalogVariantItems,
} from "@/lib/catalog-view"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type { ProductoResumen } from "@/lib/types/producto"
import type {
  VarianteDeleteResponse,
  VarianteUpdateRequest,
} from "@/lib/types/variante"
import {
  mapVarianteResumenToProductoResumen,
  parseVarianteResumenPageResponse,
} from "@/lib/variante-resumen"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 400) return "Solicitud invalida"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos"
  if (status === 404) return "Recurso no encontrado"
  if (status === 503) return "No se pudo conectar al servidor"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function appendOptionalPositiveInt(
  params: URLSearchParams,
  key: string,
  value?: number | null
) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return
  params.set(key, String(Math.trunc(value)))
}

function normalizeVariantePayload(payload: VarianteUpdateRequest): VarianteUpdateRequest {
  const codigoBarras = payload.codigoBarras?.trim() || null
  return {
    colorId: Math.trunc(payload.colorId),
    tallaId: Math.trunc(payload.tallaId),
    sku: payload.sku.trim(),
    ...(codigoBarras !== null ? { codigoBarras } : {}),
    precio: payload.precio,
    precioMayor: payload.precioMayor ?? null,
    stock: Math.trunc(payload.stock),
  }
}

export function useCatalogoVariantes(enabled = true, idSucursal?: number | null) {
  const { isLoading: isAuthLoading } = useAuth()

  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [idCategoriaFilter, setIdCategoriaFilter] = useState<number | null>(null)
  const [idColorFilter, setIdColorFilter] = useState<number | null>(null)
  const [conOfertaFilter, setConOfertaFilter] = useState(false)

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)

  const fetchCatalogo = useCallback(async (pageNumber: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
      })
      appendOptionalPositiveInt(params, "idCategoria", idCategoriaFilter)
      appendOptionalPositiveInt(params, "idColor", idColorFilter)
      appendOptionalPositiveInt(params, "idSucursal", idSucursal)
      if (debouncedSearch.trim()) {
        params.set("q", debouncedSearch.trim())
      }
      if (conOfertaFilter) {
        params.set("conOferta", "true")
      }

      const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, {
        signal: controller.signal,
        cache: "no-store",
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setProductos([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const pageData = parseVarianteResumenPageResponse(data)
      setProductos(pageData.content.map(mapVarianteResumenToProductoResumen))
      setTotalPages(pageData.totalPages)
      setTotalElements(pageData.totalElements)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setProductos([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [conOfertaFilter, idCategoriaFilter, idColorFilter, idSucursal, debouncedSearch])

  useEffect(() => {
    setPage(0)
  }, [conOfertaFilter, idCategoriaFilter, idColorFilter, idSucursal, debouncedSearch])

  useEffect(() => {
    if (!enabled || isAuthLoading) return
    void fetchCatalogo(page)
  }, [enabled, fetchCatalogo, isAuthLoading, page])

  useEffect(() => {
    if (enabled) return

    abortRef.current?.abort()
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const displayedCatalogVariants = useMemo(() => {
    return buildCatalogVariantItems(productos)
  }, [productos])

  const displayedTotalElements = totalElements

  const refreshCurrentView = useCallback(async () => {
    await fetchCatalogo(page)
  }, [fetchCatalogo, page])

  const updateVariante = useCallback(
    async (id: number, payload: VarianteUpdateRequest) => {
      try {
        const response = await authFetch(`/api/variante/actualizar/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizeVariantePayload(payload)),
        })
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success("Variante actualizada exitosamente")
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentView]
  )

  const deleteVariante = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`/api/variante/eliminar/${id}`, {
          method: "DELETE",
        })
        const data = (await parseJsonSafe(response)) as VarianteDeleteResponse | null

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Variante eliminada correctamente")
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentView]
  )

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => {
      setPage(value)
    },
    []
  )

  return {
    search,
    setSearch,
    idCategoriaFilter,
    idColorFilter,
    conOfertaFilter,
    setIdCategoriaFilter,
    setIdColorFilter,
    setConOfertaFilter,
    displayedCatalogVariants,
    displayedTotalElements,
    displayedTotalPages: totalPages,
    displayedPage: page,
    displayedLoading: loading,
    setDisplayedPage,
    error,
    refreshCurrentView,
    updateVariante,
    deleteVariante,
  }
}
