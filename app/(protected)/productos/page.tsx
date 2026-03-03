"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { ProductoDetallePanel } from "@/components/productos/ProductoDetallePanel"
import { ProductosCards } from "@/components/productos/ProductosCards"
import { ProductosHeader } from "@/components/productos/ProductosHeader"
import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ProductoDeleteDialog } from "@/components/productos/modals/ProductoDeleteDialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useProductos } from "@/lib/hooks/useProductos"
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

  const [categoriaFilter, setCategoriaFilter] = useState("TODAS")
  const [colorFilter, setColorFilter] = useState("TODOS")
  const [onlyActive, setOnlyActive] = useState(false)

  const {
    search,
    setSearch,
    displayedProductos,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    deleteProducto,
  } = useProductos()

  const categoriasDisponibles = useMemo(() => {
    const values = new Set<string>()
    displayedProductos.forEach((producto) => {
      const categoria = producto.nombreCategoria?.trim()
      if (categoria) values.add(categoria)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [displayedProductos])

  const coloresDisponibles = useMemo(() => {
    const values = new Set<string>()
    displayedProductos.forEach((producto) => {
      producto.colores.forEach((color) => {
        const nombre = color.nombre?.trim()
        if (nombre) values.add(nombre)
      })
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [displayedProductos])

  useEffect(() => {
    if (categoriaFilter === "TODAS") return
    if (categoriasDisponibles.includes(categoriaFilter)) return
    setCategoriaFilter("TODAS")
  }, [categoriaFilter, categoriasDisponibles])

  useEffect(() => {
    if (colorFilter === "TODOS") return
    if (coloresDisponibles.includes(colorFilter)) return
    setColorFilter("TODOS")
  }, [colorFilter, coloresDisponibles])

  const productosFiltrados = useMemo(() => {
    return displayedProductos.filter((producto) => {
      const sameCategoria =
        categoriaFilter === "TODAS" || producto.nombreCategoria === categoriaFilter
      const hasColor =
        colorFilter === "TODOS" ||
        producto.colores.some((color) => color.nombre === colorFilter)
      const activeOk = !onlyActive || producto.estado === "ACTIVO"
      return sameCategoria && hasColor && activeOk
    })
  }, [categoriaFilter, colorFilter, displayedProductos, onlyActive])

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
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="space-y-3 2xl:max-w-3xl">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, SKU o categoria..."
                className="h-10 pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Categoria:</span>
                <select
                  value={categoriaFilter}
                  onChange={(event) => setCategoriaFilter(event.target.value)}
                  className="bg-transparent text-xs text-foreground outline-none"
                >
                  <option value="TODAS">Todas</option>
                  {categoriasDisponibles.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Color:</span>
                <select
                  value={colorFilter}
                  onChange={(event) => setColorFilter(event.target.value)}
                  className="bg-transparent text-xs text-foreground outline-none"
                >
                  <option value="TODOS">Todos</option>
                  {coloresDisponibles.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Solo activos</span>
                <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Mostrando {productosFiltrados.length} producto(s) de{" "}
              {displayedProductos.length} en esta pagina.
            </p>
          </div>

          <ProductosHeader />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="space-y-4">
          <ProductosCards
            productos={productosFiltrados}
            loading={displayedLoading}
            selectedProductoId={selectedProductoId}
            onSelectProducto={handleSelectProducto}
            onEditProducto={handleEditProducto}
            onDeleteProducto={handleDeleteProducto}
          />

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
