"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ComboboxOption } from "@/components/ui/combobox"
import {
  buildComprobanteDescription,
  buildComprobanteLabel,
  normalizeComprobantePageResponse,
} from "@/lib/comprobante"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ComprobanteConfig } from "@/lib/types/comprobante"

interface UseComprobanteOptionsParams {
  enabled: boolean
  habilitadoVenta?: boolean
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useComprobanteOptions({
  enabled,
  habilitadoVenta,
}: UseComprobanteOptionsParams) {
  const [comprobantes, setComprobantes] = useState<ComprobanteConfig[]>([])
  const [loadingComprobantes, setLoadingComprobantes] = useState(false)
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null)
  const [searchComprobante, setSearchComprobante] = useState("")

  const abortRef = useRef<AbortController | null>(null)

  const fetchComprobantes = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingComprobantes(true)
    setErrorComprobantes(null)

    try {
      const params = new URLSearchParams({
        activo: "ACTIVO",
      })

      const response = await authFetch(
        `/api/config/comprobantes?${params.toString()}`,
        {
          signal: controller.signal,
        }
      )
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setComprobantes([])
        setErrorComprobantes(data?.message ?? "Error al obtener comprobantes")
        return
      }

      const normalized = normalizeComprobantePageResponse(data)
      setComprobantes(normalized.content)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setComprobantes([])
      setErrorComprobantes(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingComprobantes(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort()
      setComprobantes([])
      setErrorComprobantes(null)
      setLoadingComprobantes(false)
      setSearchComprobante("")
      return
    }

    void fetchComprobantes()
  }, [enabled, fetchComprobantes])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const normalizedSearch = searchComprobante.trim().toLowerCase()

  const filteredComprobantes = useMemo(
    () =>
      comprobantes.filter((item) => {
        if (habilitadoVenta !== undefined && item.habilitadoVenta !== habilitadoVenta) {
          return false
        }

        if (!normalizedSearch) return true

        const label = buildComprobanteLabel(item).toLowerCase()
        return (
          label.includes(normalizedSearch) ||
          item.tipoComprobante.toLowerCase().includes(normalizedSearch) ||
          item.serie.toLowerCase().includes(normalizedSearch)
        )
      }),
    [comprobantes, habilitadoVenta, normalizedSearch]
  )

  const comprobanteOptions = useMemo<ComboboxOption[]>(
    () =>
      filteredComprobantes.map((item) => ({
        value: String(item.idComprobante),
        label: buildComprobanteLabel(item),
        description: buildComprobanteDescription(item),
      })),
    [filteredComprobantes]
  )

  return {
    comprobantes,
    comprobanteOptions,
    loadingComprobantes,
    errorComprobantes,
    searchComprobante,
    setSearchComprobante,
    fetchComprobantes,
  }
}
