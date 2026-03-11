"use client"

import Image from "next/image"
import { CubeIcon, MinusIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"

export interface CartItemData {
    id: number
    varianteId?: number
    nombre: string
    precio: number
    cantidad: number
    talla: string
    color: string
    imageUrl?: string | null
}

interface CartItemProps {
    item: CartItemData
    onIncrease: (id: number) => void
    onDecrease: (id: number) => void
    onRemove: (id: number) => void
    onEdit?: (item: CartItemData) => void
}

export default function CartItem({ item, onIncrease, onDecrease, onRemove, onEdit }: CartItemProps) {
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
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    S/ {(item.precio * item.cantidad).toFixed(2)}
                </p>
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
                    <button onClick={() => onIncrease(item.id)}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:text-slate-800 transition-colors">
                        <PlusIcon className="h-3 w-3" />
                    </button>
                </div>
                <button onClick={() => onRemove(item.id)}
                    className="flex items-center gap-0.5 text-[10px] font-medium text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <TrashIcon className="h-3 w-3" />
                    <span>Quitar</span>
                </button>
            </div>
        </div>
    )
}
