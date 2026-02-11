"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    TagIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import type { Talla, PageResponse } from "@/lib/types/talla"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TallasPage() {
    const { isLoading: isAuthLoading } = useAuth()
    const [search, setSearch] = useState("")
    const [tallas, setTallas] = useState<Talla[]>([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    // Estado del modal Nueva Talla
    const [openModal, setOpenModal] = useState(false)
    const [nuevaTalla, setNuevaTalla] = useState({ nombre: "", estado: "ACTIVO" })

    const fetchTallas = useCallback(async (pageNumber: number, signal?: AbortSignal) => {
        setIsLoading(true)
        setError(null)

        try {
            const res = await authFetch(`/api/talla/listar?page=${pageNumber}`, { signal })

            const data = await res.json().catch(() => null)

            // Si la petición fue abortada entre el fetch y el json, salir silenciosamente
            if (signal?.aborted) return

            if (!res.ok) {
                throw new Error(data?.message ?? "Error al obtener tallas")
            }

            const page = data as PageResponse<Talla>

            setTallas(page.content)
            setTotalPages(page.totalPages)
            setTotalElements(page.totalElements)
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return
            setError(err instanceof Error ? err.message : "Error inesperado")
        } finally {
            if (!signal?.aborted) setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        // Esperar a que el auth context termine el refresh silencioso
        if (isAuthLoading) return

        // Abortar petición anterior si el usuario cambió de página rápido
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        fetchTallas(page, controller.signal)

        return () => controller.abort()
    }, [fetchTallas, page, isAuthLoading])

    const handleGuardar = () => {
        // TODO: conectar con API
        console.log("Guardar talla:", nuevaTalla)
        setNuevaTalla({ nombre: "", estado: "ACTIVO" })
        setOpenModal(false)
    }

    const handleOpenChange = (open: boolean) => {
        setOpenModal(open)
        if (!open) setNuevaTalla({ nombre: "", estado: "ACTIVO" })
    }

    const filtered = tallas.filter((t) =>
        t.nombre.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tallas</h1>
                    <p className="text-sm text-muted-foreground">
                        Administra las tallas disponibles para tus productos
                    </p>
                </div>
                <Dialog open={openModal} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
                            <PlusIcon className="h-4 w-4" />
                            Nueva Talla
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Nueva Talla</DialogTitle>
                            <DialogDescription>
                                Completa los datos para crear una nueva talla.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Ej. S, M, L, XL..."
                                    value={nuevaTalla.nombre}
                                    onChange={(e) =>
                                        setNuevaTalla((prev) => ({ ...prev, nombre: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="estado">Estado</Label>
                                <Select
                                    value={nuevaTalla.estado}
                                    onValueChange={(value) =>
                                        setNuevaTalla((prev) => ({ ...prev, estado: value }))
                                    }
                                >
                                    <SelectTrigger className="w-full" id="estado">
                                        <SelectValue placeholder="Selecciona un estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVO">Activo</SelectItem>
                                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                onClick={handleGuardar}
                                disabled={!nuevaTalla.nombre.trim()}
                            >
                                Guardar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar talla..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                    <button
                        onClick={() => fetchTallas(page)}
                        className="ml-2 underline hover:no-underline"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-bold text-muted-foreground">ID</th>
                            <th className="px-4 py-3 text-left font-bold text-muted-foreground">Nombre</th>
                            <th className="px-4 py-3 text-left font-bold text-muted-foreground">Estado</th>
                            <th className="px-4 py-3 text-right font-bold text-muted-foreground">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                    Cargando tallas...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                    No se encontraron tallas
                                </td>
                            </tr>
                        ) : (
                            filtered.map((talla) => (
                                <tr key={talla.idTalla} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-muted-foreground">{talla.idTalla}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                <TagIcon className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <span className="font-medium">{talla.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                talla.estado === "ACTIVO"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                        >
                                            {talla.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                title="Editar"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination + Summary */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Mostrando {filtered.length} de {totalElements} tallas
                    {totalPages > 1 && ` — Página ${page + 1} de ${totalPages}`}
                </p>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeftIcon className="h-3.5 w-3.5" />
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
