"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { MetodoPagoActivo } from "@/lib/types/metodo-pago"

interface UseMetodosPagoActivosParams {
  enabled?: boolean
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function isEstadoActivo(value: unknown): boolean {
  if (value === true) return true
  if (value === false) return false
  return typeof value === "string" ? value.trim().toUpperCase() === "ACTIVO" : false
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function toArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data

  const content =
    typeof data === "object" && data !== null && "content" in data
      ? (data as { content?: unknown }).content
      : undefined

  return Array.isArray(content) ? content : []
}

function normalizeCuentas(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const cuenta = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null
      if (!cuenta) return null

      const idMetodoPagoCuenta = Number(
        cuenta.idMetodoPagoCuenta ?? cuenta.id_metodo_pago_cuenta ?? cuenta.id
      )
      const numeroCuenta = typeof cuenta.numeroCuenta === "string" ? cuenta.numeroCuenta.trim() : ""

      if (!Number.isFinite(idMetodoPagoCuenta) || idMetodoPagoCuenta <= 0 || numeroCuenta.length === 0) {
        return null
      }

      return { idMetodoPagoCuenta, numeroCuenta }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function normalizeMetodoPago(value: unknown): MetodoPagoActivo | null {
  const item = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
  if (!item) return null

  const idMetodoPago = Number(item.idMetodoPago ?? item.id_metodo_pago ?? item.id)
  const nombre = typeof item.nombre === "string" ? item.nombre.trim() : ""
  const estado = item.estado ?? item.activo
  const cuentas = normalizeCuentas(item.cuentas)

  if (estado !== undefined && !isEstadoActivo(estado)) return null
  if (!Number.isFinite(idMetodoPago) || idMetodoPago <= 0 || nombre.length === 0) return null

  return { idMetodoPago, nombre, cuentas }
}

export function useMetodosPagoActivos({ enabled = true }: UseMetodosPagoActivosParams = {}) {
  const [methods, setMethods] = useState<MetodoPagoActivo[] | undefined>(enabled ? undefined : [])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchMethods = useCallback(async () => {
    if (!enabled) {
      abortRef.current?.abort()
      setMethods([])
      setLoading(false)
      setError(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch("/api/config/metodos-pago", {
        signal: controller.signal,
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
            : "Error al cargar metodos de pago"
        setMethods([])
        setError(message)
        return
      }

      const normalized = toArray(payload)
        .map((item) => normalizeMetodoPago(item))
        .filter((item): item is MetodoPagoActivo => item !== null)

      setMethods(normalized)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      setMethods([])
      setError(requestError instanceof Error ? requestError.message : "Error inesperado")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [enabled])

  useEffect(() => {
    void fetchMethods()
  }, [fetchMethods])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    methods,
    loading,
    error,
    refreshMethods: fetchMethods,
  }
}
