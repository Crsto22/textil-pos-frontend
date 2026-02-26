"use client"

import { AlertTriangle } from "lucide-react"

interface PaymentWarningProps {
    visible: boolean
}

export default function PaymentWarning({ visible }: PaymentWarningProps) {
    return (
        <div
            className={[
                "overflow-hidden transition-all duration-300 ease-in-out",
                visible ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
        >
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3.5 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        Verificación de Pago
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5 leading-snug">
                        Verifica si ya te realizaron el pago antes de procesar la venta.
                    </p>
                </div>
            </div>
        </div>
    )
}
