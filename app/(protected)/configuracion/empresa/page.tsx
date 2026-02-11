"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
    BuildingOffice2Icon,
    ArrowUpTrayIcon,
    HashtagIcon,
    EnvelopeIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import type { Empresa } from "@/lib/types/empresa"
import { toast } from "sonner"

interface FormErrors {
    nombre?: string
    ruc?: string
    correo?: string
    razonSocial?: string
}

export default function ConfigEmpresaPage() {
    const { isLoading: isAuthLoading } = useAuth()
    const [empresa, setEmpresa] = useState<Empresa | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    // Form state
    const [nombre, setNombre] = useState("")
    const [ruc, setRuc] = useState("")
    const [razonSocial, setRazonSocial] = useState("")
    const [correo, setCorreo] = useState("")
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)

    // Sync form fields when empresa loads
    const syncForm = useCallback((emp: Empresa) => {
        setNombre(emp.nombre)
        setRuc(emp.ruc)
        setRazonSocial(emp.razonSocial)
        setCorreo(emp.correo)
    }, [])

    // Check if form has unsaved changes
    const hasChanges =
        empresa !== null &&
        (nombre !== empresa.nombre ||
            ruc !== empresa.ruc ||
            razonSocial !== empresa.razonSocial ||
            correo !== empresa.correo)

    // Fetch empresa
    useEffect(() => {
        if (isAuthLoading) return

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        const fetchEmpresa = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const res = await authFetch("/api/empresa/listar", {
                    signal: controller.signal,
                })

                const data = await res.json().catch(() => null)

                if (controller.signal.aborted) return

                if (!res.ok) {
                    throw new Error(data?.message ?? "Error al obtener datos de la empresa")
                }

                const empresas = data as Empresa[]
                const emp = empresas.length > 0 ? empresas[0] : null
                setEmpresa(emp)
                if (emp) syncForm(emp)
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return
                setError(err instanceof Error ? err.message : "Error inesperado")
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }

        fetchEmpresa()

        return () => controller.abort()
    }, [isAuthLoading, syncForm])

    // Validation
    const validate = (): boolean => {
        const errors: FormErrors = {}

        if (!nombre.trim()) {
            errors.nombre = "El nombre es requerido"
        }

        if (!ruc.trim()) {
            errors.ruc = "El RUC es requerido"
        } else if (!/^\d{11}$/.test(ruc.trim())) {
            errors.ruc = "El RUC debe tener exactamente 11 dígitos"
        }

        if (!correo.trim()) {
            errors.correo = "El correo es requerido"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
            errors.correo = "Ingresa un correo válido"
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Save handler
    const handleSave = async () => {
        if (!empresa || !validate()) return

        setIsSaving(true)

        try {
            const res = await authFetch(`/api/empresa/actualizar/${empresa.idEmpresa}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    ruc: ruc.trim(),
                    razonSocial: razonSocial.trim(),
                    correo: correo.trim(),
                }),
            })

            const data = await res.json().catch(() => null)

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    toast.error("No tienes permisos para actualizar")
                    return
                }
                toast.error(data?.message ?? "Error al actualizar la empresa")
                return
            }

            const updated = data as Empresa
            setEmpresa(updated)
            syncForm(updated)
            toast.success("Cambios guardados correctamente")
        } catch {
            toast.error("Error al actualizar la empresa")
        } finally {
            setIsSaving(false)
        }
    }

    const inputClasses = (hasError: boolean) =>
        [
            "w-full rounded-xl border px-4 py-3 pl-12 text-sm font-medium outline-none transition-colors",
            "bg-white dark:bg-[oklch(0.12_0_0)]",
            "text-gray-800 dark:text-gray-200",
            "placeholder:text-gray-400 dark:placeholder:text-gray-600",
            hasError
                ? "border-red-300 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                : "border-gray-200 dark:border-[oklch(0.25_0_0)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500",
        ].join(" ")

    const readOnlyClasses =
        "flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[oklch(0.25_0_0)] bg-gray-50/50 dark:bg-[oklch(0.12_0_0)] px-4 py-3"

    return (
        <div className="max-w-4xl space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Administra la información de tu empresa. Estos datos aparecerán en las facturas.
            </p>

            {/* Error de carga */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                    <button
                        onClick={() => {
                            setError(null)
                            setIsLoading(true)
                            authFetch("/api/empresa/listar")
                                .then(async (res) => {
                                    const data = await res.json()
                                    if (!res.ok) throw new Error(data?.message ?? "Error al obtener datos de la empresa")
                                    const empresas = data as Empresa[]
                                    const emp = empresas.length > 0 ? empresas[0] : null
                                    setEmpresa(emp)
                                    if (emp) syncForm(emp)
                                })
                                .catch((err) => setError(err instanceof Error ? err.message : "Error inesperado"))
                                .finally(() => setIsLoading(false))
                        }}
                        className="ml-2 underline hover:no-underline"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Skeleton loading */}
            {isLoading && (
                <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-2xl border border-gray-100 dark:border-[oklch(0.25_0_0)] shadow-sm p-8 animate-pulse">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center gap-4 md:w-52 shrink-0">
                            <div className="h-40 w-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form with preloaded data */}
            {!isLoading && !error && empresa && (
                <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-2xl border border-gray-100 dark:border-[oklch(0.25_0_0)] shadow-sm p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Logo upload area */}
                            <div className="flex flex-col items-center gap-3 md:w-52 shrink-0">
                                <div className="group relative h-40 w-40 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-center transition-colors hover:border-indigo-400 dark:hover:border-indigo-400/60 cursor-pointer">
                                    <BuildingOffice2Icon className="h-16 w-16 text-indigo-300 dark:text-indigo-500/50" />
                                    <button className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[oklch(0.2_0_0)] border border-gray-200 dark:border-[oklch(0.3_0_0)] shadow-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                                        <ArrowUpTrayIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed max-w-[160px]">
                                    Sube un logo de alta resolución para tus facturas.
                                </p>
                            </div>

                            {/* Fields */}
                            <div className="flex-1 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Nombre Empresa */}
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                                            Nombre Empresa
                                        </label>
                                        <div className="relative">
                                            <BuildingOffice2Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={nombre}
                                                onChange={(e) => {
                                                    setNombre(e.target.value)
                                                    if (formErrors.nombre) setFormErrors((p) => ({ ...p, nombre: undefined }))
                                                }}
                                                className={inputClasses(!!formErrors.nombre)}
                                                placeholder="Nombre de la empresa"
                                            />
                                        </div>
                                        {formErrors.nombre && (
                                            <p className="text-xs text-red-500 dark:text-red-400">{formErrors.nombre}</p>
                                        )}
                                    </div>

                                    {/* RUC */}
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                                            Documento RUC
                                        </label>
                                        <div className="relative">
                                            <HashtagIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={ruc}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 11)
                                                    setRuc(val)
                                                    if (formErrors.ruc) setFormErrors((p) => ({ ...p, ruc: undefined }))
                                                }}
                                                className={inputClasses(!!formErrors.ruc)}
                                                placeholder="20123456789"
                                                maxLength={11}
                                            />
                                        </div>
                                        {formErrors.ruc && (
                                            <p className="text-xs text-red-500 dark:text-red-400">{formErrors.ruc}</p>
                                        )}
                                    </div>

                                    {/* Correo */}
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                                            Email Oficial
                                        </label>
                                        <div className="relative">
                                            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input
                                                type="email"
                                                value={correo}
                                                onChange={(e) => {
                                                    setCorreo(e.target.value)
                                                    if (formErrors.correo) setFormErrors((p) => ({ ...p, correo: undefined }))
                                                }}
                                                className={inputClasses(!!formErrors.correo)}
                                                placeholder="empresa@correo.com"
                                            />
                                        </div>
                                        {formErrors.correo && (
                                            <p className="text-xs text-red-500 dark:text-red-400">{formErrors.correo}</p>
                                        )}
                                    </div>

                                    {/* Fecha (read-only) */}
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                                            Fecha Fundación
                                        </label>
                                        <div className={readOnlyClasses}>
                                            <CalendarDaysIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {new Date(empresa.fechaCreacion).toLocaleDateString("es-PE", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Razón Social - full width */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                                        Razón Social Jurídica
                                    </label>
                                    <div className="relative">
                                        <ClipboardDocumentListIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={razonSocial}
                                            onChange={(e) => {
                                                setRazonSocial(e.target.value)
                                                if (formErrors.razonSocial) setFormErrors((p) => ({ ...p, razonSocial: undefined }))
                                            }}
                                            className={inputClasses(!!formErrors.razonSocial)}
                                            placeholder="Razón social de la empresa"
                                        />
                                    </div>
                                    {formErrors.razonSocial && (
                                        <p className="text-xs text-red-500 dark:text-red-400">{formErrors.razonSocial}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || !hasChanges}
                                        className={[
                                            "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                                            isSaving || !hasChanges
                                                ? "bg-indigo-400/50 text-white/70 cursor-not-allowed"
                                                : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98]",
                                        ].join(" ")}
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Guardando…
                                            </>
                                        ) : (
                                            "Guardar cambios"
                                        )}
                                    </button>

                                    {hasChanges && (
                                        <button
                                            onClick={() => {
                                                if (empresa) syncForm(empresa)
                                                setFormErrors({})
                                            }}
                                            disabled={isSaving}
                                            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                        >
                                            Descartar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && !empresa && (
                <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-2xl border border-gray-100 dark:border-[oklch(0.25_0_0)] shadow-sm p-12 text-center">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center mb-4">
                        <BuildingOffice2Icon className="h-10 w-10 text-indigo-300 dark:text-indigo-500/50" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No se encontró información de la empresa.
                    </p>
                </div>
            )}
        </div>
    )
}
