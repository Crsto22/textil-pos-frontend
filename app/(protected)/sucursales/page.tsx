"use client"

import { useState } from "react"
import { PlusIcon, MapPinIcon, UsersIcon, PencilSquareIcon } from "@heroicons/react/24/outline"

interface Branch {
    id: number
    nombre: string
    direccion: string
    telefono: string
    usuarios: string[]
}

const demoBranches: Branch[] = [
    { id: 1, nombre: "Sucursal Principal", direccion: "Av. Ejemplo 123, Lima", telefono: "01-2345678", usuarios: ["Bryan Torres", "María García", "Luis Mendoza"] },
    { id: 2, nombre: "Sucursal Norte", direccion: "Jr. Norte 456, Los Olivos", telefono: "01-8765432", usuarios: ["Carlos López"] },
    { id: 3, nombre: "Sucursal Sur", direccion: "Av. Sur 789, Surco", telefono: "01-3456789", usuarios: ["Ana Rodríguez"] },
]

export default function SucursalesPage() {
    const [branches] = useState(demoBranches)

    return (
        <div className="space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{branches.length} sucursales registradas</p>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors">
                    <PlusIcon className="h-4 w-4" />
                    Nueva sucursal
                </button>
            </div>

            {/* Branch cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {branches.map((b) => (
                    <div key={b.id} className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-[#3266E4]/10 flex items-center justify-center">
                                    <MapPinIcon className="h-5 w-5 text-[#3266E4]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{b.nombre}</h3>
                                    <p className="text-xs text-gray-400">{b.telefono}</p>
                                </div>
                            </div>
                            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>{b.direccion}</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                <UsersIcon className="h-3.5 w-3.5" />
                                <span>Usuarios asignados ({b.usuarios.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {b.usuarios.map((u) => (
                                    <span key={u} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-xs text-gray-600 dark:text-gray-300 font-medium">
                                        {u}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
