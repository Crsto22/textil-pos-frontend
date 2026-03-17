"use client"

import { useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  KeyRound,
  Link2,
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  TestTube2,
  Upload,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { useCompany } from "@/lib/company/company-context"
import { useSunatConfig } from "@/lib/hooks/useSunatConfig"
import { getEmpresaDisplayName } from "@/lib/empresa"
import {
  buildSunatConfigPayload,
  emptySunatConfigForm,
  mapSunatConfigToForm,
} from "@/lib/sunat-config"
import type {
  SunatConfig,
  SunatConfigFormValues,
  SunatConfigTestResponse,
  SunatConfigUpsertRequest,
} from "@/lib/types/sunat-config"

interface SunatFormErrors {
  usuarioSol?: string
  claveSol?: string
  urlBillService?: string
}

const MAX_CERT_SIZE_BYTES = 5 * 1024 * 1024

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

function formatDateTime(value?: string | null) {
  if (!value) return "-"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function SunatField({
  label,
  icon: Icon,
  error,
  helper,
  children,
}: {
  label: string
  icon: React.ElementType
  error?: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        {children}
      </div>
      {helper && !error && (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-600">{helper}</p>
      )}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-[#111114]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{value}</p>
    </div>
  )
}

function StatusFlag({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
      ].join(" ")}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {label}
    </div>
  )
}

function SectionHeader({
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

function SunatSkeleton() {
  const block = "animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        <div className={`${card} space-y-4 p-6`}>
          <div className={`${block} h-4 w-40`} />
          <div className={`${block} h-20 w-full`} />
          <div className="grid grid-cols-2 gap-3">
            <div className={`${block} h-14`} />
            <div className={`${block} h-14`} />
            <div className={`${block} h-14`} />
            <div className={`${block} h-14`} />
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className={`${card} space-y-4 p-6`}>
          <div className={`${block} h-4 w-52`} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={`${block} h-12`} />
            <div className={`${block} h-12`} />
            <div className={`${block} h-12`} />
            <div className={`${block} h-12`} />
          </div>
        </div>
        <div className={`${card} space-y-4 p-6`}>
          <div className={`${block} h-4 w-32`} />
          <div className={`${block} h-24 w-full`} />
        </div>
      </div>
    </div>
  )
}

interface SunatActionResult {
  ok: boolean
  message: string
}

interface SunatConnectionEditorProps {
  config: SunatConfig | null
  error: string | null
  notFound: boolean
  saving: boolean
  uploadingCertificate: boolean
  testingConnection: boolean
  testResult: SunatConfigTestResponse | null
  fetchConfig: () => Promise<void>
  saveConfig: (payload: SunatConfigUpsertRequest) => Promise<SunatActionResult>
  uploadCertificate: (
    file: File,
    certificadoPassword?: string
  ) => Promise<SunatActionResult>
  testConnection: () => Promise<SunatActionResult>
  clearTestResult: () => void
  displayCompanyName: string
  displayRuc: string
}

function SunatConnectionEditor({
  config,
  error,
  notFound,
  saving,
  uploadingCertificate,
  testingConnection,
  testResult,
  fetchConfig,
  saveConfig,
  uploadCertificate,
  testConnection,
  clearTestResult,
  displayCompanyName,
  displayRuc,
}: SunatConnectionEditorProps) {
  const certificateInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<SunatConfigFormValues>(() => mapSunatConfigToForm(config))
  const [formErrors, setFormErrors] = useState<SunatFormErrors>({})

  const baseForm = useMemo(() => mapSunatConfigToForm(config), [config])

  const hasDraftContent = useMemo(
    () =>
      Boolean(
        form.usuarioSol.trim() ||
          form.claveSol.trim() ||
          form.urlBillService.trim() ||
          form.certificadoPassword.trim() ||
          form.clientId.trim() ||
          form.clientSecret.trim() ||
          form.ambiente !== emptySunatConfigForm.ambiente ||
          form.activo !== emptySunatConfigForm.activo
      ),
    [form]
  )

  const hasChanges = useMemo(
    () =>
      form.ambiente !== baseForm.ambiente ||
      form.usuarioSol.trim() !== baseForm.usuarioSol.trim() ||
      form.urlBillService.trim() !== baseForm.urlBillService.trim() ||
      form.activo !== baseForm.activo ||
      form.claveSol.trim().length > 0 ||
      form.certificadoPassword.trim().length > 0 ||
      form.clientId.trim().length > 0 ||
      form.clientSecret.trim().length > 0,
    [baseForm, form]
  )

  const canReset = config ? hasChanges : hasDraftContent
  const canSave = !saving && (!config || hasChanges)

  const endpointPreview =
    form.urlBillService.trim() ||
    config?.urlBillService ||
    "Se usara el endpoint oficial por defecto del backend segun ambiente."

  const setField = <K extends keyof SunatConfigFormValues>(
    key: K,
    value: SunatConfigFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (testResult) clearTestResult()
  }

  const clearFieldError = (field: keyof SunatFormErrors) => {
    setFormErrors((current) => ({ ...current, [field]: undefined }))
  }

  const resetForm = () => {
    setForm(baseForm)
    setFormErrors({})
    clearTestResult()
  }

  const validateForm = () => {
    const nextErrors: SunatFormErrors = {}

    if (!form.usuarioSol.trim()) {
      nextErrors.usuarioSol = "Ingrese el usuario SOL"
    }

    if (!form.claveSol.trim()) {
      nextErrors.claveSol = config?.tieneClaveSol
        ? "Vuelva a ingresar la clave SOL para guardar cambios"
        : "Ingrese la clave SOL"
    }

    const urlBillService = form.urlBillService.trim()
    if (urlBillService && !isValidUrl(urlBillService)) {
      nextErrors.urlBillService = "Ingrese una URL valida"
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    clearTestResult()
    const result = await saveConfig(buildSunatConfigPayload(form))

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(result.message)
  }

  const handleUploadCertificate = async (file: File) => {
    if (!config) {
      toast.error("Guarda la configuracion SUNAT antes de subir el certificado")
      if (certificateInputRef.current) {
        certificateInputRef.current.value = ""
      }
      return
    }

    if (!/\.(pfx|p12)$/i.test(file.name)) {
      toast.error("Solo se permiten certificados .pfx o .p12")
      if (certificateInputRef.current) {
        certificateInputRef.current.value = ""
      }
      return
    }

    if (file.size > MAX_CERT_SIZE_BYTES) {
      toast.error("El certificado digital no debe superar 5 MB")
      if (certificateInputRef.current) {
        certificateInputRef.current.value = ""
      }
      return
    }

    clearTestResult()
    const result = await uploadCertificate(file, form.certificadoPassword)

    if (certificateInputRef.current) {
      certificateInputRef.current.value = ""
    }

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(result.message)
  }

  const handleTestConnection = async () => {
    const result = await testConnection()
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(result.message)
  }

  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Conexion SUNAT
            </p>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-500">
              Configura la integracion unica de SUNAT para la empresa principal.
              Los secretos no vuelven desde la API, por eso la clave SOL debe
              ingresarse otra vez cada vez que guardes cambios.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchConfig()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Recargar configuracion
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-500/20 dark:bg-red-900/10">
          <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void fetchConfig()}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <RefreshCcw className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      )}

      {notFound && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Aun no existe configuracion SUNAT. Completa el formulario y guarda
            antes de subir el certificado o probar la conexion.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <div className={card}>
            <div className="p-6">
              <SectionHeader
                icon={ShieldCheck}
                color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                title="Resumen actual"
                subtitle="Estado de la configuracion unica"
                right={
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      form.activo === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                    ].join(" ")}
                  >
                    {form.activo}
                  </span>
                }
              />

              <div className="space-y-3">
                <OverviewItem label="Empresa" value={displayCompanyName} />
                <OverviewItem label="RUC" value={displayRuc} />
                <OverviewItem label="Ambiente" value={form.ambiente} />
                <OverviewItem
                  label="Modo integracion"
                  value={config?.modoIntegracion ?? "DISABLED"}
                />
                <OverviewItem label="Endpoint" value={endpointPreview} />
                <OverviewItem
                  label="Certificado"
                  value={config?.certificadoNombreArchivo ?? "Sin certificado cargado"}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusFlag label="Clave SOL" active={config?.tieneClaveSol ?? false} />
                <StatusFlag
                  label="Certificado"
                  active={config?.tieneCertificado ?? false}
                />
                <StatusFlag
                  label="Pass certificado"
                  active={config?.tieneCertificadoPassword ?? false}
                />
                <StatusFlag label="Client ID" active={config?.tieneClientId ?? false} />
                <StatusFlag
                  label="Client Secret"
                  active={config?.tieneClientSecret ?? false}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <OverviewItem
                  label="Creado"
                  value={formatDateTime(config?.createdAt)}
                />
                <OverviewItem
                  label="Actualizado"
                  value={formatDateTime(config?.updatedAt)}
                />
              </div>
            </div>
          </div>

          {testResult && (
            <div className={card}>
              <div className="p-6">
                <SectionHeader
                  icon={TestTube2}
                  color={
                    testResult.ok
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  }
                  title="Ultima prueba local"
                  subtitle="Validacion sin envio real a SUNAT"
                />

                <div
                  className={[
                    "rounded-xl border px-4 py-3 text-sm",
                    testResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
                  ].join(" ")}
                >
                  {testResult.message}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <OverviewItem
                    label="Alias certificado"
                    value={testResult.certificadoAlias ?? "No disponible"}
                  />
                  <OverviewItem
                    label="Valido desde"
                    value={formatDateTime(testResult.certificadoVigenteDesde)}
                  />
                  <OverviewItem
                    label="Valido hasta"
                    value={formatDateTime(testResult.certificadoVigenteHasta)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusFlag
                    label="Clave configurada"
                    active={testResult.claveSolConfigurada}
                  />
                  <StatusFlag
                    label="Certificado"
                    active={testResult.certificadoConfigurado}
                  />
                  <StatusFlag
                    label="Certificado valido"
                    active={testResult.certificadoValido}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className={card}>
            <div className="p-6">
              <SectionHeader
                icon={BadgeCheck}
                color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                title="Credenciales y ambiente"
                subtitle="Configuracion principal y secretos protegidos"
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SunatField label="Ambiente" icon={Globe2}>
                  <select
                    value={form.ambiente}
                    onChange={(event) =>
                      setField("ambiente", event.target.value as "BETA" | "PRODUCCION")
                    }
                    className={`${inputBase} appearance-none pr-10`}
                  >
                    <option value="BETA">BETA</option>
                    <option value="PRODUCCION">PRODUCCION</option>
                  </select>
                </SunatField>

                <SunatField label="Estado" icon={Clock3}>
                  <select
                    value={form.activo}
                    onChange={(event) =>
                      setField("activo", event.target.value as "ACTIVO" | "INACTIVO")
                    }
                    className={`${inputBase} appearance-none pr-10`}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </SunatField>

                <SunatField
                  label="Usuario SOL"
                  icon={Building2}
                  error={formErrors.usuarioSol}
                >
                  <input
                    type="text"
                    value={form.usuarioSol}
                    onChange={(event) => {
                      setField("usuarioSol", event.target.value)
                      if (formErrors.usuarioSol) clearFieldError("usuarioSol")
                    }}
                    className={`${inputBase} ${formErrors.usuarioSol ? inputErr : ""}`}
                    placeholder="10454562467MODDATOS"
                  />
                </SunatField>

                <SunatField
                  label="Clave SOL"
                  icon={KeyRound}
                  error={formErrors.claveSol}
                  helper="No vuelve desde la API. Ingresala otra vez antes de guardar."
                >
                  <input
                    type="password"
                    value={form.claveSol}
                    onChange={(event) => {
                      setField("claveSol", event.target.value)
                      if (formErrors.claveSol) clearFieldError("claveSol")
                    }}
                    className={`${inputBase} ${formErrors.claveSol ? inputErr : ""}`}
                    placeholder="********"
                    autoComplete="new-password"
                  />
                </SunatField>

                <div className="lg:col-span-2">
                  <SunatField
                    label="URL Bill Service"
                    icon={Link2}
                    error={formErrors.urlBillService}
                    helper="Si lo dejas vacio, el backend usa el endpoint oficial segun ambiente."
                  >
                    <input
                      type="url"
                      value={form.urlBillService}
                      onChange={(event) => {
                        setField("urlBillService", event.target.value)
                        if (formErrors.urlBillService) clearFieldError("urlBillService")
                      }}
                      className={`${inputBase} ${formErrors.urlBillService ? inputErr : ""}`}
                      placeholder="https://e-beta.sunat.gob.pe/..."
                    />
                  </SunatField>
                </div>

                <SunatField
                  label="Client ID"
                  icon={ShieldCheck}
                  helper={
                    config?.tieneClientId
                      ? "Ya existe uno guardado. Ingresa otro solo si deseas reemplazarlo."
                      : "Opcional segun modo de integracion."
                  }
                >
                  <input
                    type="text"
                    value={form.clientId}
                    onChange={(event) => setField("clientId", event.target.value)}
                    className={inputBase}
                    placeholder="Opcional"
                  />
                </SunatField>

                <SunatField
                  label="Client Secret"
                  icon={KeyRound}
                  helper="Solo ingresa uno nuevo si necesitas actualizarlo."
                >
                  <input
                    type="password"
                    value={form.clientSecret}
                    onChange={(event) => setField("clientSecret", event.target.value)}
                    className={inputBase}
                    placeholder="Opcional"
                    autoComplete="new-password"
                  />
                </SunatField>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <SectionHeader
                icon={FileText}
                color="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                title="Certificado digital"
                subtitle="Carga privada del archivo .pfx o .p12"
              />

              <input
                ref={certificateInputRef}
                type="file"
                accept=".pfx,.p12,application/x-pkcs12"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void handleUploadCertificate(file)
                  }
                }}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-[#111114]">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Archivo actual
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                      {config?.certificadoNombreArchivo ?? "No hay certificado cargado"}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-600">
                      Formatos permitidos: .pfx o .p12. Tamano maximo: 5 MB.
                    </p>
                  </div>

                  <SunatField
                    label="Password del certificado"
                    icon={KeyRound}
                    helper={
                      config?.tieneCertificadoPassword
                        ? "Ya existe una clave guardada. Completa este campo solo si deseas reemplazarla."
                        : "Se enviara con el guardado general y tambien junto al upload si lo completas."
                    }
                  >
                    <input
                      type="password"
                      value={form.certificadoPassword}
                      onChange={(event) => setField("certificadoPassword", event.target.value)}
                      className={inputBase}
                      placeholder="Opcional"
                      autoComplete="new-password"
                    />
                  </SunatField>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#111114]">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Upload privado
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                      Guarda primero la configuracion para habilitar el certificado.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!config || uploadingCertificate || saving}
                    onClick={() => certificateInputRef.current?.click()}
                    className={[
                      "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                      !config || uploadingCertificate || saving
                        ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1a1a1e] dark:text-slate-200 dark:hover:border-slate-600",
                    ].join(" ")}
                  >
                    {uploadingCertificate ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {config?.certificadoNombreArchivo ? "Reemplazar" : "Subir"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-[#0f0f12] lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Acciones de configuracion
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600">
                Primero guarda la configuracion. Luego carga el certificado y prueba
                la validacion local.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canReset && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving || uploadingCertificate || testingConnection}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Restaurar
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleTestConnection()}
                disabled={!config || saving || uploadingCertificate || testingConnection}
                className={[
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  !config || saving || uploadingCertificate || testingConnection
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1a1a1e] dark:text-slate-200 dark:hover:border-slate-600",
                ].join(" ")}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <TestTube2 className="h-4 w-4" />
                    Probar conexion
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave || uploadingCertificate || testingConnection}
                className={[
                  "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                  !canSave || uploadingCertificate || testingConnection
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 hover:brightness-110 hover:shadow-blue-500/30 active:scale-[0.98]",
                ].join(" ")}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar configuracion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SunatConnectionTab({ enabled }: { enabled: boolean }) {
  const { company } = useCompany()
  const {
    config,
    loading,
    error,
    notFound,
    saving,
    uploadingCertificate,
    testingConnection,
    testResult,
    fetchConfig,
    saveConfig,
    uploadCertificate,
    testConnection,
    clearTestResult,
  } = useSunatConfig({ enabled })

  const displayCompanyName = config?.nombreEmpresa || getEmpresaDisplayName(company)
  const displayRuc = config?.rucEmpresa || "Se completara al guardar"

  const editorKey = config
    ? [
        config.idSunatConfig,
        config.updatedAt ?? "",
        config.certificadoNombreArchivo ?? "",
        config.tieneClaveSol ? "1" : "0",
        config.tieneCertificado ? "1" : "0",
        config.tieneCertificadoPassword ? "1" : "0",
        config.tieneClientId ? "1" : "0",
        config.tieneClientSecret ? "1" : "0",
      ].join(":")
    : notFound
      ? "sunat-config:new"
      : "sunat-config:pending"

  if (!enabled || loading || (!config && !error && !notFound)) {
    return <SunatSkeleton />
  }

  return (
    <SunatConnectionEditor
      key={editorKey}
      config={config}
      error={error}
      notFound={notFound}
      saving={saving}
      uploadingCertificate={uploadingCertificate}
      testingConnection={testingConnection}
      testResult={testResult}
      fetchConfig={fetchConfig}
      saveConfig={saveConfig}
      uploadCertificate={uploadCertificate}
      testConnection={testConnection}
      clearTestResult={clearTestResult}
      displayCompanyName={displayCompanyName}
      displayRuc={displayRuc}
    />
  )
}
