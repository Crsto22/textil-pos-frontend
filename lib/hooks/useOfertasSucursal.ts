"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { patchOfertaSucursal } from "@/lib/oferta-batch"
import { authFetch } from "@/lib/auth/auth-fetch"
import { parseProductoVarianteOfertaPageResponse } from "@/lib/oferta-parser"
import type { ProductoVarianteOferta } from "@/lib/types/oferta"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") return fallbackMessage
  if ("message" in payload && typeof payload.message === "string") return payload.message
  if ("error" in payload && typeof payload.error === "string") return payload.error
  return fallbackMessage
}

export function useOfertasSucursal(idSucursal: number | null, refreshToken = 0) {
  const [offers, setOffers] = useState<ProductoVarianteOferta[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [removing, setRemoving] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const fetchOffers = useCallback(async (sucursalId: number, pageNumber: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(
        `/api/variante/ofertas/sucursal?idSucursal=${sucursalId}&page=${pageNumber}`,
        { signal: controller.signal, cache: "no-store" }
      )
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setOffers([])
        setTotalPages(0)
        setTotalElements(0)
        setError(getErrorMessage(data, "No se pudieron cargar las ofertas de sucursal."))
        return
      }

      const pageData = parseProductoVarianteOfertaPageResponse(data)

      if (pageData.totalPages > 0 && pageNumber > pageData.totalPages - 1) {
        setPage(Math.max(0, pageData.totalPages - 1))
        return
      }

      setOffers(pageData.content)
      setTotalPages(pageData.totalPages)
      setTotalElements(pageData.totalElements)
      setSelectedIds([])
    } catch (requestError) {
      if (isAbortError(requestError)) return
      setOffers([])
      setTotalPages(0)
      setTotalElements(0)
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron cargar las ofertas de sucursal."
      )
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (idSucursal === null) {
      abortRef.current?.abort()
      setOffers([])
      setTotalPages(0)
      setTotalElements(0)
      setError(null)
      setSelectedIds([])
      setPage(0)
      return
    }
    void fetchOffers(idSucursal, page)
  }, [fetchOffers, idSucursal, page, refreshToken])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const refresh = useCallback(async () => {
    if (idSucursal !== null) await fetchOffers(idSucursal, page)
  }, [fetchOffers, idSucursal, page])

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const allCurrentPageSelected = useMemo(
    () =>
      offers.length > 0 &&
      offers.every((offer) => selectedIdSet.has(offer.idProductoVariante)),
    [offers, selectedIdSet]
  )

  const toggleSelected = useCallback((idProductoVariante: number) => {
    setSelectedIds((prev) =>
      prev.includes(idProductoVariante)
        ? prev.filter((id) => id !== idProductoVariante)
        : [...prev, idProductoVariante]
    )
  }, [])

  const toggleSelectAllCurrentPage = useCallback(() => {
    setSelectedIds((prev) => {
      if (offers.length === 0) return prev
      if (offers.every((offer) => prev.includes(offer.idProductoVariante))) {
        return prev.filter((id) => !offers.some((offer) => offer.idProductoVariante === id))
      }
      const nextIds = new Set(prev)
      offers.forEach((offer) => nextIds.add(offer.idProductoVariante))
      return Array.from(nextIds)
    })
  }, [offers])

  const removeSelectedOffers = useCallback(async () => {
    if (selectedIds.length === 0 || idSucursal === null) {
      toast.error("Debe seleccionar al menos una oferta para quitar.")
      return false
    }

    setRemoving(true)
    setError(null)

    const results = await Promise.all(
      selectedIds.map((idProductoVariante) =>
        patchOfertaSucursal(idProductoVariante, idSucursal, {
          precioOferta: null,
          ofertaInicio: null,
          ofertaFin: null,
        })
      )
    )

    setRemoving(false)

    const firstError = results.find((r) => !r.ok)
    if (firstError) {
      setError(firstError.message)
      toast.error(firstError.message)
      return false
    }

    toast.success(
      selectedIds.length === 1
        ? "Oferta de sucursal eliminada correctamente."
        : "Ofertas de sucursal eliminadas correctamente."
    )
    setSelectedIds([])
    await refresh()
    return true
  }, [idSucursal, refresh, selectedIds])

  return {
    offers,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    removing,
    selectedIds,
    selectedIdSet,
    allCurrentPageSelected,
    setPage,
    refresh,
    toggleSelected,
    toggleSelectAllCurrentPage,
    removeSelectedOffers,
  }
}
