"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
    BanknotesIcon,
    DevicePhoneMobileIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
} from "@heroicons/react/24/outline"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ComponentType, SVGProps } from "react"

const ICON_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    EFECTIVO: BanknotesIcon,
    YAPE: DevicePhoneMobileIcon,
    PLIN: DevicePhoneMobileIcon,
    TRANSFERENCIA: BuildingLibraryIcon,
    TARJETA: CreditCardIcon,
}

const PAYMENT_LOGOS: Record<string, { src: string; alt: string }> = {
    YAPE: {
        src: "/img/yape-app-seeklogo.png",
        alt: "Logo de Yape",
    },
    PLIN: {
        src: "/img/plin-seeklogo.png",
        alt: "Logo de Plin",
    },
}

interface MetodoPago {
    idMetodoPago: number
    nombre: string
    descripcion?: string
    estado: "ACTIVO" | "INACTIVO"
}

interface MetodoPagoRaw {
    idMetodoPago?: number | string | null
    id_metodo_pago?: number | string | null
    id?: number | string | null
    nombre?: unknown
    descripcion?: unknown
    estado?: unknown
    activo?: unknown
}

const LABELS: Record<string, string> = {
    EFECTIVO: "Efectivo",
    YAPE: "Yape",
    PLIN: "Plin",
    TRANSFERENCIA: "Transferencia",
    TARJETA: "Tarjeta",
}

const DESCRIPTIONS: Record<string, string> = {
    EFECTIVO: "Pago en efectivo directo",
    YAPE: "Pago con Yape (BCP)",
    PLIN: "Pago con Plin (BBVA, Interbank, Scotiabank)",
    TRANSFERENCIA: "Transferencia bancaria",
    TARJETA: "Visa, Mastercard u otras tarjetas",
}

function normalizeEstado(value: unknown): "ACTIVO" | "INACTIVO" {
    if (value === true) return "ACTIVO"
    if (value === false) return "INACTIVO"
    if (typeof value !== "string") return "INACTIVO"
    return value.trim().toUpperCase() === "ACTIVO" ? "ACTIVO" : "INACTIVO"
}

function normalizeMethods(data: unknown): MetodoPago[] {
    const pageContent =
        typeof data === "object" && data !== null && "content" in data
            ? (data as { content?: unknown }).content
            : undefined
    const raw = Array.isArray(data) ? data : Array.isArray(pageContent) ? pageContent : []

    return raw
        .map((value): MetodoPago | null => {
            const item = (typeof value === "object" && value !== null ? value : {}) as MetodoPagoRaw
            const idMetodoPago = Number(item.idMetodoPago ?? item.id_metodo_pago ?? item.id)
            const nombre = typeof item.nombre === "string" ? item.nombre : ""
            if (!Number.isFinite(idMetodoPago) || idMetodoPago <= 0 || !nombre) return null
            return {
                idMetodoPago,
                nombre,
                descripcion: typeof item.descripcion === "string" ? item.descripcion : undefined,
                estado: normalizeEstado(item.estado ?? item.activo),
            }
        })
        .filter((item): item is MetodoPago => item !== null)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000)
        return () => clearTimeout(t)
    }, [onClose])

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg text-sm font-semibold animate-in slide-in-from-bottom-4 ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
        </div>
    )
}

export default function MetodosPagoPage() {
    const [methods, setMethods] = useState<MetodoPago[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [toggling, setToggling] = useState<number | null>(null)
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

    const loadMethods = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await authFetch("/api/config/metodos-pago")
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.message ?? "Error al cargar metodos de pago")
            }
            const data = await res.json()
            setMethods(normalizeMethods(data))
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error inesperado")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMethods()
    }, [loadMethods])

    const toggleMethod = async (metodo: MetodoPago) => {
        const nuevoEstado: MetodoPago["estado"] = metodo.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO"
        setToggling(metodo.idMetodoPago)

        setMethods((prev) =>
            prev.map((m) => (m.idMetodoPago === metodo.idMetodoPago ? { ...m, estado: nuevoEstado } : m))
        )

        try {
            const res = await authFetch(`/api/config/metodos-pago/${metodo.idMetodoPago}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstado }),
            })

            if (!res.ok) {
                setMethods((prev) =>
                    prev.map((m) => (m.idMetodoPago === metodo.idMetodoPago ? { ...m, estado: metodo.estado } : m))
                )
                const data = await res.json().catch(() => null)
                const msg =
                    res.status === 403
                        ? "No tienes permisos para realizar esta accion"
                        : data?.message ?? `Error ${res.status} al actualizar`
                setToast({ message: msg, type: "error" })
                return
            }

            const responseData = await res.json().catch(() => null)
            const backendEstado = normalizeEstado(responseData?.estado ?? responseData?.activo ?? nuevoEstado)
            setMethods((prev) =>
                prev.map((m) => (m.idMetodoPago === metodo.idMetodoPago ? { ...m, estado: backendEstado } : m))
            )

            const label = LABELS[metodo.nombre] ?? metodo.nombre
            setToast({
                message: `${label} ${backendEstado === "ACTIVO" ? "activado" : "desactivado"}`,
                type: "success",
            })
        } catch {
            setMethods((prev) =>
                prev.map((m) => (m.idMetodoPago === metodo.idMetodoPago ? { ...m, estado: metodo.estado } : m))
            )
            setToast({ message: "Error de conexion", type: "error" })
        } finally {
            setToggling(null)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Activa o desactiva los metodos de pago disponibles para tus ventas.
            </p>

            {loading && (
                <div className="flex items-center justify-center gap-2 py-12">
                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                    <span className="text-sm text-slate-400">Cargando metodos...</span>
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
                        const isActive = m.estado === "ACTIVO"
                        const methodKey = m.nombre.trim().toUpperCase()
                        const Icon = ICON_MAP[methodKey] ?? ICON_MAP[m.nombre] ?? CreditCardIcon
                        const label = LABELS[methodKey] ?? LABELS[m.nombre] ?? m.nombre
                        const desc = m.descripcion ?? DESCRIPTIONS[methodKey] ?? DESCRIPTIONS[m.nombre] ?? ""
                        const logo = PAYMENT_LOGOS[methodKey]
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
                                        {logo ? (
                                            <Image
                                                src={logo.src}
                                                alt={logo.alt}
                                                width={26}
                                                height={26}
                                                className="h-6 w-6 object-contain"
                                            />
                                        ) : (
                                            <Icon className="h-5 w-5" />
                                        )}
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
                        <p className="text-center text-sm text-slate-400 py-8">No se encontraron metodos de pago configurados</p>
                    )}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
