"use client"

import { Smartphone, ArrowLeftRight, Banknote, CreditCard } from "lucide-react"
import type { ReactNode } from "react"

export type PaymentKey = string   // dynamic from backend: "EFECTIVO", "YAPE", etc.

/* Map backend enum → backend enum (identity, kept for VentaRequest consistency) */
export const PAYMENT_BACKEND_MAP: Record<string, string> = {
    EFECTIVO: "EFECTIVO",
    YAPE: "YAPE",
    PLIN: "PLIN",
    TRANSFERENCIA: "TRANSFERENCIA",
    TARJETA: "TARJETA",
    /* legacy lowercase keys for backwards compat */
    efectivo: "EFECTIVO",
    yape: "YAPE",
    plin: "PLIN",
    transferencia: "TRANSFERENCIA",
    tarjeta: "TARJETA",
}

/* ── Visual config per method ────────────────────────────── */
interface MethodStyle {
    label: string
    color: string
    activeRing: string
    activeBg: string
    icon: ReactNode
}

const METHOD_STYLES: Record<string, MethodStyle> = {
    EFECTIVO: {
        label: "Efectivo",
        color: "text-emerald-600 dark:text-emerald-400",
        activeRing: "ring-2 ring-emerald-500",
        activeBg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600",
        icon: <Banknote className="h-5 w-5" />,
    },
    YAPE: {
        label: "Yape",
        color: "text-purple-600 dark:text-purple-400",
        activeRing: "ring-2 ring-purple-500",
        activeBg: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600",
        icon: <Smartphone className="h-5 w-5" />,
    },
    PLIN: {
        label: "Plin",
        color: "text-teal-600 dark:text-teal-400",
        activeRing: "ring-2 ring-teal-500",
        activeBg: "bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-600",
        icon: <Smartphone className="h-5 w-5" />,
    },
    TRANSFERENCIA: {
        label: "Transfer",
        color: "text-blue-600 dark:text-blue-400",
        activeRing: "ring-2 ring-blue-500",
        activeBg: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600",
        icon: <ArrowLeftRight className="h-5 w-5" />,
    },
    TARJETA: {
        label: "Tarjeta",
        color: "text-amber-600 dark:text-amber-400",
        activeRing: "ring-2 ring-amber-500",
        activeBg: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600",
        icon: <CreditCard className="h-5 w-5" />,
    },
}

/* Fallback style for unknown methods */
const DEFAULT_STYLE: MethodStyle = {
    label: "Otro",
    color: "text-slate-600 dark:text-slate-400",
    activeRing: "ring-2 ring-slate-500",
    activeBg: "bg-slate-50 dark:bg-slate-900/20 border-slate-300 dark:border-slate-600",
    icon: <CreditCard className="h-5 w-5" />,
}

/* ── Backend method shape ────────────────────────────────── */
export interface MetodoPagoActivo {
    idMetodoPago: number
    nombre: string    // "EFECTIVO", "YAPE", etc.
}

interface PaymentMethodProps {
    selected: PaymentKey | null
    onSelect: (key: PaymentKey) => void
    /** Active methods from backend. If undefined, shows a loading placeholder. */
    methods?: MetodoPagoActivo[]
}

export default function PaymentMethod({ selected, onSelect, methods }: PaymentMethodProps) {
    if (!methods) {
        return (
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 animate-pulse" />
                ))}
            </div>
        )
    }

    if (methods.length === 0) {
        return (
            <p className="text-center text-xs text-slate-400 py-3">
                Sin métodos de pago activos
            </p>
        )
    }

    const cols = methods.length <= 3 ? "grid-cols-3" : "grid-cols-4"

    return (
        <div className={`grid ${cols} gap-2`}>
            {methods.map((m) => {
                const style = METHOD_STYLES[m.nombre] ?? { ...DEFAULT_STYLE, label: m.nombre }
                const isActive = selected === m.nombre
                return (
                    <button
                        key={m.idMetodoPago}
                        type="button"
                        onClick={() => onSelect(m.nombre)}
                        className={[
                            "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all duration-150 font-semibold text-xs",
                            isActive
                                ? `${style.activeBg} ${style.activeRing} ${style.color}`
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
                        ].join(" ")}
                    >
                        <span className={isActive ? style.color : "text-slate-400 dark:text-slate-500"}>
                            {style.icon}
                        </span>
                        {style.label}
                    </button>
                )
            })}
        </div>
    )
}
