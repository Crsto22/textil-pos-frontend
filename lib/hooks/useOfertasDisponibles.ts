"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { buildOfertaRemovalItems, patchOfertasLote } from "@/lib/oferta-batch"
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
  if (!payload || typeof payload !== "object") {
    return fallbackMessage
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }

  return fallbackMessage
}

export function useOfertasDisponibles(refreshToken = 0) {
  const [offers, setOffers] = useState<ProductoVarianteOferta[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [removing, setRemoving] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const fetchOffers = useCallback(async (pageNumber: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/variante/ofertas?page=${pageNumber}`, {
        signal: controller.signal,
        cache: "no-store",
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setOffers([])
        setTotalPages(0)
        setTotalElements(0)
        setError(getErrorMessage(data, "No se pudieron cargar las ofertas registradas."))
        return
      }

      const pageData = parseProductoVarianteOfertaPageResponse(data)
      const content = pageData.content
      const nextTotalPages = pageData.totalPages
      const nextTotalElements = pageData.totalElements

      if (nextTotalPages > 0 && pageNumber > nextTotalPages - 1) {
        setPage(Math.max(0, nextTotalPages - 1))
        return
      }

      setOffers(content)
      setTotalPages(nextTotalPages)
      setTotalElements(nextTotalElements)
      setSelectedIds([])
    } catch (requestError) {
      if (isAbortError(requestError)) return
      setOffers([])
      setTotalPages(0)
      setTotalElements(0)
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron cargar las ofertas registradas."
      )
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchOffers(page)
  }, [fetchOffers, page, refreshToken])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchOffers(page)
  }, [fetchOffers, page])

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const allCurrentPageSelected = useMemo(
    () =>
      offers.length > 0 &&
      offers.every((offer) => selectedIdSet.has(offer.idProductoVariante)),
    [offers, selectedIdSet]
  )

  const toggleSelected = useCallback((idProductoVariante: number) => {
    setSelectedIds((previous) =>
      previous.includes(idProductoVariante)
        ? previous.filter((id) => id !== idProductoVariante)
        : [...previous, idProductoVariante]
    )
  }, [])

  const toggleSelectAllCurrentPage = useCallback(() => {
    setSelectedIds((previous) => {
      if (offers.length === 0) return previous

      if (offers.every((offer) => previous.includes(offer.idProductoVariante))) {
        return previous.filter(
          (id) => !offers.some((offer) => offer.idProductoVariante === id)
        )
      }

      const nextIds = new Set(previous)
      offers.forEach((offer) => {
        nextIds.add(offer.idProductoVariante)
      })
      return Array.from(nextIds)
    })
  }, [offers])

  const removeSelectedOffers = useCallback(async () => {
    if (selectedIds.length === 0) {
      const message = "Debe seleccionar al menos una oferta para quitar."
      setError(message)
      toast.error(message)
      return false
    }

    setRemoving(true)
    setError(null)

    const result = await patchOfertasLote(buildOfertaRemovalItems(selectedIds))

    setRemoving(false)

    if (!result.ok) {
      setError(result.message)
      toast.error(result.message)
      return false
    }

    toast.success(
      selectedIds.length === 1
        ? "Oferta eliminada correctamente."
        : "Ofertas eliminadas correctamente."
    )
    setSelectedIds([])
    await refresh()
    return true
  }, [refresh, selectedIds])

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
