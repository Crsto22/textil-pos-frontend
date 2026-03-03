"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    ArrowPathIcon,
    CheckIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { Cliente } from "@/lib/types/cliente"
import type { PageResponse } from "@/lib/types/usuario"

/* ── Public types ─────────────────────────────────────────── */
export interface ClientSelection {
    idCliente: number | null
    nombre: string
}

const GENERIC_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Genérico" }

interface Props {
    selected: ClientSelection
    onSelect: (c: ClientSelection) => void
}

/* ── Component ────────────────────────────────────────────── */
export default function ClientSelect({ selected, onSelect }: Props) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)

    const ref = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    /* ── Debounce search input (300ms) ── */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
        return () => clearTimeout(t)
    }, [query])

    /* ── Fetch clientes when debounced query or dropdown opens ── */
    const fetchClientes = useCallback(async (q: string, pg: number, append = false) => {
        if (!append) setLoading(true)
        else setLoadingMore(true)

        try {
            const endpoint = q.length > 0
                ? `/api/cliente/buscar?q=${encodeURIComponent(q)}&page=${pg}`
                : `/api/cliente/listar?page=${pg}`

            const res = await authFetch(endpoint)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data: PageResponse<Cliente> = await res.json()
            const list = Array.isArray(data.content) ? data.content : []

            setClientes(prev => append ? [...prev, ...list] : list)
            setPage(pg)
            setHasMore(!data.last)
        } catch {
            if (!append) setClientes([])
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    /* Trigger fetch on debounced query change */
    useEffect(() => {
        if (!open) return
        fetchClientes(debouncedQuery, 0)
    }, [debouncedQuery, open, fetchClientes])

    /* ── Close on outside click ── */
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false); setQuery("")
            }
        }
        document.addEventListener("mousedown", h)
        return () => document.removeEventListener("mousedown", h)
    }, [])

    /* Focus input when opened */
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    /* ── Handlers ── */
    const handleSelect = (c: Cliente) => {
        onSelect({ idCliente: c.idCliente, nombre: c.nombres })
        setOpen(false)
        setQuery("")
    }
    const handleSelectGeneric = () => {
        onSelect(GENERIC_CLIENT)
        setOpen(false)
        setQuery("")
    }
    const handleLoadMore = () => {
        fetchClientes(debouncedQuery, page + 1, true)
    }

    return (
        <div ref={ref} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={[
                    "w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    open
                        ? "bg-slate-50 dark:bg-slate-800 ring-1 ring-blue-400/60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                ].join(" ")}
            >
                <UserCircleIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="flex-1 text-left truncate text-slate-500 dark:text-slate-400">
                    {selected.nombre}
                </span>
                <ChevronDownIcon className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-black/10">
                    {/* Search bar */}
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-3 py-2">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <input ref={inputRef} type="text" placeholder="Buscar por nombre o DNI..."
                            value={query} onChange={e => setQuery(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none" />
                        {loading && <ArrowPathIcon className="h-3.5 w-3.5 text-slate-400 animate-spin shrink-0" />}
                    </div>

                    {/* Client list */}
                    <div className="max-h-56 overflow-y-auto py-1">
                        {/* Generic client option — always first */}
                        <button type="button" onClick={handleSelectGeneric}
                            className={[
                                "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors",
                                selected.idCliente === null
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold"
                                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                            ].join(" ")}>
                            <span className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                                selected.idCliente === null ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500",
                            ].join(" ")}>
                                G
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="truncate font-medium">Cliente Genérico</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Sin documento</p>
                            </div>
                            {selected.idCliente === null && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                        </button>

                        {/* Separator */}
                        <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-800" />

                        {/* Loading state */}
                        {loading && clientes.length === 0 && (
                            <div className="flex items-center justify-center gap-2 px-3 py-6">
                                <ArrowPathIcon className="h-4 w-4 text-slate-400 animate-spin" />
                                <span className="text-xs text-slate-400">Buscando clientes...</span>
                            </div>
                        )}

                        {/* No results */}
                        {!loading && clientes.length === 0 && (
                            <p className="px-3 py-4 text-center text-xs text-slate-400">
                                {debouncedQuery ? "Sin resultados para esta búsqueda" : "No hay clientes registrados"}
                            </p>
                        )}

                        {/* Client rows */}
                        {clientes.map(c => {
                            const active = selected.idCliente === c.idCliente
                            const docLabel = c.tipoDocumento && c.nroDocumento
                                ? `${c.tipoDocumento}: ${c.nroDocumento}`
                                : c.nroDocumento || "Sin documento"
                            return (
                                <button key={c.idCliente} type="button" onClick={() => handleSelect(c)}
                                    className={[
                                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors",
                                        active
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold"
                                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                    ].join(" ")}>
                                    <span className={[
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase",
                                        active ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500",
                                    ].join(" ")}>
                                        {c.nombres.charAt(0)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{c.nombres}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{docLabel}</p>
                                    </div>
                                    {active && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                                </button>
                            )
                        })}

                        {/* Load more button */}
                        {hasMore && (
                            <button type="button" onClick={handleLoadMore} disabled={loadingMore}
                                className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50">
                                {loadingMore ? (
                                    <><ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> Cargando...</>
                                ) : (
                                    "Cargar más clientes"
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
