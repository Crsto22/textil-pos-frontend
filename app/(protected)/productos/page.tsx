"use client"

import { useState } from "react"
import { Search, Plus, Pencil, Power, Eye, EyeOff } from "lucide-react"

interface Product {
    id: number
    nombre: string
    precio: number
    stock: number
    colores: string[]
    tallas: string[]
    activo: boolean
}

const demoProducts: Product[] = [
    { id: 1, nombre: "Polo Algodón Básico", precio: 35.00, stock: 120, colores: ["Negro", "Blanco", "Azul", "Rojo"], tallas: ["S", "M", "L", "XL"], activo: true },
    { id: 2, nombre: "Jean Slim Fit", precio: 89.90, stock: 45, colores: ["Azul", "Negro"], tallas: ["28", "30", "32", "34", "36"], activo: true },
    { id: 3, nombre: "Camisa Formal Slim", precio: 65.00, stock: 32, colores: ["Blanco", "Celeste", "Rosa"], tallas: ["S", "M", "L"], activo: true },
    { id: 4, nombre: "Short Deportivo", precio: 29.90, stock: 80, colores: ["Negro", "Gris", "Azul"], tallas: ["S", "M", "L", "XL"], activo: true },
    { id: 5, nombre: "Blusa Estampada", precio: 45.00, stock: 58, colores: ["Rojo", "Floral", "Azul"], tallas: ["S", "M", "L"], activo: true },
    { id: 6, nombre: "Chaqueta Denim", precio: 120.00, stock: 15, colores: ["Azul", "Negro"], tallas: ["M", "L", "XL"], activo: true },
    { id: 7, nombre: "Vestido Casual", precio: 79.90, stock: 0, colores: ["Negro", "Rojo"], tallas: ["S", "M", "L"], activo: false },
    { id: 8, nombre: "Pantalón Cargo", precio: 75.00, stock: 28, colores: ["Beige", "Verde", "Negro"], tallas: ["30", "32", "34"], activo: true },
]

const colorBadgeMap: Record<string, string> = {
    Negro: "bg-gray-800",
    Blanco: "bg-white border border-gray-300",
    Azul: "bg-blue-500",
    Rojo: "bg-red-500",
    Celeste: "bg-sky-300",
    Rosa: "bg-pink-400",
    Gris: "bg-gray-400",
    Floral: "bg-gradient-to-r from-pink-400 to-yellow-300",
    Beige: "bg-amber-200",
    Verde: "bg-green-600",
}

export default function ProductosPage() {
    const [search, setSearch] = useState("")
    const [products, setProducts] = useState(demoProducts)

    const filtered = products.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase())
    )

    const toggleActive = (id: number) => {
        setProducts(products.map((p) => p.id === id ? { ...p, activo: !p.activo } : p))
    }

    return (
        <div className="space-y-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors shrink-0">
                    <Plus className="h-4 w-4" />
                    Agregar producto
                </button>
            </div>

            {/* Product grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                    <div
                        key={p.id}
                        className={`bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm overflow-hidden transition-all hover:shadow-md ${!p.activo ? "opacity-60" : ""}`}
                    >
                        {/* Color strip */}
                        <div className="h-2 bg-gradient-to-r from-[#3266E4] to-[#5B8DEF]" />

                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.nombre}</h3>
                                    <p className="text-lg font-bold text-[#3266E4] mt-0.5">S/ {p.precio.toFixed(2)}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${p.stock > 20
                                        ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                        : p.stock > 0
                                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                    }`}>
                                    Stock: {p.stock}
                                </span>
                            </div>

                            {/* Colors */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400 mr-1">Colores:</span>
                                {p.colores.map((c) => (
                                    <div
                                        key={c}
                                        className={`h-5 w-5 rounded-full ${colorBadgeMap[c] || "bg-gray-300"}`}
                                        title={c}
                                    />
                                ))}
                            </div>

                            {/* Sizes */}
                            <div className="flex flex-wrap gap-1">
                                {p.tallas.map((t) => (
                                    <span key={t} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                                        {t}
                                    </span>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-[oklch(0.2_0_0)]">
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => toggleActive(p.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${p.activo
                                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                                            : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20"
                                        }`}
                                >
                                    {p.activo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    {p.activo ? "Desactivar" : "Activar"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
