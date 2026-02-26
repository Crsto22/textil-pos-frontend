"use client"

import { useState, useEffect, useCallback } from "react"
import {
    BanknotesIcon,
    DevicePhoneMobileIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
} from "@heroicons/react/24/outline"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ComponentType, SVGProps } from "react"

/* ── Icon lookup ─────────────────────────────────────────── */
const ICON_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    EFECTIVO: BanknotesIcon,
    YAPE: DevicePhoneMobileIcon,
    PLIN: DevicePhoneMobileIcon,
    TRANSFERENCIA: BuildingLibraryIcon,
    TARJETA: CreditCardIcon,
}

/* ── Backend shape — exact fields from Spring Boot ───────── */
interface MetodoPago {
    idMetodoPago: number
    nombre: string
    descripcion?: string
    activo: "ACTIVO" | "INACTIVO"
}

/* ── Friendly labels ─────────────────────────────────────── */
const LABELS: Record<string, string> = {
    EFECTIVO: "Efectivo", YAPE: "Yape", PLIN: "Plin",
    TRANSFERENCIA: "Transferencia", TARJETA: "Tarjeta",
}
const DESCRIPTIONS: Record<string, string> = {
    EFECTIVO: "Pago en efectivo directo",
    YAPE: "Pago con Yape (BCP)",
    PLIN: "Pago con Plin (BBVA, Interbank, Scotiabank)",
    TRANSFERENCIA: "Transferencia bancaria",
    TARJETA: "Visa, Mastercard u otras tarjetas",
}

/* ── Toast ────────────────────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg text-sm font-semibold animate-in slide-in-from-bottom-4 ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function MetodosPagoPage() {
    const [methods, setMethods] = useState<MetodoPago[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [toggling, setToggling] = useState<number | null>(null)
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

    /* ── Fetch all methods ── */
    const loadMethods = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await authFetch("/api/config/metodos-pago")
            if (!res.ok) throw new Error("Error al cargar métodos de pago")
            const data = await res.json()

            /* Extract array — handle plain array or Spring Page wrapper */
            const raw = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []
            setMethods(raw as MetodoPago[])
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error inesperado")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadMethods() }, [loadMethods])

    /* ── Toggle method activo ── */
    const toggleMethod = async (metodo: MetodoPago) => {
        const nuevoEstado = metodo.activo === "ACTIVO" ? "INACTIVO" : "ACTIVO"
        setToggling(metodo.idMetodoPago)

        // Optimistic update
        setMethods(prev =>
            prev.map(m => m.idMetodoPago === metodo.idMetodoPago ? { ...m, activo: nuevoEstado } : m)
        )

        try {
            const res = await authFetch(`/api/config/metodos-pago/${metodo.idMetodoPago}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activo: nuevoEstado }),
            })

            if (!res.ok) {
                // Rollback
                setMethods(prev =>
                    prev.map(m => m.idMetodoPago === metodo.idMetodoPago ? { ...m, activo: metodo.activo } : m)
                )
                const data = await res.json().catch(() => null)
                const msg = res.status === 403
                    ? "No tienes permisos para realizar esta acción"
                    : (data?.message ?? `Error ${res.status} al actualizar`)
                setToast({ message: msg, type: "error" })
            } else {
                const label = LABELS[metodo.nombre] ?? metodo.nombre
                setToast({
                    message: `${label} ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"}`,
                    type: "success",
                })
            }
        } catch {
            // Rollback
            setMethods(prev =>
                prev.map(m => m.idMetodoPago === metodo.idMetodoPago ? { ...m, activo: metodo.activo } : m)
            )
            setToast({ message: "Error de conexión", type: "error" })
        } finally {
            setToggling(null)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Activa o desactiva los métodos de pago disponibles para tus ventas.
            </p>

            {loading && (
                <div className="flex items-center justify-center gap-2 py-12">
                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                    <span className="text-sm text-slate-400">Cargando métodos...</span>
                </div>
            )}

            {!loading && error && (
                <div className="text-center py-12 space-y-2">
                    <p className="text-sm text-red-500 font-semibold">{error}</p>
                    <button onClick={loadMethods} className="text-xs text-blue-500 hover:underline">Reintentar</button>
                </div>
            )}

            {!loading && !error && (
                <div className="space-y-3">
                    {methods.map((m) => {
                        const isActive = m.activo === "ACTIVO"
                        const Icon = ICON_MAP[m.nombre] ?? CreditCardIcon
                        const label = LABELS[m.nombre] ?? m.nombre
                        const desc = m.descripcion ?? DESCRIPTIONS[m.nombre] ?? ""
                        const isToggling = toggling === m.idMetodoPago

                        return (
                            <div
                                key={m.idMetodoPago}
                                className={`bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border shadow-sm p-4 flex items-center justify-between transition-all ${isActive
                                    ? "border-[#3266E4]/30 dark:border-[#3266E4]/20"
                                    : "border-gray-100 dark:border-[oklch(0.3_0_0)]"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isActive
                                        ? "bg-[#3266E4]/10 text-[#3266E4]"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                        }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                                        <p className="text-xs text-gray-400">{desc}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleMethod(m)}
                                    disabled={isToggling}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isActive ? "bg-[#3266E4]" : "bg-gray-300 dark:bg-gray-600"}`}
                                >
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>
                        )
                    })}

                    {methods.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-8">No se encontraron métodos de pago configurados</p>
                    )}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
