"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
    Building2, Upload, Hash, Mail, Calendar,
    FileText, CheckCircle2, Loader2, RotateCcw,
    Save, X, AlertCircle, ImageIcon, ShieldCheck, BadgeCheck,
} from "lucide-react"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import type { Empresa } from "@/lib/types/empresa"
import { toast } from "sonner"

/* ─── Types ─────────────────────────────────────────── */
interface FormErrors {
    nombre?: string
    ruc?: string
    correo?: string
    razonSocial?: string
}

/* ─── Validators ─────────────────────────────────────── */
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isValidRuc = (v: string) => /^\d{11}$/.test(v.trim())

/* ─── Design tokens ─────────────────────────────────── */
const card =
    "rounded-2xl border border-slate-100 bg-white shadow-sm " +
    "dark:border-slate-800 dark:bg-[#0f0f12]"

const inputBase =
    "w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all duration-200 " +
    "bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 " +
    "hover:border-slate-300 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 " +
    "dark:bg-[#1a1a1e] dark:text-slate-200 dark:placeholder:text-slate-600 dark:border-slate-700/60 " +
    "dark:hover:border-slate-600 dark:focus:ring-blue-500/20 dark:focus:border-blue-500/60"

const inputErr =
    "border-red-400 focus:ring-red-400/30 focus:border-red-500 " +
    "dark:border-red-500/50 dark:focus:ring-red-500/20 dark:focus:border-red-500/60"

const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400"

/* ─── StatusSwitch ───────────────────────────────────── */
function StatusSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={active}
            className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
                "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#0f0f12]",
                active ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
            ].join(" ")}
        >
            <span className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                active ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")} />
        </button>
    )
}

/* ─── FormField ──────────────────────────────────────── */
function FormField({
    label, icon: Icon, valid, error, children,
}: {
    label: string; icon: React.ElementType; valid?: boolean; error?: string; children: React.ReactNode
}) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <label className={lbl}>{label}</label>
                {valid && (
                    <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Válido
                    </span>
                )}
            </div>
            <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                {children}
            </div>
            {error && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />{error}
                </p>
            )}
        </div>
    )
}

/* ─── CardHeader ─────────────────────────────────────── */
function CardHeader({
    icon: Icon, color, title, subtitle, right,
}: {
    icon: React.ElementType; color: string; title: string; subtitle: string; right?: React.ReactNode
}) {
    return (
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-600">{subtitle}</p>
            </div>
            {right}
        </div>
    )
}

/* ─── Skeleton ───────────────────────────────────────── */
function Skeleton() {
    const b = "rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
    return (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[420px_1fr]">
            <div className="space-y-5">
                <div className={`${card} p-5 space-y-4`}>
                    <div className={`${b} h-52 w-full rounded-xl`} />
                    <div className={`${b} h-9 w-full rounded-xl`} />
                </div>
                <div className={`${card} p-5 space-y-3`}>
                    {[1, 2, 3, 4].map(i => <div key={i} className={`${b} h-4`} />)}
                </div>
            </div>
            <div className="space-y-5">
                {[1, 2].map(i => (
                    <div key={i} className={`${card} p-5 space-y-4`}>
                        <div className={`${b} h-3 w-32`} />
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2].map(j => <div key={j} className={`${b} h-11`} />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function ConfigEmpresaPage() {
    const { isLoading: isAuthLoading } = useAuth()
    const [empresa, setEmpresa] = useState<Empresa | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    /* ── Form state — names match Spring Boot DTOs ── */
    const [nombre, setNombre] = useState("")
    const [ruc, setRuc] = useState("")
    const [razonSocial, setRazonSocial] = useState("")
    const [correo, setCorreo] = useState("")
    const [isActive, setIsActive] = useState(true)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)

    /* ── Logo upload state ── */
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)

    const syncForm = useCallback((emp: Empresa) => {
        setNombre(emp.nombre)
        setRuc(emp.ruc)
        setRazonSocial(emp.razonSocial)
        setCorreo(emp.correo)
        if (emp.logoUrl) setLogoPreview(emp.logoUrl)
    }, [])

    const hasChanges =
        empresa !== null &&
        (nombre !== empresa.nombre || ruc !== empresa.ruc ||
            razonSocial !== empresa.razonSocial || correo !== empresa.correo)

    /* ── Fetch ── */
    const fetchEmpresa = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await authFetch("/api/empresa/listar", { signal })
            const data = await res.json().catch(() => null)
            if (signal?.aborted) return
            if (!res.ok) throw new Error(data?.message ?? "Error al obtener datos de la empresa")
            const empresas = data as Empresa[]
            const emp = empresas.length > 0 ? empresas[0] : null
            setEmpresa(emp)
            if (emp) syncForm(emp)
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return
            setError(err instanceof Error ? err.message : "Error inesperado")
        } finally {
            setIsLoading(false)
        }
    }, [syncForm])

    useEffect(() => {
        if (isAuthLoading) return
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        fetchEmpresa(controller.signal)
        return () => controller.abort()
    }, [isAuthLoading, fetchEmpresa])

    /* ── Validate ── */
    const validate = (): boolean => {
        const errors: FormErrors = {}
        if (!nombre.trim()) errors.nombre = "El nombre es requerido"
        if (!ruc.trim()) errors.ruc = "El RUC es requerido"
        else if (!isValidRuc(ruc)) errors.ruc = "El RUC debe tener exactamente 11 dígitos"
        if (!correo.trim()) errors.correo = "El correo es requerido"
        else if (!isValidEmail(correo)) errors.correo = "Ingresa un correo válido"
        if (!razonSocial.trim()) errors.razonSocial = "La razón social es requerida"
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    /* ── Save (original logic untouched) ── */
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
                if (res.status === 401 || res.status === 403) { toast.error("No tienes permisos para actualizar"); return }
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

    /* ── Logo upload handler ── */
    const handleUpload = async (file: File) => {
        if (!empresa) return

        // Validate client-side before hitting the network
        if (!file.type.startsWith("image/")) {
            toast.error("Solo se permiten imágenes (PNG, JPG, WEBP)")
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("El archivo no puede superar los 2 MB")
            return
        }

        // Optimistic preview — show immediately without waiting for upload
        const objectUrl = URL.createObjectURL(file)
        setLogoPreview(objectUrl)

        setIsUploadingLogo(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await authFetch(`/api/empresa/logo/${empresa.idEmpresa}`, {
                method: "PUT",
                body: formData,
                // Do NOT set Content-Type — the browser sets it with the correct multipart boundary
            })

            const data = await res.json().catch(() => null)

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    toast.error("No tienes permisos para subir el logo")
                } else {
                    toast.error(data?.message ?? "Error al subir el logo")
                }
                // Revert preview on failure
                setLogoPreview(empresa.logoUrl ?? null)
                return
            }

            const updated = data as Empresa
            setEmpresa(updated)
            // Keep the objectUrl as preview (faster than re-fetching the URL)
            if (updated.logoUrl) setLogoPreview(updated.logoUrl)
            toast.success("Logo actualizado correctamente")
        } catch {
            toast.error("Error de conexión al subir el logo")
            setLogoPreview(empresa.logoUrl ?? null)
        } finally {
            setIsUploadingLogo(false)
            // Free the blob URL
            URL.revokeObjectURL(objectUrl)
            // Reset the input so the same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    /* ── Ticket preview (purely visual) ── */
    const TicketPreview = () => (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-[#111114]">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">Vista previa del ticket</p>
            <div className="space-y-1 text-center">
                {/* Logo preview or fallback icon */}
                <div className="mx-auto mb-2 h-10 w-10 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                    {logoPreview
                        ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                        : <div className="flex h-full w-full items-center justify-center"><Building2 className="h-5 w-5 text-slate-400 dark:text-slate-500" /></div>
                    }
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{nombre || "Nombre empresa"}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-600 truncate">{ruc ? `RUC: ${ruc}` : "RUC: —"}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-700 truncate">{correo || "correo@empresa.com"}</p>
                <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
                <p className="text-[9px] text-slate-400 dark:text-slate-700">
                    {empresa ? new Date(empresa.fechaCreacion).toLocaleDateString("es-PE") : "—"}
                </p>
            </div>
        </div>
    )

    /* ─── render ─────────────────────────────────────── */
    return (
        <div className="w-full max-w-[1600px] space-y-6 px-2 pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-500">
                Gestiona la información oficial de tu empresa. Los cambios se reflejan en facturas y documentos.
            </p>

            {/* Error banner */}
            {error && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-500/20 dark:bg-red-900/10">
                    <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />{error}
                    </span>
                    <button
                        onClick={() => fetchEmpresa()}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                        <RotateCcw className="h-3 w-3" /> Reintentar
                    </button>
                </div>
            )}

            {isLoading && <Skeleton />}

            {!isLoading && !error && empresa && (
                <>
                    {/* ── Main grid: left sidebar + right content ── */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[420px_1fr]">

                        {/* ── LEFT COLUMN ─────────────────────────────── */}
                        <div className="space-y-5">

                            {/* Logo card */}
                            <div className={card}>
                                <div className="p-6">
                                    <p className={`${lbl} mb-3`}>Logo de empresa</p>

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUpload(file)
                                        }}
                                    />

                                    {/* Drop zone — click to open file picker */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const file = e.dataTransfer.files?.[0]
                                            if (file) handleUpload(file)
                                        }}
                                        className="group relative flex h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 text-center outline-none transition-all hover:border-blue-400 hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-[#111114] dark:hover:border-blue-500/40 dark:hover:bg-blue-950/10"
                                    >
                                        {/* Loading overlay */}
                                        {isUploadingLogo && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 dark:bg-[#0f0f12]/80">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Subiendo…</p>
                                            </div>
                                        )}
                                        {/* Logo preview or placeholder */}
                                        {logoPreview && !isUploadingLogo ? (
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="h-48 w-48 rounded-lg object-contain"
                                            />
                                        ) : (
                                            <>
                                                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-blue-100 dark:bg-slate-800 dark:group-hover:bg-blue-900/30">
                                                    <ImageIcon className="h-7 w-7 text-slate-400 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
                                                        Arrastra tu logo aquí
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-700">PNG, JPG · máx. 2 MB</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Upload button */}
                                    <button
                                        type="button"
                                        disabled={isUploadingLogo}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#1a1a1e] dark:text-slate-300 dark:hover:border-slate-600"
                                    >
                                        {isUploadingLogo
                                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo…</>
                                            : <><Upload className="h-3.5 w-3.5" /> {logoPreview ? "Cambiar logo" : "Subir logo"}</>}
                                    </button>
                                </div>
                            </div>

                            {/* Ticket preview card */}
                            <div className={card}>
                                <div className="p-5">
                                    <TicketPreview />
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN ─────────────────────────────── */}
                        <div className="space-y-8">

                            {/* Card: Identidad Comercial */}
                            <div className={card}>
                                <div className="p-8">
                                    <CardHeader
                                        icon={BadgeCheck}
                                        color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                                        title="Identidad Comercial"
                                        subtitle="Nombre visible y estado de la empresa"
                                        right={
                                            <div className="flex items-center gap-2.5">
                                                <span className={`text-xs font-semibold ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                                                    {isActive ? "Activo" : "Inactivo"}
                                                </span>
                                                <StatusSwitch active={isActive} onToggle={() => setIsActive(v => !v)} />
                                            </div>
                                        }
                                    />
                                    <div className="space-y-7">
                                        {/* Nombre */}
                                        <FormField label="Nombre Comercial" icon={Building2} valid={!!nombre.trim() && !formErrors.nombre} error={formErrors.nombre}>
                                            <input
                                                type="text"
                                                value={nombre}
                                                onChange={(e) => { setNombre(e.target.value); if (formErrors.nombre) setFormErrors(p => ({ ...p, nombre: undefined })) }}
                                                className={`${inputBase} ${formErrors.nombre ? inputErr : ""}`}
                                                placeholder="Nombre comercial de la empresa"
                                            />
                                        </FormField>
                                        {/* Razón Social */}
                                        <FormField label="Razón Social Jurídica" icon={FileText} valid={!!razonSocial.trim() && !formErrors.razonSocial} error={formErrors.razonSocial}>
                                            <input
                                                type="text"
                                                value={razonSocial}
                                                onChange={(e) => { setRazonSocial(e.target.value); if (formErrors.razonSocial) setFormErrors(p => ({ ...p, razonSocial: undefined })) }}
                                                className={`${inputBase} ${formErrors.razonSocial ? inputErr : ""}`}
                                                placeholder="Razón social registrada en SUNAT"
                                            />
                                        </FormField>
                                        {/* Fecha – read only */}
                                        <div>
                                            <label className={lbl}>Fecha de Fundación</label>
                                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700/50 dark:bg-[#111114]">
                                                <Calendar className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600" />
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {new Date(empresa.fechaCreacion).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "2-digit" })}
                                                </span>
                                                <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-600">
                                                    Solo lectura
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Datos Fiscales */}
                            <div className={card}>
                                <div className="p-8">
                                    <CardHeader
                                        icon={ShieldCheck}
                                        color="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                                        title="Datos Fiscales"
                                        subtitle="RUC y correo oficial ante SUNAT"
                                    />
                                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                                        {/* RUC */}
                                        <FormField label="Número de RUC" icon={Hash} valid={isValidRuc(ruc)} error={formErrors.ruc}>
                                            <input
                                                type="text"
                                                value={ruc}
                                                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 11); setRuc(v); if (formErrors.ruc) setFormErrors(p => ({ ...p, ruc: undefined })) }}
                                                className={`${inputBase} ${formErrors.ruc ? inputErr : ""}`}
                                                placeholder="20123456789"
                                                maxLength={11}
                                            />
                                        </FormField>
                                        {/* Correo */}
                                        <FormField label="Email Oficial" icon={Mail} valid={isValidEmail(correo)} error={formErrors.correo}>
                                            <input
                                                type="email"
                                                value={correo}
                                                onChange={(e) => { setCorreo(e.target.value); if (formErrors.correo) setFormErrors(p => ({ ...p, correo: undefined })) }}
                                                className={`${inputBase} ${formErrors.correo ? inputErr : ""}`}
                                                placeholder="empresa@correo.com"
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Action bar ──────────────────────────────── */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-8 py-5 shadow-sm dark:border-slate-800 dark:bg-[#0f0f12]">
                        <div className="flex items-center gap-2">
                            {hasChanges ? (
                                <>
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Cambios sin guardar</span>
                                </>
                            ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-600">Sin cambios pendientes</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {hasChanges && (
                                <button
                                    type="button"
                                    onClick={() => { if (empresa) syncForm(empresa); setFormErrors({}) }}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="h-4 w-4" /> Descartar
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className={[
                                    "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                                    isSaving || !hasChanges
                                        ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                                        : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 hover:brightness-110 hover:shadow-blue-500/30 active:scale-[0.98]",
                                ].join(" ")}
                            >
                                {isSaving
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                                    : <><Save className="h-4 w-4" /> Guardar cambios</>}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Empty state */}
            {!isLoading && !error && !empresa && (
                <div className={`${card} flex flex-col items-center justify-center py-20 text-center`}>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-[#111114]">
                        <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                    </div>
                    <p className="text-sm text-slate-500">No se encontró información de la empresa.</p>
                    <button
                        onClick={() => fetchEmpresa()}
                        className="mt-4 flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    >
                        <RotateCcw className="h-3 w-3" /> Reintentar
                    </button>
                </div>
            )}
        </div>
    )
}


