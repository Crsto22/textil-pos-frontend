"use client"

import { useState } from "react"
import { Search, Plus, Pencil, ChevronRight, User } from "lucide-react"

interface Client {
    id: number
    nombre: string
    documento: string
    telefono: string
    email: string
    totalCompras: number
}

const demoClients: Client[] = [
    { id: 1, nombre: "María García López", documento: "12345678", telefono: "987654321", email: "maria@email.com", totalCompras: 12 },
    { id: 2, nombre: "Carlos Rodríguez", documento: "87654321", telefono: "912345678", email: "carlos@email.com", totalCompras: 8 },
    { id: 3, nombre: "Ana Torres Vega", documento: "45678912", telefono: "956789123", email: "ana@email.com", totalCompras: 23 },
    { id: 4, nombre: "Luis Mendoza Ríos", documento: "78912345", telefono: "934567891", email: "luis@email.com", totalCompras: 5 },
    { id: 5, nombre: "Patricia Flores", documento: "32165498", telefono: "978123456", email: "patricia@email.com", totalCompras: 15 },
]

export default function ClientesPage() {
    const [search, setSearch] = useState("")
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    const filtered = demoClients.filter((c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.documento.includes(search)
    )

    return (
        <div className="space-y-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o documento..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors shrink-0">
                    <Plus className="h-4 w-4" />
                    Nuevo cliente
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Client list */}
                <div className="lg:col-span-3 bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-[oklch(0.3_0_0)]">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cliente</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Documento</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Teléfono</th>
                                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Compras</th>
                                    <th className="py-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr
                                        key={c.id}
                                        className={`border-b border-gray-50 dark:border-[oklch(0.2_0_0)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${selectedClient?.id === c.id ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                                        onClick={() => setSelectedClient(c)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-[#3266E4]/10 flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4 text-[#3266E4]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">{c.nombre}</p>
                                                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.documento}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden md:table-cell">{c.telefono}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-[#3266E4]/10 text-[#3266E4] text-xs font-medium">
                                                {c.totalCompras}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1">
                                                <button className="h-7 w-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <ChevronRight className="h-4 w-4 text-gray-300" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Client detail / history */}
                <div className="lg:col-span-2 bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm p-5">
                    {selectedClient ? (
                        <div className="space-y-4">
                            <div className="text-center pb-4 border-b border-gray-100 dark:border-[oklch(0.3_0_0)]">
                                <div className="h-14 w-14 rounded-full bg-[#3266E4]/10 flex items-center justify-center mx-auto mb-2">
                                    <User className="h-7 w-7 text-[#3266E4]" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{selectedClient.nombre}</h3>
                                <p className="text-xs text-gray-400">{selectedClient.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400">Documento</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{selectedClient.documento}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Teléfono</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{selectedClient.telefono}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Historial de compras</h4>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Venta #{1000 + i}</p>
                                                <p className="text-xs text-gray-400">Hace {i * 3} días</p>
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">S/ {(50 * i + 30).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
                            <User className="h-10 w-10 mb-2 opacity-30" />
                            <p>Selecciona un cliente para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
