"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ComboboxOption } from "@/components/ui/combobox"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import { normalizeCatalogPageResponse } from "@/lib/types/guia-remision-catalogos"

interface UseGuiaCatalogoOptionsConfig<TItem> {
  enabled: boolean
  endpoint: string
  normalizeItem: (value: unknown) => TItem | null
  toOption: (item: TItem) => ComboboxOption
  getId: (item: TItem) => number
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useGuiaCatalogoOptions<TItem>({
  enabled,
  endpoint,
  normalizeItem,
  toOption,
  getId,
}: UseGuiaCatalogoOptionsConfig<TItem>) {
  const [items, setItems] = useState<TItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)
  const knownItemsRef = useRef<Map<number, TItem>>(new Map())
  const normalizeItemRef = useRef(normalizeItem)
  const toOptionRef = useRef(toOption)
  const getIdRef = useRef(getId)

  normalizeItemRef.current = normalizeItem
  toOptionRef.current = toOption
  getIdRef.current = getId

  const cacheItems = useCallback(
    (nextItems: TItem[]) => {
      nextItems.forEach((item) => {
        knownItemsRef.current.set(getIdRef.current(item), item)
      })
    },
    []
  )

  const fetchOptions = useCallback(
    async (query: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ page: "0" })
        if (query.trim()) {
          params.set("q", query.trim())
        }

        const response = await authFetch(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          setItems([])
          setError(data?.message ?? "No se pudo cargar el catalogo")
          return
        }

        const pageData = normalizeCatalogPageResponse(
          data,
          normalizeItemRef.current
        )
        cacheItems(pageData.content)
        setItems(pageData.content)
      } catch (requestError) {
        if (isAbortError(requestError)) return
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setItems([])
        setError(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [cacheItems, endpoint]
  )

  useEffect(() => {
    if (!enabled) return
    void fetchOptions(debouncedSearch)
  }, [debouncedSearch, enabled, fetchOptions])

  useEffect(() => {
    if (enabled) return

    abortRef.current?.abort()
    setItems([])
    setLoading(false)
    setError(null)
    setSearch("")
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const options = useMemo(
    () => items.map((item) => toOptionRef.current(item)),
    [items]
  )

  const getItemById = useCallback((id: number) => {
    return knownItemsRef.current.get(id) ?? null
  }, [])

  return {
    items,
    options,
    loading,
    error,
    search,
    setSearch,
    getItemById,
  }
}
