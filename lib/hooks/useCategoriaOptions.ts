"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
  Categoria,
  CategoriaCreateRequest,
  PageResponse,
} from "@/lib/types/categoria"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado"
}

function toCategoriaList(data: unknown): Categoria[] {
  const pageData = data as PageResponse<Categoria> | null
  return Array.isArray(pageData?.content) ? pageData.content : []
}

function isCategoriaEntity(value: unknown): value is Categoria {
  if (!value || typeof value !== "object") return false

  const record = value as Record<string, unknown>

  return (
    typeof record.idCategoria === "number" &&
    typeof record.nombreCategoria === "string" &&
    typeof record.estado === "string"
  )
}

function getCategoriaFromCreatePayload(payload: unknown): Categoria | null {
  if (isCategoriaEntity(payload)) return payload
  if (!payload || typeof payload !== "object") return null

  const payloadRecord = payload as Record<string, unknown>

  for (const key of ["categoria", "data", "payload", "result"]) {
    const candidate = payloadRecord[key]
    if (isCategoriaEntity(candidate)) {
      return candidate
    }
  }

  return null
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase()
}

function findExactCategoriaMatch(
  categorias: Categoria[],
  nombreCategoria: string,
  idSucursal?: number | null
) {
  const normalizedNombre = normalizeName(nombreCategoria)
  if (!normalizedNombre) return null

  return (
    categorias.find((categoria) => {
      if (normalizeName(categoria.nombreCategoria) !== normalizedNombre) return false
      if (typeof idSucursal !== "number" || idSucursal <= 0) return true
      return categoria.idSucursal === idSucursal
    }) ?? null
  )
}

function upsertCategoria(categorias: Categoria[], categoria: Categoria) {
  const next = categorias.filter((item) => item.idCategoria !== categoria.idCategoria)
  return [categoria, ...next]
}

interface CreateCategoriaResult {
  success: boolean
  categoria: Categoria | null
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

  const refreshCurrentView = useCallback(async () => {
    if (searchCategoria.trim()) {
      await fetchBuscarCategorias(searchCategoria)
      return
    }

    await fetchListarCategorias()
  }, [fetchBuscarCategorias, fetchListarCategorias, searchCategoria])

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

  const findCategoriaByName = useCallback(
    async (nombreCategoria: string, idSucursal?: number | null) => {
      const trimmedNombre = nombreCategoria.trim()
      if (!trimmedNombre) return null

      try {
        const response = await authFetch(
          `/api/categoria/buscar?q=${encodeURIComponent(trimmedNombre)}&page=0`
        )
        const data = await parseJsonSafe(response)
        if (!response.ok) return null

        const content = toCategoriaList(data)
        return findExactCategoriaMatch(content, trimmedNombre, idSucursal) ?? null
      } catch {
        return null
      }
    },
    []
  )

  const createCategoriaAndReturn = useCallback(
    async (payload: CategoriaCreateRequest): Promise<CreateCategoriaResult> => {
      try {
        const response = await authFetch("/api/categoria/insertar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setErrorCategorias(message)
          toast.error(message)
          return { success: false, categoria: null }
        }

        const createdCategoria =
          getCategoriaFromCreatePayload(data) ??
          (await findCategoriaByName(payload.nombreCategoria, payload.idSucursal))

        if (createdCategoria) {
          setCategorias((previous) => upsertCategoria(previous, createdCategoria))
        } else {
          await refreshCurrentView()
        }

        toast.success("Categoria creada exitosamente")
        return {
          success: true,
          categoria: createdCategoria,
        }
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setErrorCategorias(message)
        toast.error(message)
        return { success: false, categoria: null }
      }
    },
    [findCategoriaByName, refreshCurrentView]
  )

  const createCategoria = useCallback(
    async (payload: CategoriaCreateRequest) => {
      const result = await createCategoriaAndReturn(payload)
      return result.success
    },
    [createCategoriaAndReturn]
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
    refreshCurrentView,
    createCategoriaAndReturn,
    createCategoria,
  }
}
