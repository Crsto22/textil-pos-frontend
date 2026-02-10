"use client"

import { useState } from "react"
import { MagnifyingGlassIcon, PlusIcon, ShieldExclamationIcon, ShieldCheckIcon, BoltIcon } from "@heroicons/react/24/outline"

interface UserData {
    id: number
    nombre: string
    apellido: string
    email: string
    rol: string
    sucursal: string
    activo: boolean
}

const demoUsers: UserData[] = [
    { id: 1, nombre: "Bryan", apellido: "Torres", email: "bryan@email.com", rol: "Administrador", sucursal: "Principal", activo: true },
    { id: 2, nombre: "María", apellido: "García", email: "maria@email.com", rol: "Vendedor", sucursal: "Principal", activo: true },
    { id: 3, nombre: "Carlos", apellido: "López", email: "carlos@email.com", rol: "Vendedor", sucursal: "Sucursal Norte", activo: true },
    { id: 4, nombre: "Ana", apellido: "Rodríguez", email: "ana@email.com", rol: "Vendedor", sucursal: "Sucursal Sur", activo: false },
    { id: 5, nombre: "Luis", apellido: "Mendoza", email: "luis@email.com", rol: "Vendedor", sucursal: "Principal", activo: true },
]

const rolBadge: Record<string, string> = {
    Administrador: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400",
    Vendedor: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

export default function UsuariosPage() {
    const [search, setSearch] = useState("")
    const [users, setUsers] = useState(demoUsers)

    const filtered = users.filter((u) =>
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.includes(search)
    )

    const toggleActive = (id: number) => {
        setUsers(users.map((u) => u.id === id ? { ...u, activo: !u.activo } : u))
    }

    return (
        <div className="space-y-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors shrink-0">
                    <PlusIcon className="h-4 w-4" />
                    Nuevo usuario
                </button>
            </div>

            {/* Users table */}
            <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-[oklch(0.3_0_0)]">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuario</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Email</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rol</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Sucursal</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                                <th className="py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id} className="border-b border-gray-50 dark:border-[oklch(0.2_0_0)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${u.rol === "Administrador" ? "bg-purple-100 dark:bg-purple-500/20" : "bg-[#3266E4]/10"}`}>
                                                {u.rol === "Administrador" ? (
                                                    <ShieldCheckIcon className="h-4 w-4 text-purple-600" />
                                                ) : (
                                                    <ShieldExclamationIcon className="h-4 w-4 text-[#3266E4]" />
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{u.nombre} {u.apellido}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${rolBadge[u.rol] || "bg-gray-100 text-gray-600"}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden md:table-cell">{u.sucursal}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${u.activo ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => toggleActive(u.id)}
                                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${u.activo
                                                    ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    : "text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                                                }`}
                                            title={u.activo ? "Desactivar" : "Activar"}
                                        >
                                            <BoltIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
