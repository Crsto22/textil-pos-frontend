"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Hash,
  ImageIcon,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { SunatConnectionTab } from "@/components/configuracion/empresa/SunatConnectionTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import { useCompany } from "@/lib/company/company-context"
import {
  getEmpresaDisplayName,
  normalizeEmpresa,
  normalizeEmpresaList,
} from "@/lib/empresa"
import type { Empresa, EmpresaUpdateRequest } from "@/lib/types/empresa"

interface FormErrors {
  nombre?: string
  nombreComercial?: string
  ruc?: string
  razonSocial?: string
  correo?: string
  telefono?: string
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const isValidRuc = (value: string) => /^\d{11}$/.test(value.trim())
const isValidPhone = (value: string) => /^\d{7,15}$/.test(value.trim())

const card =
  "rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f0f12]"

const inputBase =
  "w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all duration-200 " +
  "bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 " +
  "hover:border-slate-300 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 " +
  "dark:bg-[#1a1a1e] dark:text-slate-200 dark:placeholder:text-slate-600 dark:border-slate-700/60 " +
  "dark:hover:border-slate-600 dark:focus:ring-blue-500/20 dark:focus:border-blue-500/60"

const inputErr =
  "border-red-400 focus:ring-red-400/30 focus:border-red-500 " +
  "dark:border-red-500/50 dark:focus:ring-red-500/20 dark:focus:border-red-500/60"

const lbl =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400"

function StatusSwitch({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: () => void
}) {
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
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
          active ? "translate-x-5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  )
}

function FormField({
  label,
  icon: Icon,
  valid,
  error,
  children,
}: {
  label: string
  icon: React.ElementType
  valid?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className={lbl}>{label}</label>
        {valid && (
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Valido
          </span>
        )}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        {children}
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

function CardHeader({
  icon: Icon,
  color,
  title,
  subtitle,
  right,
}: {
  icon: React.ElementType
  color: string
  title: string
  subtitle: string
  right?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">{subtitle}</p>
      </div>
      {right}
    </div>
  )
}

function Skeleton() {
  const block = "animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[420px_1fr]">
      <div className="space-y-5">
        <div className={`${card} space-y-4 p-5`}>
          <div className={`${block} h-52 w-full rounded-xl`} />
          <div className={`${block} h-9 w-full rounded-xl`} />
        </div>
        <div className={`${card} space-y-3 p-5`}>
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={`${block} h-4`} />
          ))}
        </div>
      </div>
      <div className="space-y-5">
        {[1, 2].map((item) => (
          <div key={item} className={`${card} space-y-4 p-5`}>
            <div className={`${block} h-3 w-32`} />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((field) => (
                <div key={field} className={`${block} h-11`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConfigEmpresaPage() {
  const { isLoading: isAuthLoading } = useAuth()
  const { setCompany: setGlobalCompany } = useCompany()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState("")
  const [nombreComercial, setNombreComercial] = useState("")
  const [ruc, setRuc] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [generaFacturacionElectronica, setGeneraFacturacionElectronica] =
    useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const syncForm = useCallback((currentEmpresa: Empresa) => {
    setNombre(currentEmpresa.nombre)
    setNombreComercial(currentEmpresa.nombreComercial)
    setRuc(currentEmpresa.ruc)
    setRazonSocial(currentEmpresa.razonSocial)
    setCorreo(currentEmpresa.correo)
    setTelefono(currentEmpresa.telefono)
    setGeneraFacturacionElectronica(currentEmpresa.generaFacturacionElectronica)
    setLogoPreview(currentEmpresa.logoUrl ?? null)
  }, [])

  const hasChanges =
    empresa !== null &&
    (nombre !== empresa.nombre ||
      nombreComercial !== empresa.nombreComercial ||
      ruc !== empresa.ruc ||
      razonSocial !== empresa.razonSocial ||
      correo !== empresa.correo ||
      telefono !== empresa.telefono ||
      generaFacturacionElectronica !== empresa.generaFacturacionElectronica)

  const fetchEmpresa = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await authFetch("/api/empresa/listar", { signal })
        const data = await response.json().catch(() => null)
        if (signal?.aborted) return

        if (!response.ok) {
          throw new Error(data?.message ?? "Error al obtener datos de la empresa")
        }

        const currentEmpresa = normalizeEmpresaList(data)[0] ?? null
        setEmpresa(currentEmpresa)
        setGlobalCompany(currentEmpresa)
        if (currentEmpresa) {
          syncForm(currentEmpresa)
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return
        }

        setError(
          requestError instanceof Error ? requestError.message : "Error inesperado"
        )
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [setGlobalCompany, syncForm]
  )

  useEffect(() => {
    if (isAuthLoading) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    void fetchEmpresa(controller.signal)

    return () => controller.abort()
  }, [fetchEmpresa, isAuthLoading])

  const validate = () => {
    const errors: FormErrors = {}

    if (!nombre.trim()) errors.nombre = "El nombre es requerido"
    if (!nombreComercial.trim()) {
      errors.nombreComercial = "El nombre comercial es requerido"
    }
    if (!ruc.trim()) errors.ruc = "El RUC es requerido"
    else if (!isValidRuc(ruc)) {
      errors.ruc = "El RUC debe tener exactamente 11 digitos"
    }
    if (!razonSocial.trim()) {
      errors.razonSocial = "La razon social es requerida"
    }
    if (!correo.trim()) errors.correo = "El correo es requerido"
    else if (!isValidEmail(correo)) errors.correo = "Ingresa un correo valido"
    if (!telefono.trim()) errors.telefono = "El telefono es requerido"
    else if (!isValidPhone(telefono)) {
      errors.telefono = "El telefono debe tener entre 7 y 15 digitos"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = useCallback(() => {
    if (empresa) syncForm(empresa)
    setFormErrors({})
  }, [empresa, syncForm])

  const handleSave = async () => {
    if (!empresa || !validate()) return

    setIsSaving(true)
    try {
      const payload: EmpresaUpdateRequest = {
        nombre: nombre.trim(),
        nombreComercial: nombreComercial.trim(),
        ruc: ruc.trim(),
        razonSocial: razonSocial.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        generaFacturacionElectronica,
      }

      const response = await authFetch(`/api/empresa/actualizar/${empresa.idEmpresa}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("No tienes permisos para actualizar")
          return
        }

        toast.error(data?.message ?? "Error al actualizar la empresa")
        return
      }

      const normalizedResponse = normalizeEmpresa(data)
      const updatedEmpresa: Empresa = normalizedResponse
        ? {
            ...normalizedResponse,
            logoUrl:
              normalizedResponse.logoUrl?.trim() || empresa.logoUrl?.trim() || undefined,
          }
        : {
            ...empresa,
            ...payload,
          }

      setEmpresa(updatedEmpresa)
      setGlobalCompany(updatedEmpresa)
      syncForm(updatedEmpresa)
      toast.success("Cambios guardados correctamente")
    } catch {
      toast.error("Error al actualizar la empresa")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async (file: File) => {
    if (!empresa) return

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imagenes PNG, JPG o WEBP")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 2 MB")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setLogoPreview(objectUrl)
    setIsUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await authFetch(`/api/empresa/logo/${empresa.idEmpresa}`, {
        method: "PUT",
        body: formData,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("No tienes permisos para subir el logo")
        } else {
          toast.error(data?.message ?? "Error al subir el logo")
        }
        setLogoPreview(empresa.logoUrl ?? null)
        return
      }

      const normalizedResponse = normalizeEmpresa(data)
      const updatedEmpresa =
        normalizedResponse ??
        ({
          ...empresa,
          logoUrl:
            typeof data?.logoUrl === "string" && data.logoUrl.trim()
              ? data.logoUrl.trim()
              : empresa.logoUrl,
        } as Empresa)

      setEmpresa(updatedEmpresa)
      setGlobalCompany(updatedEmpresa)
      setLogoPreview(updatedEmpresa.logoUrl ?? null)
      toast.success("Logo actualizado correctamente")
    } catch {
      toast.error("Error de conexion al subir el logo")
      setLogoPreview(empresa.logoUrl ?? null)
    } finally {
      setIsUploadingLogo(false)
      URL.revokeObjectURL(objectUrl)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const companyDisplayName =
    nombreComercial.trim() || getEmpresaDisplayName(empresa) || "Nombre empresa"

  const TicketPreview = () => (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-[#111114]">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
        Vista previa del ticket
      </p>
      <div className="space-y-1.5 text-center">
        <div className="mx-auto mb-2 h-10 w-10 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
          {logoPreview ? (
            <Image
              src={logoPreview}
              alt="Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>
        <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-300">
          {companyDisplayName}
        </p>
        <p className="truncate text-[10px] text-slate-500 dark:text-slate-600">
          {nombre.trim() || "Nombre legal"}
        </p>
        <p className="truncate text-[10px] text-slate-500 dark:text-slate-600">
          {ruc ? `RUC: ${ruc}` : "RUC: -"}
        </p>
        <p className="truncate text-[10px] text-slate-400 dark:text-slate-700">
          {correo || "correo@empresa.com"}
        </p>
        <p className="truncate text-[10px] text-slate-400 dark:text-slate-700">
          {telefono || "Telefono no configurado"}
        </p>
        <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
        <div className="flex items-center justify-center gap-2">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              generaFacturacionElectronica
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
            ].join(" ")}
          >
            {generaFacturacionElectronica ? "FE activo" : "FE inactivo"}
          </span>
        </div>
        <p className="text-[9px] text-slate-400 dark:text-slate-700">
          {empresa?.fechaCreacion
            ? new Date(empresa.fechaCreacion).toLocaleDateString("es-PE")
            : "-"}
        </p>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-[1600px] space-y-6 px-2 pt-2">
      <p className="text-sm text-slate-500 dark:text-slate-500">
        Gestiona la informacion oficial de tu empresa y la conexion SUNAT. Los
        cambios se reflejan en comprobantes, tickets y facturacion electronica.
      </p>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="empresa" className="flex-1 gap-1.5">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="sunat" className="flex-1 gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Conexion SUNAT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-500/20 dark:bg-red-900/10">
          <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            onClick={() => void fetchEmpresa()}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <RotateCcw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      )}

      {isLoading && <Skeleton />}

      {!isLoading && !error && empresa && (
        <>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[420px_1fr]">
            <div className="space-y-5">
              <div className={card}>
                <div className="p-6">
                  <p className={`${lbl} mb-3`}>Logo de empresa</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        void handleUpload(file)
                      }
                    }}
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const file = event.dataTransfer.files?.[0]
                      if (file) {
                        void handleUpload(file)
                      }
                    }}
                    className="group relative flex h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 text-center outline-none transition-all hover:border-blue-400 hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-[#111114] dark:hover:border-blue-500/40 dark:hover:bg-blue-950/10"
                  >
                    {isUploadingLogo && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 dark:bg-[#0f0f12]/80">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          Subiendo...
                        </p>
                      </div>
                    )}

                    {logoPreview && !isUploadingLogo ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={192}
                        height={192}
                        className="h-48 w-48 rounded-lg object-contain"
                        unoptimized
                      />
                    ) : (
                      <>
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-blue-100 dark:bg-slate-800 dark:group-hover:bg-blue-900/30">
                          <ImageIcon className="h-7 w-7 text-slate-400 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
                            Arrastra tu logo aqui
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-700">
                            PNG, JPG o WEBP · max. 2 MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#1a1a1e] dark:text-slate-300 dark:hover:border-slate-600"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        {logoPreview ? "Cambiar logo" : "Subir logo"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className={card}>
                <div className="p-5">
                  <TicketPreview />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className={card}>
                <div className="p-8">
                  <CardHeader
                    icon={BadgeCheck}
                    color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    title="Identidad Comercial"
                    subtitle="Nombre legal, nombre comercial y estado de facturacion"
                    right={
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs font-semibold ${
                            generaFacturacionElectronica
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400"
                          }`}
                        >
                          {generaFacturacionElectronica
                            ? "Facturacion electronica activa"
                            : "Facturacion electronica inactiva"}
                        </span>
                        <StatusSwitch
                          active={generaFacturacionElectronica}
                          onToggle={() =>
                            setGeneraFacturacionElectronica((current) => !current)
                          }
                        />
                      </div>
                    }
                  />

                  <div className="space-y-7">
                    <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
                      <FormField
                        label="Nombre legal"
                        icon={Building2}
                        valid={!!nombre.trim() && !formErrors.nombre}
                        error={formErrors.nombre}
                      >
                        <input
                          type="text"
                          value={nombre}
                          onChange={(event) => {
                            setNombre(event.target.value)
                            if (formErrors.nombre) {
                              setFormErrors((current) => ({
                                ...current,
                                nombre: undefined,
                              }))
                            }
                          }}
                          className={`${inputBase} ${formErrors.nombre ? inputErr : ""}`}
                          placeholder="Sistema Textil"
                        />
                      </FormField>

                      <FormField
                        label="Nombre comercial"
                        icon={BadgeCheck}
                        valid={!!nombreComercial.trim() && !formErrors.nombreComercial}
                        error={formErrors.nombreComercial}
                      >
                        <input
                          type="text"
                          value={nombreComercial}
                          onChange={(event) => {
                            setNombreComercial(event.target.value)
                            if (formErrors.nombreComercial) {
                              setFormErrors((current) => ({
                                ...current,
                                nombreComercial: undefined,
                              }))
                            }
                          }}
                          className={`${inputBase} ${
                            formErrors.nombreComercial ? inputErr : ""
                          }`}
                          placeholder="LP STORE"
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Razon social juridica"
                      icon={FileText}
                      valid={!!razonSocial.trim() && !formErrors.razonSocial}
                      error={formErrors.razonSocial}
                    >
                      <input
                        type="text"
                        value={razonSocial}
                        onChange={(event) => {
                          setRazonSocial(event.target.value)
                          if (formErrors.razonSocial) {
                            setFormErrors((current) => ({
                              ...current,
                              razonSocial: undefined,
                            }))
                          }
                        }}
                        className={`${inputBase} ${formErrors.razonSocial ? inputErr : ""}`}
                        placeholder="Razon social registrada en SUNAT"
                      />
                    </FormField>

                    <div>
                      <label className={lbl}>Fecha de registro</label>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700/50 dark:bg-[#111114]">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {empresa.fechaCreacion
                            ? new Date(empresa.fechaCreacion).toLocaleDateString("es-PE", {
                                year: "numeric",
                                month: "long",
                                day: "2-digit",
                              })
                            : "-"}
                        </span>
                        <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-600">
                          Solo lectura
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={card}>
                <div className="p-8">
                  <CardHeader
                    icon={ShieldCheck}
                    color="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                    title="Datos Fiscales y Contacto"
                    subtitle="RUC, correo y telefono oficial"
                  />

                  <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
                    <FormField
                      label="Numero de RUC"
                      icon={Hash}
                      valid={isValidRuc(ruc)}
                      error={formErrors.ruc}
                    >
                      <input
                        type="text"
                        value={ruc}
                        onChange={(event) => {
                          const nextValue = event.target.value.replace(/\D/g, "").slice(0, 11)
                          setRuc(nextValue)
                          if (formErrors.ruc) {
                            setFormErrors((current) => ({ ...current, ruc: undefined }))
                          }
                        }}
                        className={`${inputBase} ${formErrors.ruc ? inputErr : ""}`}
                        placeholder="20123456789"
                        maxLength={11}
                      />
                    </FormField>

                    <FormField
                      label="Email oficial"
                      icon={Mail}
                      valid={isValidEmail(correo)}
                      error={formErrors.correo}
                    >
                      <input
                        type="email"
                        value={correo}
                        onChange={(event) => {
                          setCorreo(event.target.value)
                          if (formErrors.correo) {
                            setFormErrors((current) => ({
                              ...current,
                              correo: undefined,
                            }))
                          }
                        }}
                        className={`${inputBase} ${formErrors.correo ? inputErr : ""}`}
                        placeholder="empresa@correo.com"
                      />
                    </FormField>

                    <FormField
                      label="Telefono"
                      icon={Phone}
                      valid={isValidPhone(telefono)}
                      error={formErrors.telefono}
                    >
                      <input
                        type="text"
                        value={telefono}
                        onChange={(event) => {
                          const nextValue = event.target.value.replace(/\D/g, "").slice(0, 15)
                          setTelefono(nextValue)
                          if (formErrors.telefono) {
                            setFormErrors((current) => ({
                              ...current,
                              telefono: undefined,
                            }))
                          }
                        }}
                        className={`${inputBase} ${formErrors.telefono ? inputErr : ""}`}
                        placeholder="987654321"
                        maxLength={15}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-8 py-5 shadow-sm dark:border-slate-800 dark:bg-[#0f0f12]">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Cambios sin guardar
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-600">
                  Sin cambios pendientes
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <button
                  type="button"
                  onClick={resetForm}
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
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && !empresa && (
        <div className={`${card} flex flex-col items-center justify-center py-20 text-center`}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-[#111114]">
            <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-sm text-slate-500">
            No se encontro informacion de la empresa.
          </p>
          <button
            onClick={() => void fetchEmpresa()}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
          >
            <RotateCcw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      )}

        </TabsContent>

        <TabsContent value="sunat" className="space-y-6">
          <SunatConnectionTab enabled={!isAuthLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
