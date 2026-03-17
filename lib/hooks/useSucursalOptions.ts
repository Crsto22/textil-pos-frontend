"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import {
  getSucursalAvatarColor,
  getSucursalInitials,
  getSucursalLocationLabel,
  normalizeSucursalPageResponse,
} from "@/lib/sucursal"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type { Sucursal } from "@/lib/types/sucursal"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useSucursalOptions(enabled: boolean) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loadingSucursales, setLoadingSucursales] = useState(false)
  const [errorSucursales, setErrorSucursales] = useState<string | null>(null)
  const [searchSucursal, setSearchSucursal] = useState("")
  const debouncedSearch = useDebouncedValue(searchSucursal, SEARCH_DEBOUNCE_MS)

  const abortRef = useRef<AbortController | null>(null)

  const fetchListarSucursales = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingSucursales(true)
    setErrorSucursales(null)

    try {
      const response = await authFetch("/api/sucursal/listar?page=0", {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setSucursales([])
        setErrorSucursales(data?.message ?? "Error al obtener sucursales")
        return
      }

      setSucursales(normalizeSucursalPageResponse(data).content)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setSucursales([])
      setErrorSucursales(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingSucursales(false)
      }
    }
  }, [])

  const fetchBuscarSucursales = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingSucursales(true)
    setErrorSucursales(null)

    try {
      const response = await authFetch(
        `/api/sucursal/buscar?q=${encodeURIComponent(query)}&page=0`,
        {
          signal: controller.signal,
        }
      )
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setSucursales([])
        setErrorSucursales(data?.message ?? "Error al buscar sucursales")
        return
      }

      setSucursales(normalizeSucursalPageResponse(data).content)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setSucursales([])
      setErrorSucursales(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingSucursales(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (debouncedSearch !== searchSucursal) return

    if (!debouncedSearch.trim()) {
      void fetchListarSucursales()
      return
    }

    void fetchBuscarSucursales(debouncedSearch)
  }, [
    debouncedSearch,
    enabled,
    fetchBuscarSucursales,
    fetchListarSucursales,
    searchSucursal,
  ])

  useEffect(() => {
    if (enabled) return

    abortRef.current?.abort()
    setSucursales([])
    setErrorSucursales(null)
    setLoadingSucursales(false)
    setSearchSucursal("")
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const sucursalOptions = useMemo(
    () =>
      (Array.isArray(sucursales) ? sucursales : []).map((sucursal) => ({
        value: String(sucursal.idSucursal),
        label: sucursal.nombre,
        description:
          getSucursalLocationLabel(sucursal) || sucursal.nombreEmpresa,
        avatarText: getSucursalInitials(sucursal.nombre),
        avatarClassName: getSucursalAvatarColor(sucursal.idSucursal),
      })),
    [sucursales]
  )

  return {
    sucursales,
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
    fetchListarSucursales,
    fetchBuscarSucursales,
  }
}
