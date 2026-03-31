"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import type { VarianteResumenItem } from "@/lib/types/variante"
import { parseVarianteResumenPageResponse } from "@/lib/variante-resumen"

export interface BarcodeVariante {
  idProductoVariante: number
  sku: string | null
  codigoBarras: string
  productoNombre: string
  colorNombre: string
  tallaNombre: string
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useBarcodeVariantes(enabled: boolean, idSucursal?: number | null) {
  const { isLoading: isAuthLoading } = useAuth()
  const [items, setItems] = useState<BarcodeVariante[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalWithBarcode, setTotalWithBarcode] = useState(0)
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)

  const fetchVariantes = useCallback(
    async (pageNumber: number) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)

      try {
        const params = new URLSearchParams({ page: String(pageNumber) })
        if (typeof idSucursal === "number" && idSucursal > 0) {
          params.set("idSucursal", String(idSucursal))
        }
        if (debouncedSearch.trim()) {
          params.set("q", debouncedSearch.trim())
        }

        const response = await authFetch(
          `/api/variante/listar-resumen?${params.toString()}`,
          { signal: controller.signal, cache: "no-store" }
        )
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          toast.error(data?.message ?? "Error al cargar variantes")
          setItems([])
          setTotalPages(0)
          setTotalWithBarcode(0)
          return
        }

        const pageData = parseVarianteResumenPageResponse(data)
        const withBarcodes = pageData.content
          .filter(
            (v: VarianteResumenItem) =>
              v.codigoBarras && v.codigoBarras.trim().length > 0
          )
          .map(
            (v: VarianteResumenItem): BarcodeVariante => ({
              idProductoVariante: v.idProductoVariante,
              sku: v.sku,
              codigoBarras: v.codigoBarras!,
              productoNombre: v.producto.nombre,
              colorNombre: v.color?.nombre ?? "Sin color",
              tallaNombre: v.talla?.nombre ?? "Sin talla",
            })
          )

        setItems(withBarcodes)
        setTotalPages(pageData.totalPages)
        setTotalWithBarcode(withBarcodes.length)
      } catch (error) {
        if (isAbortError(error)) return
        toast.error("Error inesperado al cargar variantes")
        setItems([])
        setTotalPages(0)
        setTotalWithBarcode(0)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [debouncedSearch, idSucursal]
  )

  useEffect(() => {
    setPage(0)
  }, [debouncedSearch, idSucursal])

  useEffect(() => {
    if (!enabled || isAuthLoading) return
    void fetchVariantes(page)
  }, [enabled, fetchVariantes, isAuthLoading, page])

  useEffect(() => {
    if (enabled) return
    abortRef.current?.abort()
    setLoading(false)
    setItems([])
    setSearch("")
    setPage(0)
    setTotalWithBarcode(0)
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    items,
    loading,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    totalWithBarcode,
  }
}
