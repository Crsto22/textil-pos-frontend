"use client"

import { useState } from "react"
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    SwatchIcon,
} from "@heroicons/react/24/outline"

interface Color {
    id: number
    nombre: string
    hexadecimal: string
    activo: boolean
}

const demoColores: Color[] = [
    { id: 1, nombre: "Negro", hexadecimal: "#000000", activo: true },
    { id: 2, nombre: "Blanco", hexadecimal: "#FFFFFF", activo: true },
    { id: 3, nombre: "Azul", hexadecimal: "#3B82F6", activo: true },
    { id: 4, nombre: "Rojo", hexadecimal: "#EF4444", activo: true },
    { id: 5, nombre: "Verde", hexadecimal: "#22C55E", activo: true },
    { id: 6, nombre: "Gris", hexadecimal: "#6B7280", activo: true },
    { id: 7, nombre: "Rosa", hexadecimal: "#EC4899", activo: true },
    { id: 8, nombre: "Celeste", hexadecimal: "#38BDF8", activo: true },
    { id: 9, nombre: "Beige", hexadecimal: "#D2B48C", activo: true },
    { id: 10, nombre: "Floral", hexadecimal: "#F472B6", activo: false },
]

export default function ColoresPage() {
    const [search, setSearch] = useState("")
    const [colores] = useState<Color[]>(demoColores)

    const filtered = colores.filter((c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Colores</h1>
                    <p className="text-sm text-muted-foreground">
                        Administra los colores disponibles para tus productos
                    </p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4" />
                    Nuevo Color
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar color..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Color</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Muestra</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hexadecimal</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((color) => (
                            <tr key={color.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                            <SwatchIcon className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <span className="font-medium">{color.nombre}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="inline-block h-7 w-7 rounded-full border-2 border-muted shadow-sm"
                                            style={{ backgroundColor: color.hexadecimal }}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {color.hexadecimal}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            color.activo
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        }`}
                                    >
                                        {color.activo ? "Activo" : "Inactivo"}
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
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No se encontraron colores
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <p className="text-xs text-muted-foreground">
                Mostrando {filtered.length} de {colores.length} colores
            </p>
        </div>
    )
}
