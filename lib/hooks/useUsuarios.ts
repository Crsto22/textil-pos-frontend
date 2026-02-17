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
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
  PageResponse,
  Usuario,
  UsuarioCreateRequest,
  UsuarioRoleFilter,
  UsuarioResetPasswordRequest,
  UsuarioUpdateRequest,
} from "@/lib/types/usuario"
import {
  ALL_USUARIO_BRANCH_FILTER,
  ALL_USUARIO_ROLE_FILTER,
  usuarioRolRequiresSucursal,
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

function hasValidSucursalId(idSucursal: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
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
  const [roleFilter, setRoleFilter] =
    useState<UsuarioRoleFilter>(ALL_USUARIO_ROLE_FILTER)
  const [branchFilter, setBranchFilter] = useState<string>(
    ALL_USUARIO_BRANCH_FILTER
  )
  const [searchPage, setSearchPage] = useState(0)
  const resetSearchPage = useCallback(() => {
    setSearchPage(0)
  }, [])
  const debouncedSearch = useDebouncedValue(
    search,
    SEARCH_DEBOUNCE_MS,
    resetSearchPage
  )
  const [searchResults, setSearchResults] = useState<Usuario[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const hasRoleFilter = roleFilter !== ALL_USUARIO_ROLE_FILTER
  const parsedBranchFilter = Number(branchFilter)
  const hasBranchFilter =
    branchFilter !== ALL_USUARIO_BRANCH_FILTER &&
    Number.isInteger(parsedBranchFilter) &&
    parsedBranchFilter > 0
  const hasActiveFilters = hasRoleFilter || hasBranchFilter
  const isSearchMode = debouncedSearch.trim().length > 0 || hasActiveFilters

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

  const fetchBuscar = useCallback(
    async (
      query: string,
      pageNumber: number,
      roleFilterValue: UsuarioRoleFilter,
      branchFilterValue: string
    ) => {
    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    setSearching(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        page: String(pageNumber),
      })

      if (roleFilterValue !== ALL_USUARIO_ROLE_FILTER) {
        params.set("rol", roleFilterValue)
      }

      const parsedBranchId = Number(branchFilterValue)
      if (
        branchFilterValue !== ALL_USUARIO_BRANCH_FILTER &&
        Number.isInteger(parsedBranchId) &&
        parsedBranchId > 0
      ) {
        params.set("idSucursal", String(parsedBranchId))
      }

      const response = await authFetch(
        `/api/usuarios/buscar?${params.toString()}`,
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
    },
    []
  )

  useEffect(() => {
    if (isAuthLoading || isSearchMode) return
    fetchUsuarios(page)
  }, [fetchUsuarios, isAuthLoading, isSearchMode, page])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isSearchMode) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      setSearching(false)
      return
    }

    fetchBuscar(debouncedSearch, searchPage, roleFilter, branchFilter)
  }, [
    branchFilter,
    debouncedSearch,
    fetchBuscar,
    isAuthLoading,
    isSearchMode,
    roleFilter,
    searchPage,
  ])

  useEffect(() => {
    setSearchPage(0)
  }, [branchFilter, roleFilter])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
      searchAbortRef.current?.abort()
    }
  }, [])

  const refreshCurrentView = useCallback(async () => {
    if (isSearchMode) {
      await fetchBuscar(debouncedSearch, searchPage, roleFilter, branchFilter)
      return
    }

    await fetchUsuarios(page)
  }, [
    branchFilter,
    debouncedSearch,
    fetchBuscar,
    fetchUsuarios,
    isSearchMode,
    page,
    roleFilter,
    searchPage,
  ])

  const createUsuario = useCallback(
    async (payload: UsuarioCreateRequest) => {
      const normalizedPayload: UsuarioCreateRequest = {
        ...payload,
        idSucursal: usuarioRolRequiresSucursal(payload.rol) ? payload.idSucursal : null,
      }

      if (
        usuarioRolRequiresSucursal(normalizedPayload.rol) &&
        !hasValidSucursalId(normalizedPayload.idSucursal)
      ) {
        const message = "Debe seleccionar una sucursal para el rol seleccionado"
        setError(message)
        toast.error(message)
        return false
      }

      try {
        const response = await authFetch("/api/auth/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Usuario registrado exitosamente")
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentView]
  )

  const updateUsuario = useCallback(
    async (id: number, payload: UsuarioUpdateRequest) => {
      const normalizedPayload: UsuarioUpdateRequest = {
        ...payload,
        idSucursal: usuarioRolRequiresSucursal(payload.rol) ? payload.idSucursal : null,
      }

      if (
        usuarioRolRequiresSucursal(normalizedPayload.rol) &&
        !hasValidSucursalId(normalizedPayload.idSucursal)
      ) {
        const message = "Debe seleccionar una sucursal para el rol seleccionado"
        setError(message)
        toast.error(message)
        return false
      }

      try {
        const response = await authFetch(`/api/usuarios/actualizar/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Usuario actualizado exitosamente")
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentView]
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

        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentView]
  )

  const resetUsuarioPassword = useCallback(
    async (id: number, payload: UsuarioResetPasswordRequest) => {
      setIsResettingPassword(true)
      try {
        const response = await authFetch(`/api/usuarios/resetear-password/${id}`, {
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

        toast.success(data?.message ?? "Contrasena reseteada exitosamente")
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsResettingPassword(false)
      }
    },
    []
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
    roleFilter,
    branchFilter,
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
    setRoleFilter,
    setBranchFilter,
    setPage,
    setSearchPage,

    fetchUsuarios,
    fetchBuscar,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    resetUsuarioPassword,
    isResettingPassword,
  }
}
