"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ComboboxOption } from "@/components/ui/combobox"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { MetodoPagoActivo } from "@/lib/types/metodo-pago"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
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
  const cuentas = normalizeCuentas(item.cuentas)

  if (!Number.isFinite(idMetodoPago) || idMetodoPago <= 0 || nombre.length === 0) {
    return null
  }

  return { idMetodoPago, nombre, cuentas }
}

function buildMetodoDescription(methodName: string) {
  const normalizedMethod = methodName.trim().toUpperCase()

  switch (normalizedMethod) {
    case "EFECTIVO":
      return "Cobro en caja"
    case "YAPE":
      return "Pago movil con Yape"
    case "PLIN":
      return "Pago movil con Plin"
    case "TRANSFERENCIA":
      return "Transferencia bancaria"
    case "TARJETA":
      return "Debito o credito"
    default:
      return "Metodo de pago configurado"
  }
}

export function useMetodoPagoOptions(enabled = true) {
  const [methods, setMethods] = useState<MetodoPagoActivo[]>([])
  const [loadingMethods, setLoadingMethods] = useState(false)
  const [errorMethods, setErrorMethods] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchMethods = useCallback(async () => {
    if (!enabled) {
      abortRef.current?.abort()
      setMethods([])
      setLoadingMethods(false)
      setErrorMethods(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingMethods(true)
    setErrorMethods(null)

    try {
      const response = await authFetch("/api/config/metodos-pago", {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setMethods([])
        setErrorMethods(data?.message ?? "Error al obtener metodos de pago")
        return
      }

      const normalizedMethods = toArray(data)
        .map((item) => normalizeMetodoPago(item))
        .filter((item): item is MetodoPagoActivo => item !== null)
        .sort((current, next) => current.nombre.localeCompare(next.nombre))

      setMethods(normalizedMethods)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      setMethods([])
      setErrorMethods(
        requestError instanceof Error ? requestError.message : "Error inesperado"
      )
    } finally {
      if (!controller.signal.aborted) {
        setLoadingMethods(false)
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

  const methodOptions = useMemo<ComboboxOption[]>(
    () =>
      methods.map((method) => ({
        value: String(method.idMetodoPago),
        label: method.nombre,
        description: buildMetodoDescription(method.nombre),
      })),
    [methods]
  )

  return {
    methods,
    methodOptions,
    loadingMethods,
    errorMethods,
    refreshMethods: fetchMethods,
  }
}
