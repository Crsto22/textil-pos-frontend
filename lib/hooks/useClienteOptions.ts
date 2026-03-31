"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ComboboxOption } from "@/components/ui/combobox"
import { getAvatarColor, getInitials } from "@/components/clientes/clientes.utils"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type { Cliente, ClientePageResponse } from "@/lib/types/cliente"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function toClienteList(data: unknown): Cliente[] {
  const pageData = data as ClientePageResponse | null
  return Array.isArray(pageData?.content) ? pageData.content : []
}

function buildClienteDocumentLabel(cliente: Cliente): string {
  const tipoDocumento =
    typeof cliente.tipoDocumento === "string" ? cliente.tipoDocumento.trim() : ""
  const nroDocumento =
    typeof cliente.nroDocumento === "string" ? cliente.nroDocumento.trim() : ""

  if (tipoDocumento && nroDocumento) {
    return `${tipoDocumento}: ${nroDocumento}`
  }

  return nroDocumento || "Sin documento"
}

function buildClienteDescription(cliente: Cliente): string {
  const documentLabel = buildClienteDocumentLabel(cliente)
  const sucursal =
    typeof cliente.nombreEmpresa === "string" ? cliente.nombreEmpresa.trim() : ""

  return [documentLabel, sucursal].filter((value) => value.length > 0).join(" - ")
}

export function useClienteOptions(enabled: boolean) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [errorClientes, setErrorClientes] = useState<string | null>(null)
  const [searchCliente, setSearchCliente] = useState("")

  const debouncedSearch = useDebouncedValue(searchCliente, SEARCH_DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)

  const fetchListarClientes = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingClientes(true)
    setErrorClientes(null)

    try {
      const response = await authFetch("/api/cliente/listar?page=0", {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setClientes([])
        setErrorClientes(data?.message ?? "Error al obtener clientes")
        return
      }

      setClientes(toClienteList(data))
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setClientes([])
      setErrorClientes(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingClientes(false)
      }
    }
  }, [])

  const fetchBuscarClientes = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingClientes(true)
    setErrorClientes(null)

    try {
      const params = new URLSearchParams({
        q: query,
        page: "0",
      })

      const response = await authFetch(`/api/cliente/buscar?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setClientes([])
        setErrorClientes(data?.message ?? "Error al buscar clientes")
        return
      }

      setClientes(toClienteList(data))
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setClientes([])
      setErrorClientes(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingClientes(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (debouncedSearch !== searchCliente) return

    if (!debouncedSearch.trim()) {
      void fetchListarClientes()
      return
    }

    void fetchBuscarClientes(debouncedSearch.trim())
  }, [
    debouncedSearch,
    enabled,
    fetchBuscarClientes,
    fetchListarClientes,
    searchCliente,
  ])

  useEffect(() => {
    if (enabled) return

    abortRef.current?.abort()
    setClientes([])
    setErrorClientes(null)
    setLoadingClientes(false)
    setSearchCliente("")
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const clienteOptions = useMemo<ComboboxOption[]>(
    () =>
      (Array.isArray(clientes) ? clientes : []).map((cliente) => {
        const color = getAvatarColor(cliente.idCliente)

        return {
          value: String(cliente.idCliente),
          label: cliente.nombres,
          description: buildClienteDescription(cliente),
          avatarText: getInitials(cliente.nombres),
          avatarClassName: `${color.bg} ${color.text}`,
        }
      }),
    [clientes]
  )

  return {
    clientes,
    clienteOptions,
    loadingClientes,
    errorClientes,
    searchCliente,
    setSearchCliente,
    fetchListarClientes,
    fetchBuscarClientes,
  }
}
