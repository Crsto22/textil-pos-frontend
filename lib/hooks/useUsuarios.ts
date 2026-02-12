"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  PageResponse,
  Usuario,
  UsuarioCreateRequest,
  UsuarioUpdateRequest,
} from "@/lib/types/usuario"

interface SearchTotals {
  totalPages: number
  totalElements: number
}

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 401) return "Sesión expirada, vuelve a iniciar sesión"
  if (status === 403) return "No tienes permisos"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

export function useUsuarios() {
  const { isLoading: isAuthLoading } = useAuth()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchPage, setSearchPage] = useState(0)
  const [searchResults, setSearchResults] = useState<Usuario[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const isSearchMode = debouncedSearch.trim().length > 0

  const fetchUsuarios = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/usuarios/listar?page=${pageNumber}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        return
      }

      const pageData = data as PageResponse<Usuario>
      setUsuarios(pageData.content)
      setTotalPages(pageData.totalPages)
      setTotalElements(pageData.totalElements)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  const fetchBuscar = useCallback(async (query: string, pageNumber: number) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      return
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    setSearching(true)
    setError(null)

    try {
      const response = await authFetch(
        `/api/usuarios/buscar?q=${encodeURIComponent(query)}&page=${pageNumber}`,
        { signal: controller.signal }
      )
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setSearchResults([])
        setSearchTotals({ totalPages: 0, totalElements: 0 })
        return
      }

      const pageData = data as PageResponse<Usuario>
      setSearchResults(pageData.content)
      setSearchTotals({
        totalPages: pageData.totalPages,
        totalElements: pageData.totalElements,
      })
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setSearchPage(0)
    }, 400)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isAuthLoading) return
    fetchUsuarios(page)
  }, [fetchUsuarios, isAuthLoading, page])

  useEffect(() => {
    if (isAuthLoading) return

    if (!debouncedSearch.trim()) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      setSearching(false)
      return
    }

    fetchBuscar(debouncedSearch, searchPage)
  }, [debouncedSearch, fetchBuscar, isAuthLoading, searchPage])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
      searchAbortRef.current?.abort()
    }
  }, [])

  const createUsuario = useCallback(
    async (payload: UsuarioCreateRequest) => {
      try {
        const response = await authFetch("/api/auth/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Usuario registrado exitosamente")
        await fetchUsuarios(page)
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [fetchUsuarios, page]
  )

  const updateUsuario = useCallback(
    async (id: number, payload: UsuarioUpdateRequest) => {
      try {
        const response = await authFetch(`/api/usuarios/actualizar/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Usuario actualizado exitosamente")
        await fetchUsuarios(page)
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [fetchUsuarios, page]
  )

  const deleteUsuario = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`/api/usuarios/eliminar/${id}`, {
          method: "DELETE",
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Usuario eliminado lógicamente")

        setUsuarios((previous) => previous.filter((usuario) => usuario.idUsuario !== id))
        setTotalElements((previous) => Math.max(0, previous - 1))

        await fetchUsuarios(page)
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [fetchUsuarios, page]
  )

  const displayedUsers = useMemo(
    () => (isSearchMode ? searchResults : usuarios),
    [isSearchMode, searchResults, usuarios]
  )

  const displayedTotalPages = isSearchMode ? searchTotals.totalPages : totalPages
  const displayedTotalElements = isSearchMode
    ? searchTotals.totalElements
    : totalElements
  const displayedPage = isSearchMode ? searchPage : page
  const displayedLoading = isSearchMode ? searching : loading

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => {
      if (isSearchMode) {
        setSearchPage(value)
        return
      }
      setPage(value)
    },
    [isSearchMode]
  )

  const activeCount = useMemo(
    () => usuarios.filter((usuario) => usuario.estado === "ACTIVO").length,
    [usuarios]
  )

  return {
    usuarios,
    page,
    totalPages,
    totalElements,
    loading,
    error,

    search,
    debouncedSearch,
    isSearchMode,
    searchResults,
    searchPage,
    searchTotals,
    searching,

    displayedUsers,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    activeCount,

    setSearch,
    setPage,
    setSearchPage,

    fetchUsuarios,
    fetchBuscar,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  }
}
