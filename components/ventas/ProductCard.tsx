"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import type { ProductoResumen } from "@/lib/types/producto"

interface ProductCardProps {
    product: ProductoResumen
    onAdd: (product: ProductoResumen) => void
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
    /* Use first color's principal image, or picsum fallback */
    const firstColor = product.colores?.[0]
    const imgSrc = firstColor?.imagenPrincipal?.url
        ?? `https://picsum.photos/seed/prod${product.idProducto}/300/300`

    const priceLabel = product.precioMin != null
        ? product.precioMin === product.precioMax || product.precioMax == null
            ? `S/ ${product.precioMin.toFixed(2)}`
            : `S/ ${product.precioMin.toFixed(2)} – ${product.precioMax!.toFixed(2)}`
        : "—"

    const totalTallas = [...new Set(product.colores.flatMap(c => c.tallas.map(t => t.nombre)))]

    return (
        <div
            onClick={() => onAdd(product)}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
        >
            {/* Image */}
            <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <Image
                    src={imgSrc}
                    alt={product.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                />
                {/* Color count badge */}
                {product.colores.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                        {product.colores.slice(0, 4).map(c => (
                            <span
                                key={c.colorId}
                                title={c.nombre}
                                className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm"
                                style={{ backgroundColor: c.hex ?? "#888" }}
                            />
                        ))}
                        {product.colores.length > 4 && (
                            <span className="text-[9px] font-bold text-white bg-black/40 px-1 rounded-full">
                                +{product.colores.length - 4}
                            </span>
                        )}
                    </div>
                )}
                {/* Add overlay */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 rounded-full p-2 shadow-lg">
                        <Plus className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                    {product.nombreCategoria}
                </p>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                    {product.nombre}
                </h3>
                <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-base font-bold text-blue-600 dark:text-blue-400">{priceLabel}</p>
                    {totalTallas.length > 0 && (
                        <p className="text-[10px] text-slate-400">{totalTallas.slice(0, 4).join(" · ")}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
