"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowPathIcon,
  BoltIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { getAvatarColor, getInitials } from "@/components/clientes/clientes.utils"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { Cliente, ClienteCreatePrefill, TipoDocumento } from "@/lib/types/cliente"
import type { PageResponse } from "@/lib/types/usuario"
import { cn } from "@/lib/utils"
import type { ClientSelection } from "./ClientSelect"

interface Props {
  selected: ClientSelection
  onSelect: (client: ClientSelection) => void
  onCreateClientRequest?: (prefill: ClienteCreatePrefill) => void
  tipoDocumentoFilter?: TipoDocumento | null
  searchPlaceholder?: string
}

const GENERIC_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Generico" }

function toClientSelection(client: Cliente): ClientSelection {
  return {
    idCliente: client.idCliente,
    nombre: client.nombres,
    tipoDocumento: client.tipoDocumento,
    nroDocumento: client.nroDocumento,
    telefono: client.telefono,
    correo: client.correo,
    direccion: client.direccion,
    estado: client.estado,
  }
}

function buildClientCreatePrefill(
  query: string,
  tipoDocumentoFilter: TipoDocumento | null
): ClienteCreatePrefill {
  const q = query.trim()
  if (/^\d{8}$/.test(q)) return { tipoDocumento: "DNI", nroDocumento: q, autoLookup: true }
  if (/^\d{11}$/.test(q)) return { tipoDocumento: "RUC", nroDocumento: q, autoLookup: true }
  if (q.length > 0) {
    return tipoDocumentoFilter === "RUC"
      ? { tipoDocumento: "RUC", nombres: q }
      : { nombres: q }
  }
  return tipoDocumentoFilter === "RUC" ? { tipoDocumento: "RUC" } : {}
}

function getCreateActionLabel(query: string) {
  const q = query.trim()
  if (/^\d{8}$/.test(q)) return `Crear cliente con DNI ${q}`
  if (/^\d{11}$/.test(q)) return `Crear cliente con RUC ${q}`
  if (q.length > 0) return `Crear "${q}"`
  return "Nuevo cliente"
}

export default function ClientSelectSheetContent({
  selected,
  onSelect,
  onCreateClientRequest,
  tipoDocumentoFilter = null,
  searchPlaceholder = "Buscar por nombre, DNI, RUC...",
}: Props) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [quickMode, setQuickMode] = useState(false)
  const [quickPhone, setQuickPhone] = useState("")
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)
  const quickInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  const fetchClientes = useCallback(
    async (search: string, nextPage: number, append = false) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ page: String(nextPage) })
        if (search.length > 0) params.set("q", search)
        if (tipoDocumentoFilter) params.set("tipoDocumento", tipoDocumentoFilter)

        const endpoint =
          search.length > 0
            ? `/api/cliente/buscar?${params.toString()}`
            : `/api/cliente/listar?${params.toString()}`

        const response = await authFetch(endpoint)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data: PageResponse<Cliente> = await response.json()
        const list = Array.isArray(data.content) ? data.content : []
        setClientes((prev) => (append ? [...prev, ...list] : list))
        setPage(nextPage)
        setHasMore(!data.last)
      } catch {
        if (!append) setClientes([])
        setHasMore(false)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [tipoDocumentoFilter]
  )

  useEffect(() => {
    void fetchClientes(debouncedQuery, 0)
  }, [debouncedQuery, fetchClientes])

  const callQuickClientApi = useCallback(
    async (phone: string) => {
      setQuickLoading(true)
      setQuickError(null)
      try {
        const response = await authFetch("/api/cliente/rapido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefono: phone }),
        })
        if (!response.ok) {
          const text = await response.text()
          let message = "Error al crear cliente rápido"
          try {
            const json = JSON.parse(text)
            message = json.message || json.error || message
          } catch {
            if (text) message = text
          }
          setQuickError(message)
          return
        }
        const client: Cliente = await response.json()
        onSelect(toClientSelection(client))
      } catch {
        setQuickError("No se pudo conectar al servidor")
      } finally {
        setQuickLoading(false)
      }
    },
    [onSelect]
  )

  const handleQuickSubmit = useCallback(async () => {
    const phone = quickPhone.trim()
    if (phone.length !== 9) {
      setQuickError("El número debe tener exactamente 9 dígitos")
      return
    }
    await callQuickClientApi(phone)
  }, [quickPhone, callQuickClientApi])

  const handleSelect = useCallback(
    (client: Cliente) => {
      onSelect(toClientSelection(client))
    },
    [onSelect]
  )

  return (
    <div className="flex flex-col gap-0">
      {/* Buscador */}
      <div className="relative px-4 pb-3">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
        />
      </div>

      {/* Quick mode */}
      {quickMode ? (
        <div className="mx-4 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            Cliente rápido por celular
          </p>
          <input
            ref={quickInputRef}
            value={quickPhone}
            onChange={(e) => {
              setQuickPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
              setQuickError(null)
            }}
            onKeyDown={(e) => { if (e.key === "Enter") void handleQuickSubmit() }}
            placeholder="999999999"
            type="tel"
            maxLength={9}
            inputMode="numeric"
            disabled={quickLoading}
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none dark:border-amber-500/40 dark:bg-slate-900"
          />
          {quickError && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{quickError}</p>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={() => void handleQuickSubmit()}
              disabled={quickLoading || quickPhone.length !== 9}
            >
              {quickLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => { setQuickMode(false); setQuickPhone(""); setQuickError(null) }}
              disabled={quickLoading}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Acciones fijas */}
      <div className="space-y-0.5 px-2">
        {onCreateClientRequest && (
          <>
            <button
              type="button"
              onClick={() => onCreateClientRequest(buildClientCreatePrefill(query, tipoDocumentoFilter))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PlusIcon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-primary">
                {getCreateActionLabel(query)}
              </span>
            </button>

            {/^\d{9}$/.test(query.trim()) ? (
              <button
                type="button"
                onClick={() => void callQuickClientApi(query.trim())}
                disabled={quickLoading}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800/60"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  {quickLoading
                    ? <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    : <BoltIcon className="h-4 w-4" />
                  }
                </span>
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Crear cliente rápido con {query.trim()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Busca o crea por celular</p>
                </div>
              </button>
            ) : !quickMode ? (
              <button
                type="button"
                onClick={() => {
                  setQuickMode(true)
                  setTimeout(() => quickInputRef.current?.focus(), 50)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <BoltIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Crear cliente rápido
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Solo con número de celular</p>
                </div>
              </button>
            ) : null}

            <div className="mx-2 my-1.5 border-t border-slate-100 dark:border-slate-700/60" />
          </>
        )}

        {/* Cliente Generico */}
        {!tipoDocumentoFilter && (
          <>
            <button
              type="button"
              onClick={() => onSelect(GENERIC_CLIENT)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                selected.idCliente === null
                  ? "bg-slate-100 dark:bg-slate-700/60"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                G
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Cliente Generico</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sin documento</p>
              </div>
              {selected.idCliente === null && (
                <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" />
              )}
            </button>
            <div className="mx-2 my-1.5 border-t border-slate-100 dark:border-slate-700/60" />
          </>
        )}

        {/* Lista de clientes */}
        {loading && clientes.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Buscando clientes...
          </div>
        ) : clientes.length === 0 ? (
          <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
            {debouncedQuery ? "Sin resultados para esta búsqueda." : "No hay clientes registrados."}
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
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-700/60"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                    color.bg,
                    color.text
                  )}
                >
                  {getInitials(client.nombres)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {client.nombres}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {documentLabel}
                    {client.telefono ? ` · ${client.telefono}` : ""}
                  </p>
                </div>
                {isSelected && <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" />}
              </button>
            )
          })
        )}

        {hasMore && (
          <button
            type="button"
            onClick={() => void fetchClientes(debouncedQuery, page + 1, true)}
            disabled={loadingMore}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-primary transition hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800/60"
          >
            {loadingMore && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {loadingMore ? "Cargando..." : "Cargar más"}
          </button>
        )}
      </div>
    </div>
  )
}
