"use client"

import Image from "next/image"
import { CubeIcon, MinusIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { PriceSelectorDropdown } from "@/components/ventas/PriceSelectorDropdown"
import type {
    VentaLineaPrecioOption,
    VentaLineaPrecioTipo,
} from "@/lib/types/venta-price"

function getPriceTypeMeta(priceType: VentaLineaPrecioTipo | null) {
    if (priceType === "oferta") {
        return {
            label: "Precio oferta",
            className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        }
    }

    if (priceType === "mayor") {
        return {
            label: "Precio mayor",
            className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        }
    }

    if (priceType === "normal") {
        return {
            label: "Precio normal",
            className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
        }
    }

    return null
}

export interface CartItemData {
    id: number
    varianteId?: number
    nombre: string
    precio: number
    precioSeleccionado?: VentaLineaPrecioTipo
    preciosDisponibles?: VentaLineaPrecioOption[]
    cantidad: number
    stockDisponible?: number | null
    talla: string
    color: string
    imageUrl?: string | null
}

interface CartItemProps {
    item: CartItemData
    onIncrease: (id: number) => void
    onDecrease: (id: number) => void
    onRemove: (id: number) => void
    onSelectPrice?: (item: CartItemData, priceType: VentaLineaPrecioTipo) => void
    onEdit?: (item: CartItemData) => void
    showPriceTypeBadge?: boolean
}

export default function CartItem({
    item,
    onIncrease,
    onDecrease,
    onRemove,
    onSelectPrice,
    onEdit,
    showPriceTypeBadge = false,
}: CartItemProps) {
    const priceOptions = item.preciosDisponibles ?? []
    const canSelectPrice = Boolean(onSelectPrice) && priceOptions.length > 1
    const stockLimit =
        typeof item.stockDisponible === "number" && Number.isFinite(item.stockDisponible)
            ? Math.max(0, Math.trunc(item.stockDisponible))
            : null
    const canIncrease = stockLimit === null ? true : item.cantidad < stockLimit
    const priceTypeMeta = getPriceTypeMeta(
        item.precioSeleccionado ?? priceOptions[0]?.type ?? null
    )

    return (
        <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.nombre}
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-contain p-1"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                        <CubeIcon className="h-5 w-5" />
                    </div>
                )}
            </div>

            {/* Blue accent bar */}
            <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500 opacity-40" />

            {/* Product info */}
            <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
                    {item.nombre}
                </p>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                        {item.talla}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                        {item.color}
                    </span>
                    {/* Edit variant button */}
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item)}
                            title="Editar variante"
                            className="flex items-center gap-0.5 ml-0.5 text-[10px] font-semibold text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                            <PencilSquareIcon className="h-3 w-3" />
                            Editar
                        </button>
                    )}
                </div>
                <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                            {formatMonedaPen(item.precio)}
                        </p>
                        {canSelectPrice ? (
                            <PriceSelectorDropdown
                                options={priceOptions}
                                selectedType={item.precioSeleccionado}
                                onSelect={(priceType) => onSelectPrice?.(item, priceType)}
                                triggerLabel={`Cambiar precio para ${item.nombre}`}
                            />
                        ) : null}
                    </div>
                    {showPriceTypeBadge && priceTypeMeta ? (
                        <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${priceTypeMeta.className}`}
                        >
                            {priceTypeMeta.label}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Qty + remove */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
                    <button onClick={() => onDecrease(item.id)}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:text-slate-800 transition-colors">
                        <MinusIcon className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                        {item.cantidad}
                    </span>
                    <button
                        onClick={() => onIncrease(item.id)}
                        disabled={!canIncrease}
                        className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${canIncrease
                                ? "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:text-slate-800"
                                : "cursor-not-allowed text-slate-300 dark:text-slate-600"
                            }`}
                    >
                        <PlusIcon className="h-3 w-3" />
                    </button>
                </div>
                <button onClick={() => onRemove(item.id)}
                    className="flex items-center gap-0.5 text-[10px] font-extrabold text-slate-400 hover:text-red-500 dark:hover:text-red-400 red-400 transition-colors">
                    <TrashIcon className="h-3 w-3" />
                    <span>Quitar</span>
                </button>
            </div>
        </div>
    )
}
