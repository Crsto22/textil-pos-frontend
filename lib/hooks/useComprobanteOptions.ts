"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ComboboxOption } from "@/components/ui/combobox"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ComprobanteConfig } from "@/lib/types/comprobante"

interface UseComprobanteOptionsParams {
  enabled: boolean
  idSucursal: number | null
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function toComprobanteArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data

  const content =
    typeof data === "object" && data !== null && "content" in data
      ? (data as { content?: unknown }).content
      : undefined

  return Array.isArray(content) ? content : []
}

function normalizeComprobante(value: unknown): ComprobanteConfig | null {
  const item =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
  if (!item) return null

  const idComprobante = Number(item.idComprobante ?? item.id_comprobante ?? item.id)
  const idSucursal = Number(item.idSucursal ?? item.id_sucursal)
  const tipoComprobante =
    typeof item.tipoComprobante === "string" ? item.tipoComprobante.trim() : ""
  const serie = typeof item.serie === "string" ? item.serie.trim() : ""

  if (!Number.isFinite(idComprobante) || idComprobante <= 0) return null
  if (!Number.isFinite(idSucursal) || idSucursal <= 0) return null
  if (!tipoComprobante) return null

  return {
    idComprobante,
    idSucursal,
    nombreSucursal:
      typeof item.nombreSucursal === "string" ? item.nombreSucursal : "",
    tipoComprobante,
    serie,
    ultimoCorrelativo: Number(item.ultimoCorrelativo) || 0,
    siguienteCorrelativo: Number(item.siguienteCorrelativo) || 0,
    activo: typeof item.activo === "string" ? item.activo : "ACTIVO",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
    deletedAt: typeof item.deletedAt === "string" ? item.deletedAt : null,
  }
}

function toComprobanteList(data: unknown): ComprobanteConfig[] {
  return toComprobanteArray(data)
    .map((item) => normalizeComprobante(item))
    .filter((item): item is ComprobanteConfig => item !== null)
}

function buildComprobanteLabel(comprobante: ComprobanteConfig): string {
  if (comprobante.serie) {
    return `${comprobante.tipoComprobante} (${comprobante.serie})`
  }
  return comprobante.tipoComprobante
}

function buildComprobanteDescription(comprobante: ComprobanteConfig): string {
  if (comprobante.serie) return `Serie ${comprobante.serie}`
  return `Correlativo ${comprobante.siguienteCorrelativo}`
}

export function useComprobanteOptions({
  enabled,
  idSucursal,
}: UseComprobanteOptionsParams) {
  const [comprobantes, setComprobantes] = useState<ComprobanteConfig[]>([])
  const [loadingComprobantes, setLoadingComprobantes] = useState(false)
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null)
  const [searchComprobante, setSearchComprobante] = useState("")

  const abortRef = useRef<AbortController | null>(null)

  const fetchComprobantes = useCallback(async (sucursalId: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingComprobantes(true)
    setErrorComprobantes(null)

    try {
      const params = new URLSearchParams({
        activo: "ACTIVO",
        idSucursal: String(sucursalId),
      })

      const response = await authFetch(`/api/config/comprobantes?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setComprobantes([])
        setErrorComprobantes(data?.message ?? "Error al obtener comprobantes")
        return
      }

      setComprobantes(toComprobanteList(data))
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
    if (!enabled || typeof idSucursal !== "number" || idSucursal <= 0) {
      abortRef.current?.abort()
      setComprobantes([])
      setErrorComprobantes(null)
      setLoadingComprobantes(false)
      setSearchComprobante("")
      return
    }

    void fetchComprobantes(idSucursal)
  }, [enabled, fetchComprobantes, idSucursal])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const normalizedSearch = searchComprobante.trim().toLowerCase()

  const filteredComprobantes = useMemo(
    () =>
      comprobantes.filter((item) => {
        if (!normalizedSearch) return true
        return (
          item.tipoComprobante.toLowerCase().includes(normalizedSearch) ||
          item.serie.toLowerCase().includes(normalizedSearch)
        )
      }),
    [comprobantes, normalizedSearch]
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
