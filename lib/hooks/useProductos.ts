"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
  PageResponse,
  Producto,
  ProductoCreateRequest,
  ProductoDeleteResponse,
  ProductoResumen,
  ProductoUpdateRequest,
} from "@/lib/types/producto"

interface SearchTotals {
  totalPages: number
  totalElements: number
}

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function hasValidCategoriaId(idCategoria?: number | null): idCategoria is number {
  return typeof idCategoria === "number" && idCategoria > 0
}

function normalizeProductoResumen(producto: Producto | ProductoResumen): ProductoResumen {
  const resumen = producto as ProductoResumen
  const normalizedColores = Array.isArray(resumen.colores)
    ? resumen.colores.map((color) => ({
        ...color,
        imagenPrincipal:
          color &&
          typeof color === "object" &&
          color.imagenPrincipal &&
          typeof color.imagenPrincipal === "object"
            ? color.imagenPrincipal
            : null,
        tallas: Array.isArray(color.tallas)
          ? color.tallas.map((talla) => ({
              tallaId: talla.tallaId,
              nombre: talla.nombre,
            }))
          : [],
      }))
    : []

  return {
    ...producto,
    precioMin: typeof resumen.precioMin === "number" ? resumen.precioMin : null,
    precioMax: typeof resumen.precioMax === "number" ? resumen.precioMax : null,
    colores: normalizedColores,
  }
}

export function useProductos() {
  const { isLoading: isAuthLoading, user } = useAuth()

  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [searchPage, setSearchPage] = useState(0)
  const resetSearchPage = useCallback(() => {
    setSearchPage(0)
  }, [])
  const debouncedSearch = useDebouncedValue(
    search,
    SEARCH_DEBOUNCE_MS,
    resetSearchPage
  )
  const [searchResults, setSearchResults] = useState<ProductoResumen[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const isAdmin = user?.rol === "ADMINISTRADOR"
  const isSearchMode = debouncedSearch.trim().length > 0

  const fetchProductos = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(
        `/api/producto/listar-resumen?page=${pageNumber}`,
        {
          signal: controller.signal,
        }
      )
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

      const pageData = data as PageResponse<ProductoResumen> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setProductos(content.map(normalizeProductoResumen))
      setTotalPages(nextTotalPages)
      setTotalElements(nextTotalElements)
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
  }, [])

  const fetchBuscar = useCallback(async (query: string, pageNumber: number) => {
    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    setSearching(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        page: String(pageNumber),
      })

      const response = await authFetch(`/api/producto/buscar?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setSearchResults([])
        setSearchTotals({ totalPages: 0, totalElements: 0 })
        return
      }

      const pageData = data as PageResponse<ProductoResumen> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setSearchResults(content.map(normalizeProductoResumen))
      setSearchTotals({
        totalPages: nextTotalPages,
        totalElements: nextTotalElements,
      })
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthLoading || isSearchMode) return
    fetchProductos(page)
  }, [fetchProductos, isAuthLoading, isSearchMode, page])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isSearchMode) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      setSearching(false)
      return
    }

    fetchBuscar(debouncedSearch, searchPage)
  }, [debouncedSearch, fetchBuscar, isAuthLoading, isSearchMode, searchPage])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
      searchAbortRef.current?.abort()
    }
  }, [])

  const refreshCurrentView = useCallback(async () => {
    if (isSearchMode) {
      await fetchBuscar(debouncedSearch, searchPage)
      return
    }
    await fetchProductos(page)
  }, [debouncedSearch, fetchBuscar, fetchProductos, isSearchMode, page, searchPage])

  const createProducto = useCallback(
    async (payload: ProductoCreateRequest) => {
      if (!hasValidCategoriaId(payload.idCategoria)) {
        const message = "Debe seleccionar una categoria"
        setError(message)
        toast.error(message)
        return false
      }

      const normalizedPayload: ProductoCreateRequest = isAdmin
        ? {
            ...payload,
            idSucursal: payload.idSucursal,
            idCategoria: payload.idCategoria,
            sku: payload.sku.trim(),
            nombre: payload.nombre.trim(),
            descripcion: payload.descripcion.trim(),
            codigoExterno: payload.codigoExterno.trim(),
          }
        : {
            idCategoria: payload.idCategoria,
            sku: payload.sku.trim(),
            nombre: payload.nombre.trim(),
            descripcion: payload.descripcion.trim(),
            codigoExterno: payload.codigoExterno.trim(),
          }

      if (isAdmin && !hasValidSucursalId(normalizedPayload.idSucursal)) {
        const message = "Debe seleccionar una sucursal"
        setError(message)
        toast.error(message)
        return false
      }

      try {
        const response = await authFetch("/api/producto/insertar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success("Producto creado exitosamente")
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
    [isAdmin, refreshCurrentView]
  )

  const updateProducto = useCallback(
    async (id: number, payload: ProductoUpdateRequest) => {
      if (!hasValidCategoriaId(payload.idCategoria)) {
        const message = "Debe seleccionar una categoria"
        setError(message)
        toast.error(message)
        return false
      }

      const normalizedPayload: ProductoUpdateRequest = isAdmin
        ? {
            ...payload,
            ...(hasValidSucursalId(payload.idSucursal)
              ? { idSucursal: payload.idSucursal }
              : {}),
            idCategoria: payload.idCategoria,
            sku: payload.sku.trim(),
            nombre: payload.nombre.trim(),
            descripcion: payload.descripcion.trim(),
            codigoExterno: payload.codigoExterno.trim(),
          }
        : {
            idCategoria: payload.idCategoria,
            sku: payload.sku.trim(),
            nombre: payload.nombre.trim(),
            descripcion: payload.descripcion.trim(),
            codigoExterno: payload.codigoExterno.trim(),
          }

      try {
        const response = await authFetch(`/api/producto/actualizar/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success("Producto actualizado exitosamente")
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
    [isAdmin, refreshCurrentView]
  )

  const deleteProducto = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`/api/producto/eliminar/${id}`, {
          method: "DELETE",
        })

        const data = (await parseJsonSafe(response)) as ProductoDeleteResponse | null

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Producto eliminado correctamente")

        setProductos((previous) =>
          previous.filter((producto) => producto.idProducto !== id)
        )
        setSearchResults((previous) =>
          previous.filter((producto) => producto.idProducto !== id)
        )
        setTotalElements((previous) => Math.max(0, previous - 1))
        setSearchTotals((previous) => ({
          ...previous,
          totalElements: Math.max(0, previous.totalElements - 1),
        }))

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

  const displayedProductos = useMemo(
    () => (isSearchMode ? searchResults : productos),
    [isSearchMode, productos, searchResults]
  )

  const displayedTotalPages = isSearchMode ? searchTotals.totalPages : totalPages
  const displayedTotalElements = isSearchMode
    ? searchTotals.totalElements
    : totalElements
  const displayedPage = isSearchMode ? searchPage : page
  const displayedLoading = isSearchMode ? searching : loading

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => {
      if (isSearchMode) {
        setSearchPage(value)
        return
      }
      setPage(value)
    },
    [isSearchMode]
  )

  return {
    productos,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    isAdmin,
    search,
    debouncedSearch,
    isSearchMode,
    searchResults,
    searchPage,
    searchTotals,
    searching,
    displayedProductos,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    setSearch,
    setPage,
    setSearchPage,
    fetchProductos,
    fetchBuscar,
    refreshCurrentView,
    createProducto,
    updateProducto,
    deleteProducto,
  }
}
