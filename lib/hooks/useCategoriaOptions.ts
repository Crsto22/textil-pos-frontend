"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type { Categoria, PageResponse } from "@/lib/types/categoria"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function toCategoriaList(data: unknown): Categoria[] {
  const pageData = data as PageResponse<Categoria> | null
  return Array.isArray(pageData?.content) ? pageData.content : []
}

export function useCategoriaOptions(enabled: boolean) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null)
  const [searchCategoria, setSearchCategoria] = useState("")
  const debouncedSearch = useDebouncedValue(searchCategoria, SEARCH_DEBOUNCE_MS)

  const abortRef = useRef<AbortController | null>(null)

  const fetchListarCategorias = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingCategorias(true)
    setErrorCategorias(null)

    try {
      const response = await authFetch("/api/categoria/listar?page=0", {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setCategorias([])
        setErrorCategorias(data?.message ?? "Error al obtener categorias")
        return
      }

      setCategorias(toCategoriaList(data))
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setCategorias([])
      setErrorCategorias(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCategorias(false)
      }
    }
  }, [])

  const fetchBuscarCategorias = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingCategorias(true)
    setErrorCategorias(null)

    try {
      const response = await authFetch(
        `/api/categoria/buscar?q=${encodeURIComponent(query)}&page=0`,
        {
          signal: controller.signal,
        }
      )
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setCategorias([])
        setErrorCategorias(data?.message ?? "Error al buscar categorias")
        return
      }

      setCategorias(toCategoriaList(data))
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setCategorias([])
      setErrorCategorias(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCategorias(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (debouncedSearch !== searchCategoria) return

    if (!debouncedSearch.trim()) {
      void fetchListarCategorias()
      return
    }

    void fetchBuscarCategorias(debouncedSearch)
  }, [
    debouncedSearch,
    enabled,
    fetchBuscarCategorias,
    fetchListarCategorias,
    searchCategoria,
  ])

  useEffect(() => {
    if (enabled) return

    abortRef.current?.abort()
    setCategorias([])
    setErrorCategorias(null)
    setLoadingCategorias(false)
    setSearchCategoria("")
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const categoriaOptions = useMemo(
    () =>
      (Array.isArray(categorias) ? categorias : []).map((categoria) => ({
        value: String(categoria.idCategoria),
        label: categoria.nombreCategoria,
        description: categoria.nombreSucursal,
      })),
    [categorias]
  )

  return {
    categorias,
    categoriaOptions,
    loadingCategorias,
    errorCategorias,
    searchCategoria,
    setSearchCategoria,
    fetchListarCategorias,
    fetchBuscarCategorias,
  }
}
