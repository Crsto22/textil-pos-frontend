"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { Empresa } from "@/lib/types/empresa"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useEmpresaOptions(enabled: boolean) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(false)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchEmpresas = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingEmpresas(true)
    setErrorEmpresas(null)

    try {
      const response = await authFetch("/api/empresa/listar", {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setEmpresas([])
        setErrorEmpresas(data?.message ?? "Error al obtener empresas")
        return
      }

      const list = Array.isArray(data) ? (data as Empresa[]) : []
      setEmpresas(list)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setEmpresas([])
      setErrorEmpresas(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingEmpresas(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void fetchEmpresas()
  }, [enabled, fetchEmpresas])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    empresas,
    loadingEmpresas,
    errorEmpresas,
    fetchEmpresas,
  }
}
