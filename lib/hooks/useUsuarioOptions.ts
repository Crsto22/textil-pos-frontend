"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type { ComboboxOption } from "@/components/ui/combobox"
import type { PageResponse, Usuario } from "@/lib/types/usuario"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function toUsuarioList(data: unknown): Usuario[] {
  const pageData = data as PageResponse<Usuario> | null
  return Array.isArray(pageData?.content) ? pageData.content : []
}

function buildUsuarioLabel(usuario: Usuario): string {
  const nombreCompleto = `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim()
  return nombreCompleto.length > 0 ? nombreCompleto : `Usuario #${usuario.idUsuario}`
}

function buildUsuarioDescription(usuario: Usuario): string {
  const rol = typeof usuario.rol === "string" ? usuario.rol.trim() : ""
  const sucursal =
    typeof usuario.nombreSucursal === "string" ? usuario.nombreSucursal.trim() : ""
  return [rol, sucursal].filter((value) => value.length > 0).join(" - ")
}

export function useUsuarioOptions(enabled: boolean) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null)
  const [searchUsuario, setSearchUsuario] = useState("")

  const debouncedSearch = useDebouncedValue(searchUsuario, SEARCH_DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)

  const fetchListarUsuarios = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingUsuarios(true)
    setErrorUsuarios(null)

    try {
      const response = await authFetch("/api/usuarios/listar?page=0", {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setUsuarios([])
        setErrorUsuarios(data?.message ?? "Error al obtener usuarios")
        return
      }

      setUsuarios(toUsuarioList(data))
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setUsuarios([])
      setErrorUsuarios(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingUsuarios(false)
      }
    }
  }, [])

  const fetchBuscarUsuarios = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingUsuarios(true)
    setErrorUsuarios(null)

    try {
      const params = new URLSearchParams({
        q: query,
        page: "0",
      })

      const response = await authFetch(`/api/usuarios/buscar?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setUsuarios([])
        setErrorUsuarios(data?.message ?? "Error al buscar usuarios")
        return
      }

      setUsuarios(toUsuarioList(data))
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setUsuarios([])
      setErrorUsuarios(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoadingUsuarios(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (debouncedSearch !== searchUsuario) return

    if (!debouncedSearch.trim()) {
      void fetchListarUsuarios()
      return
    }

    void fetchBuscarUsuarios(debouncedSearch.trim())
  }, [
    debouncedSearch,
    enabled,
    fetchBuscarUsuarios,
    fetchListarUsuarios,
    searchUsuario,
  ])

  useEffect(() => {
    if (enabled) return

    abortRef.current?.abort()
    setUsuarios([])
    setErrorUsuarios(null)
    setLoadingUsuarios(false)
    setSearchUsuario("")
  }, [enabled])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const usuarioOptions = useMemo<ComboboxOption[]>(
    () =>
      (Array.isArray(usuarios) ? usuarios : []).map((usuario) => ({
        value: String(usuario.idUsuario),
        label: buildUsuarioLabel(usuario),
        description: buildUsuarioDescription(usuario),
      })),
    [usuarios]
  )

  return {
    usuarios,
    usuarioOptions,
    loadingUsuarios,
    errorUsuarios,
    searchUsuario,
    setSearchUsuario,
    fetchListarUsuarios,
    fetchBuscarUsuarios,
  }
}
