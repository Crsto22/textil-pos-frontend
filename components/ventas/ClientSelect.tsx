"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowPathIcon, CheckIcon, ChevronUpDownIcon, PlusIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { getAvatarColor, getInitials } from "@/components/clientes/clientes.utils"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { Cliente } from "@/lib/types/cliente"
import type { ClienteCreatePrefill } from "@/lib/types/cliente"
import type { PageResponse } from "@/lib/types/usuario"
import { cn } from "@/lib/utils"

export interface ClientSelection {
  idCliente: number | null
  nombre: string
}

const GENERIC_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Generico" }

interface Props {
  selected: ClientSelection
  onSelect: (client: ClientSelection) => void
  onCreateClientRequest?: (prefill: ClienteCreatePrefill) => void
}

function getSelectedAvatarClasses(idCliente: number | null) {
  if (typeof idCliente !== "number" || idCliente <= 0) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }

  const color = getAvatarColor(idCliente)
  return `${color.bg} ${color.text}`
}

function buildClientCreatePrefill(query: string): ClienteCreatePrefill {
  const trimmedQuery = query.trim()

  if (/^\d{8}$/.test(trimmedQuery)) {
    return {
      tipoDocumento: "DNI",
      nroDocumento: trimmedQuery,
      autoLookup: true,
    }
  }

  if (/^\d{11}$/.test(trimmedQuery)) {
    return {
      tipoDocumento: "RUC",
      nroDocumento: trimmedQuery,
      autoLookup: true,
    }
  }

  if (trimmedQuery.length > 0) {
    return {
      nombres: trimmedQuery,
    }
  }

  return {}
}

function getCreateActionLabel(query: string) {
  const trimmedQuery = query.trim()

  if (/^\d{8}$/.test(trimmedQuery)) {
    return `Crear cliente con DNI ${trimmedQuery}`
  }

  if (/^\d{11}$/.test(trimmedQuery)) {
    return `Crear cliente con RUC ${trimmedQuery}`
  }

  if (trimmedQuery.length > 0) {
    return `Crear cliente "${trimmedQuery}"`
  }

  return "Nuevo cliente"
}

export default function ClientSelect({ selected, onSelect, onCreateClientRequest }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const fetchClientes = useCallback(async (search: string, nextPage: number, append = false) => {
    if (!append) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const endpoint =
        search.length > 0
          ? `/api/cliente/buscar?q=${encodeURIComponent(search)}&page=${nextPage}`
          : `/api/cliente/listar?page=${nextPage}`

      const response = await authFetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: PageResponse<Cliente> = await response.json()
      const list = Array.isArray(data.content) ? data.content : []

      setClientes((previous) => (append ? [...previous, ...list] : list))
      setPage(nextPage)
      setHasMore(!data.last)
    } catch {
      if (!append) {
        setClientes([])
      }
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void fetchClientes(debouncedQuery, 0)
  }, [debouncedQuery, fetchClientes, open])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setQuery("")
      setDebouncedQuery("")
    }
  }, [])

  const handleSelect = useCallback(
    (client: Cliente) => {
      onSelect({ idCliente: client.idCliente, nombre: client.nombres })
      handleOpenChange(false)
    },
    [handleOpenChange, onSelect]
  )

  const handleSelectGeneric = useCallback(() => {
    onSelect(GENERIC_CLIENT)
    handleOpenChange(false)
  }, [handleOpenChange, onSelect])

  const handleLoadMore = useCallback(() => {
    void fetchClientes(debouncedQuery, page + 1, true)
  }, [debouncedQuery, fetchClientes, page])

  const handleCreateClientRequest = useCallback(() => {
    if (!onCreateClientRequest) return

    onCreateClientRequest(buildClientCreatePrefill(query))
    handleOpenChange(false)
  }, [handleOpenChange, onCreateClientRequest, query])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                getSelectedAvatarClasses(selected.idCliente)
              )}
            >
              {selected.idCliente === null ? "G" : getInitials(selected.nombre)}
            </span>
            <span className="text-left">{selected.nombre}</span>
          </span>
          <ChevronUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente..."
            className="h-8"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {onCreateClientRequest && (
            <>
              <button
                type="button"
                onClick={handleCreateClientRequest}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-accent"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PlusIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{getCreateActionLabel(query)}</span>
                </span>
              </button>

              <div className="my-1 border-t" />
            </>
          )}

          <button
            type="button"
            onClick={handleSelectGeneric}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              selected.idCliente === null && "bg-accent text-accent-foreground"
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                G
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">Cliente Generico</span>
                <span className="block truncate text-xs text-muted-foreground">Sin documento</span>
              </span>
            </span>
            <CheckIcon
              className={cn(
                "h-4 w-4 shrink-0",
                selected.idCliente === null ? "opacity-100" : "opacity-0"
              )}
            />
          </button>

          <div className="my-1 border-t" />

          {loading && clientes.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Buscando clientes...</span>
            </div>
          ) : clientes.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              {debouncedQuery ? "Sin resultados para esta busqueda" : "No hay clientes registrados."}
            </p>
          ) : (
            clientes.map((client) => {
              const isSelected = selected.idCliente === client.idCliente
              const documentLabel =
                client.tipoDocumento && client.nroDocumento
                  ? `${client.tipoDocumento}: ${client.nroDocumento}`
                  : client.nroDocumento || "Sin documento"
              const color = getAvatarColor(client.idCliente)

              return (
                <button
                  key={client.idCliente}
                  type="button"
                  onClick={() => handleSelect(client)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                        color.bg,
                        color.text
                      )}
                    >
                      {getInitials(client.nombres)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{client.nombres}</span>
                      <span className="block truncate text-xs text-muted-foreground">{documentLabel}</span>
                    </span>
                  </span>
                  <CheckIcon className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                </button>
              )
            })
          )}

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-sm px-2 py-2 text-sm text-primary transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              {loadingMore && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              <span>{loadingMore ? "Cargando..." : "Cargar mas clientes"}</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
