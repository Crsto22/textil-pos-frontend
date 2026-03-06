"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { ProductoDetallePanel } from "@/components/productos/ProductoDetallePanel"
import { ProductosCards } from "@/components/productos/ProductosCards"
import {
  ProductosHeader,
  type ProductosViewMode,
} from "@/components/productos/ProductosHeader"
import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ProductosTable } from "@/components/productos/ProductosTable"
import { ProductoDeleteDialog } from "@/components/productos/modals/ProductoDeleteDialog"
import CategoryFilter from "@/components/ventas/CategoryFilter"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useProductos } from "@/lib/hooks/useProductos"
import type { Categoria, PageResponse as CategoriaPageResponse } from "@/lib/types/categoria"
import type { Color, PageResponse as ColorPageResponse } from "@/lib/types/color"
import type { ProductoDetalleResponse, ProductoResumen } from "@/lib/types/producto"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isProductoDetalleResponse(payload: unknown): payload is ProductoDetalleResponse {
  if (!payload || typeof payload !== "object") return false
  if (!("producto" in payload) || !("variantes" in payload) || !("imagenes" in payload)) {
    return false
  }

  const detail = payload as ProductoDetalleResponse
  return Array.isArray(detail.variantes) && Array.isArray(detail.imagenes)
}

interface FetchDetalleOptions {
  preserveData?: boolean
}

interface CategoryFilterOption {
  id: number
  name: string
}

interface ColorFilterOption {
  id: number
  name: string
  hex: string | null | undefined
}

function mapCategoryFilters(payload: unknown): CategoryFilterOption[] {
  const pageData = payload as CategoriaPageResponse<Categoria> | null
  const content = Array.isArray(pageData?.content) ? pageData.content : []

  return content
    .filter((categoria) => {
      if (typeof categoria?.idCategoria !== "number" || categoria.idCategoria <= 0) {
        return false
      }
      const estado = String(categoria?.estado ?? "").trim().toUpperCase()
      return !estado || estado === "ACTIVO"
    })
    .map((categoria) => {
      const name = categoria.nombreCategoria?.trim()
      return {
        id: categoria.idCategoria,
        name: name && name.length > 0 ? name : `Categoria #${categoria.idCategoria}`,
      }
    })
}

function mapColorFilters(payload: unknown): ColorFilterOption[] {
  const pageData = payload as ColorPageResponse<Color> | null
  const content = Array.isArray(pageData?.content) ? pageData.content : []

  return content
    .filter((color) => {
      if (typeof color?.idColor !== "number" || color.idColor <= 0) return false
      const estado = String(color?.estado ?? "").trim().toUpperCase()
      return !estado || estado === "ACTIVO"
    })
    .map((color) => {
      const name = color.nombre?.trim()
      return {
        id: color.idColor,
        name: name && name.length > 0 ? name : `Color #${color.idColor}`,
        hex: color.codigo,
      }
    })
}

export default function ProductosPage() {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<ProductoResumen | null>(null)
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null)
  const [detalleProducto, setDetalleProducto] = useState<ProductoDetalleResponse | null>(
    null
  )
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)
  const detalleAbortRef = useRef<AbortController | null>(null)
  const [viewMode, setViewMode] = useState<ProductosViewMode>("cards")
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoryFilterOption[]>(
    []
  )
  const [categoryPage, setCategoryPage] = useState(0)
  const [categoryTotalPages, setCategoryTotalPages] = useState(1)
  const [coloresDisponibles, setColoresDisponibles] = useState<ColorFilterOption[]>([])
  const [colorPage, setColorPage] = useState(0)
  const [colorTotalPages, setColorTotalPages] = useState(1)

  const {
    search,
    setSearch,
    idCategoriaFilter,
    idColorFilter,
    setIdCategoriaFilter,
    setIdColorFilter,
    displayedProductos,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    deleteProducto,
  } = useProductos()

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await authFetch(`/api/categoria/listar?page=${categoryPage}`)
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          setCategoriasDisponibles([])
          setCategoryTotalPages(1)
          return
        }

        const pageData = data as CategoriaPageResponse<Categoria> | null
        const totalPages =
          typeof pageData?.totalPages === "number" && pageData.totalPages > 0
            ? pageData.totalPages
            : 1

        if (categoryPage > totalPages - 1) {
          setCategoryPage(Math.max(0, totalPages - 1))
          return
        }

        setCategoriasDisponibles(mapCategoryFilters(data))
        setCategoryTotalPages(totalPages)
      } catch {
        setCategoriasDisponibles([])
        setCategoryTotalPages(1)
      }
    }

    void fetchCategorias()
  }, [categoryPage])

  useEffect(() => {
    const fetchColores = async () => {
      try {
        const response = await authFetch(`/api/color/listar?page=${colorPage}`)
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          setColoresDisponibles([])
          setColorTotalPages(1)
          return
        }

        const pageData = data as ColorPageResponse<Color> | null
        const totalPages =
          typeof pageData?.totalPages === "number" && pageData.totalPages > 0
            ? pageData.totalPages
            : 1

        if (colorPage > totalPages - 1) {
          setColorPage(Math.max(0, totalPages - 1))
          return
        }

        setColoresDisponibles(mapColorFilters(data))
        setColorTotalPages(totalPages)
      } catch {
        setColoresDisponibles([])
        setColorTotalPages(1)
      }
    }

    void fetchColores()
  }, [colorPage])

  const safeCategoryPage = Math.max(
    0,
    Math.min(categoryPage, Math.max(0, categoryTotalPages - 1))
  )
  const canGoPrevCategoryPage = safeCategoryPage > 0
  const canGoNextCategoryPage = safeCategoryPage < categoryTotalPages - 1

  const handleNextCategoryPage = useCallback(() => {
    if (!canGoNextCategoryPage) return
    setCategoryPage((previous) => previous + 1)
  }, [canGoNextCategoryPage])

  const handlePrevCategoryPage = useCallback(() => {
    if (!canGoPrevCategoryPage) return
    setCategoryPage((previous) => Math.max(0, previous - 1))
  }, [canGoPrevCategoryPage])

  const safeColorPage = Math.max(0, Math.min(colorPage, Math.max(0, colorTotalPages - 1)))
  const canGoPrevColorPage = safeColorPage > 0
  const canGoNextColorPage = safeColorPage < colorTotalPages - 1

  const handleNextColorPage = useCallback(() => {
    if (!canGoNextColorPage) return
    setColorPage((previous) => previous + 1)
  }, [canGoNextColorPage])

  const handlePrevColorPage = useCallback(() => {
    if (!canGoPrevColorPage) return
    setColorPage((previous) => Math.max(0, previous - 1))
  }, [canGoPrevColorPage])

  const productosFiltrados = displayedProductos

  useEffect(() => {
    if (productosFiltrados.length === 0) {
      detalleAbortRef.current?.abort()
      setSelectedProductoId(null)
      setDetalleProducto(null)
      setDetalleError(null)
      setDetalleLoading(false)
      return
    }

    if (selectedProductoId === null) {
      return
    }

    const stillExists = productosFiltrados.some(
      (producto) => producto.idProducto === selectedProductoId
    )
    if (!stillExists) {
      detalleAbortRef.current?.abort()
      setSelectedProductoId(null)
      setDetalleProducto(null)
      setDetalleError(null)
      setDetalleLoading(false)
    }
  }, [productosFiltrados, selectedProductoId])

  const fetchDetalleProducto = useCallback(
    async (idProducto: number, options?: FetchDetalleOptions) => {
      detalleAbortRef.current?.abort()
      const controller = new AbortController()
      detalleAbortRef.current = controller

      setDetalleLoading(true)
      setDetalleError(null)
      if (!options?.preserveData) {
        setDetalleProducto(null)
      }

      try {
        const response = await authFetch(`/api/producto/detalle/${idProducto}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        const payload = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "No se pudo cargar el detalle del producto"

          setDetalleError(message)
          return
        }

        if (!isProductoDetalleResponse(payload)) {
          setDetalleError("El detalle del producto no tiene el formato esperado")
          return
        }

        setDetalleProducto(payload)
      } catch (error) {
        if (controller.signal.aborted) return
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo cargar el detalle del producto"
        setDetalleError(message)
      } finally {
        if (!controller.signal.aborted) {
          setDetalleLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (selectedProductoId === null) {
      detalleAbortRef.current?.abort()
      return
    }
    void fetchDetalleProducto(selectedProductoId)
  }, [fetchDetalleProducto, selectedProductoId])

  useEffect(() => {
    return () => {
      detalleAbortRef.current?.abort()
    }
  }, [])

  const selectedProducto = useMemo(
    () =>
      productosFiltrados.find(
        (producto) => producto.idProducto === selectedProductoId
      ) ?? null,
    [productosFiltrados, selectedProductoId]
  )

  const handleDeleteProducto = useCallback((producto: ProductoResumen) => {
    setDeleteTarget(producto)
  }, [])

  const handleSelectProducto = useCallback(
    (producto: ProductoResumen) => {
      if (producto.idProducto === selectedProductoId) {
        void fetchDetalleProducto(producto.idProducto, { preserveData: true })
        return
      }
      setSelectedProductoId(producto.idProducto)
    },
    [fetchDetalleProducto, selectedProductoId]
  )

  const handleEditProducto = useCallback(
    (producto: ProductoResumen) => {
      router.push(`/productos/${producto.idProducto}/editar`)
    },
    [router]
  )

  const handleEditFromPanel = useCallback(
    (idProducto: number) => {
      router.push(`/productos/${idProducto}/editar`)
    },
    [router]
  )

  const handleDeleteConfirmed = useCallback(
    async (idProducto: number) => {
      const success = await deleteProducto(idProducto)
      if (!success) return false

      if (selectedProductoId === idProducto) {
        setSelectedProductoId(null)
        setDetalleProducto(null)
      }

      return true
    },
    [deleteProducto, selectedProductoId]
  )

  const handleRetryDetalle = useCallback(() => {
    if (selectedProductoId === null) return
    void fetchDetalleProducto(selectedProductoId, { preserveData: true })
  }, [fetchDetalleProducto, selectedProductoId])

  return (
    <div className="space-y-5">
      
        <div className="flex flex-col gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o categoria..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
            <CategoryFilter
              categories={categoriasDisponibles}
              colors={coloresDisponibles}
              activeCategoryId={idCategoriaFilter}
              onCategoryChange={setIdCategoriaFilter}
              categoryPage={safeCategoryPage}
              categoryTotalPages={categoryTotalPages}
              onCategoryNextPage={handleNextCategoryPage}
              onCategoryPrevPage={handlePrevCategoryPage}
              activeColorId={idColorFilter}
              onColorChange={setIdColorFilter}
              colorPage={safeColorPage}
              colorTotalPages={colorTotalPages}
              onColorNextPage={handleNextColorPage}
              onColorPrevPage={handlePrevColorPage}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando {productosFiltrados.length} producto(s) de {displayedProductos.length} en esta
            pagina.
          </p>

          <div className="w-full">
            <ProductosHeader
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>
      

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="space-y-4">
          {viewMode === "cards" ? (
            <ProductosCards
              productos={productosFiltrados}
              loading={displayedLoading}
              selectedProductoId={selectedProductoId}
              onSelectProducto={handleSelectProducto}
              onEditProducto={handleEditProducto}
              onDeleteProducto={handleDeleteProducto}
            />
          ) : (
            <ProductosTable
              productos={productosFiltrados}
              loading={displayedLoading}
              selectedProductoId={selectedProductoId}
              onSelectProducto={handleSelectProducto}
              onEditProducto={handleEditProducto}
              onDeleteProducto={handleDeleteProducto}
            />
          )}

          <ProductosPagination
            totalElements={displayedTotalElements}
            totalPages={displayedTotalPages}
            page={displayedPage}
            onPageChange={setDisplayedPage}
          />
        </div>

        <div className="self-start 2xl:sticky 2xl:top-20">
          <ProductoDetallePanel
            productoSeleccionado={selectedProducto}
            detalle={detalleProducto}
            loading={detalleLoading}
            error={detalleError}
            onRetry={handleRetryDetalle}
            onEditProducto={handleEditFromPanel}
          />
        </div>
      </section>

      <ProductoDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={handleDeleteConfirmed}
      />
    </div>
  )
}
