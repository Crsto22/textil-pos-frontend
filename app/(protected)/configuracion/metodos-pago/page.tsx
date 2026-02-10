"use client"

import { useState } from "react"
import { Banknote, Smartphone, CreditCard, Building } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface PaymentMethod {
    key: string
    label: string
    description: string
    icon: LucideIcon
    activo: boolean
}

const initialMethods: PaymentMethod[] = [
    { key: "efectivo", label: "Efectivo", description: "Pago en efectivo directo", icon: Banknote, activo: true },
    { key: "yape", label: "Yape", description: "Pago con Yape (BCP)", icon: Smartphone, activo: true },
    { key: "plin", label: "Plin", description: "Pago con Plin (BBVA, Interbank, Scotiabank)", icon: Smartphone, activo: true },
    { key: "transferencia", label: "Transferencia", description: "Transferencia bancaria", icon: Building, activo: false },
    { key: "tarjeta", label: "Tarjeta", description: "Visa, Mastercard u otras tarjetas", icon: CreditCard, activo: false },
]

export default function MetodosPagoPage() {
    const [methods, setMethods] = useState(initialMethods)

    const toggleMethod = (key: string) => {
        setMethods(methods.map((m) => m.key === key ? { ...m, activo: !m.activo } : m))
    }

    return (
        <div className="max-w-2xl space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Activa o desactiva los métodos de pago disponibles para tus ventas.
            </p>

            <div className="space-y-3">
                {methods.map((m) => {
                    const Icon = m.icon
                    return (
                        <div
                            key={m.key}
                            className={`bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border shadow-sm p-4 flex items-center justify-between transition-all ${m.activo
                                    ? "border-[#3266E4]/30 dark:border-[#3266E4]/20"
                                    : "border-gray-100 dark:border-[oklch(0.3_0_0)]"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${m.activo
                                        ? "bg-[#3266E4]/10 text-[#3266E4]"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                    }`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{m.label}</p>
                                    <p className="text-xs text-gray-400">{m.description}</p>
                                </div>
                            </div>

                            {/* Toggle */}
                            <button
                                onClick={() => toggleMethod(m.key)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${m.activo ? "bg-[#3266E4]" : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${m.activo ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
