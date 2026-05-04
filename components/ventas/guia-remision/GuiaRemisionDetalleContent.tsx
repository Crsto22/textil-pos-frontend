"use client"

import { useState } from "react"
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CodeBracketIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  MapPinIcon,
  ScaleIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  downloadGuiaRemisionDocument,
  getGuiaRemisionDownloadConfig,
  type GuiaRemisionDocumentKind,
} from "@/lib/guia-remision-documents"
import {
  GUIA_REMISION_MOTIVO_FIJO,
  MOTIVO_TRASLADO_LABELS,
  MODALIDAD_TRANSPORTE_LABELS,
} from "@/lib/types/guia-remision"
import type {
  GuiaRemisionConductor,
  GuiaRemisionDetail,
  GuiaRemisionVehiculo,
} from "@/lib/types/guia-remision"
import {
  formatFechaHora,
  getEstadoBadgeClass,
  getSunatBadgeClass,
  getSunatEstadoLabel,
  isSunatNotApplicable,
  normalizeSunatEstado,
} from "@/components/ventas/historial/historial.utils"

interface GuiaRemisionDetalleContentProps {
  detail: GuiaRemisionDetail | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onConsultarCdr: () => void
  consultingCdr: boolean
}

function hasCdrAvailable(sunatEstado: string | null | undefined): boolean {
  const n = normalizeSunatEstado(sunatEstado)
  return n === "ACEPTADO" || n === "ACEPTADA" || n === "OBSERVADO"
}

function getGuiaSunatEstadoLabel(estado: string | null | undefined): string {
  return normalizeSunatEstado(estado) === "OBSERVADO"
    ? "Aceptada por SUNAT con observacion"
    : getSunatEstadoLabel(estado)
}

function getGuiaEstadoLabel(detail: GuiaRemisionDetail): string {
  const estado = detail.estado?.trim().toUpperCase() || ""
  if (estado === "EMITIDA" && normalizeSunatEstado(detail.sunatEstado) === "OBSERVADO") {
    return "ACEPTADA / OBSERVADA"
  }
  return detail.estado
}

function getGuiaEstadoBadgeClass(detail: GuiaRemisionDetail): string {
  const estado = detail.estado?.trim().toUpperCase() || ""
  return getEstadoBadgeClass(
    estado === "EMITIDA" && normalizeSunatEstado(detail.sunatEstado) === "OBSERVADO"
      ? "ACEPTADA"
      : detail.estado
  )
}

function getPrincipalConductor(conductores: GuiaRemisionConductor[]): GuiaRemisionConductor | null {
  return conductores[0] ?? null
}

function getPrincipalVehiculo(vehiculos: GuiaRemisionVehiculo[]): GuiaRemisionVehiculo | null {
  return vehiculos[0] ?? null
}

function formatFechaSolo(value: string | null | undefined): string {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function GuiaRemisionDetalleContent({
  detail,
  loading,
  error,
  onRetry,
  onConsultarCdr,
  consultingCdr,
}: GuiaRemisionDetalleContentProps) {
  const router = useRouter()
  const [downloadingKind, setDownloadingKind] = useState<GuiaRemisionDocumentKind | null>(null)

  const motivoCodigo = detail?.motivoTraslado ?? GUIA_REMISION_MOTIVO_FIJO
  const motivoLabel = `${motivoCodigo} - ${MOTIVO_TRASLADO_LABELS[motivoCodigo] ?? motivoCodigo}`
  const showSunatActions = detail ? !isSunatNotApplicable(detail.sunatEstado) : false
  const showCdrDownloads = detail
    ? Boolean(detail.sunatCdrNombre?.trim()) || hasCdrAvailable(detail.sunatEstado)
    : false
  const showConsultarCdr = detail ? Boolean(detail.sunatTicket) && !showCdrDownloads : false

  const handleDownloadDocument = async (kind: GuiaRemisionDocumentKind) => {
    if (!detail || downloadingKind) return
    setDownloadingKind(kind)
    const result = await downloadGuiaRemisionDocument(
      getGuiaRemisionDownloadConfig(kind, { idGuiaRemision: detail.idGuiaRemision })
    )
    setDownloadingKind(null)
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const isDownloadingPdf = downloadingKind === "pdf"
  const isDownloadingXml = downloadingKind === "xml"
  const isDownloadingCdrXml = downloadingKind === "cdr-xml"
  const isDownloadingCdrZip = downloadingKind === "cdr-zip"

  return (
    <div className="space-y-4">
      {/* Navegacion */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Volver
        </button>
        <h2 className="text-lg font-semibold">Detalle de guia de remision remitente</h2>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card px-4 py-12 shadow-sm flex items-center justify-center">
          <LoaderSpinner text="Cargando detalle de guia..." />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-900/60 dark:bg-rose-900/20">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/40"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading && !error && detail ? (() => {
        const conductor = getPrincipalConductor(detail.conductores)
        const vehiculo = getPrincipalVehiculo(detail.vehiculos)
        const transportista = detail.transportistas[0] ?? null
        const isPrivado = detail.modalidadTransporte === "02"

        return (
          <article className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm">

            {/* ── HEADER ── */}
            <header className="border-b border-border/60 px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getGuiaEstadoBadgeClass(detail)}`}>
                      {getGuiaEstadoLabel(detail)}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(detail.sunatEstado)}`}>
                      SUNAT: {getGuiaSunatEstadoLabel(detail.sunatEstado)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-foreground">
                    {detail.numeroGuiaRemision}
                  </h3>
                  {detail.fechaEmision ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Emitido el {formatFechaHora(detail.fechaEmision)}
                    </p>
                  ) : null}
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2">
                  {showConsultarCdr ? (
                    <button
                      type="button"
                      onClick={onConsultarCdr}
                      disabled={consultingCdr || downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-700/50 dark:bg-cyan-900/20 dark:text-cyan-300"
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${consultingCdr ? "animate-spin" : ""}`} />
                      {consultingCdr ? "Consultando..." : "Consultar CDR"}
                    </button>
                  ) : null}
                  {showSunatActions ? (
                    <button
                      type="button"
                      onClick={() => { void handleDownloadDocument("xml") }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingXml ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CodeBracketIcon className="h-4 w-4" />}
                      {isDownloadingXml ? "Descargando..." : "Descargar XML"}
                    </button>
                  ) : null}
                  {showSunatActions && showCdrDownloads ? (
                    <button
                      type="button"
                      onClick={() => { void handleDownloadDocument("cdr-xml") }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingCdrXml ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <DocumentTextIcon className="h-4 w-4" />}
                      {isDownloadingCdrXml ? "Descargando..." : "Ver CDR"}
                    </button>
                  ) : null}
                  {showSunatActions && showCdrDownloads ? (
                    <button
                      type="button"
                      onClick={() => { void handleDownloadDocument("cdr-zip") }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingCdrZip ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                      {isDownloadingCdrZip ? "Descargando..." : "Descargar CDR"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => { void handleDownloadDocument("pdf") }}
                    disabled={downloadingKind !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDownloadingPdf ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <DocumentArrowDownIcon className="h-4 w-4" />}
                    {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
                  </button>
                </div>
              </div>
            </header>

            {/* ── DATOS GENERALES ── */}
            <section className="border-b border-border/60 px-6 py-4 sm:px-8">
              <SectionTitle icon={DocumentTextIcon} title="Datos generales" />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <MetaCard
                  icon={CalendarDaysIcon}
                  label="Fecha de emision"
                  value={detail.fechaEmision ? formatFechaHora(detail.fechaEmision) : "-"}
                />
                <MetaCard
                  icon={CalendarDaysIcon}
                  label="Fecha de traslado"
                  value={formatFechaSolo(detail.fechaInicioTraslado)}
                />
                <MetaCard
                  icon={DocumentTextIcon}
                  label="Motivo de traslado"
                  value={motivoLabel}
                  secondary={detail.descripcionMotivo || undefined}
                />
                <MetaCard
                  icon={ScaleIcon}
                  label="Peso bruto total"
                  value={`${detail.pesoBrutoTotal} ${detail.unidadPeso}${detail.numeroBultos != null ? ` · ${detail.numeroBultos} bultos` : ""}`}
                />
                <MetaCard
                  icon={UserIcon}
                  label="Usuario"
                  value={detail.nombreUsuario || "No disponible"}
                />
                <MetaCard
                  icon={BuildingOffice2Icon}
                  label="Sucursal operativa"
                  value={detail.nombreSucursal || "No disponible"}
                />
                {detail.observaciones ? (
                  <MetaCard
                    icon={DocumentTextIcon}
                    label="Observaciones"
                    value={detail.observaciones}
                    wide
                  />
                ) : null}
              </div>
            </section>

            {/* ── DESTINATARIO Y RUTA ── */}
            <section className="border-b border-border/60 px-6 py-4 sm:px-8">
              <SectionTitle icon={MapPinIcon} title="Destinatario y ruta" />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <MetaCard
                  icon={UserIcon}
                  label="Destinatario"
                  value={detail.destinatarioRazonSocial || "-"}
                  secondary={detail.destinatarioNroDoc ? `Doc: ${detail.destinatarioNroDoc}` : undefined}
                />
                <MetaCard
                  icon={MapPinIcon}
                  label="Punto de partida"
                  value={detail.nombreSucursalPartida || detail.direccionPartida || "-"}
                  secondary={[detail.direccionPartida, detail.ubigeoPartida].filter(Boolean).join(" · ") || undefined}
                />
                <MetaCard
                  icon={MapPinIcon}
                  label="Punto de llegada"
                  value={detail.nombreSucursalLlegada || detail.direccionLlegada || "-"}
                  secondary={[detail.direccionLlegada, detail.ubigeoLlegada].filter(Boolean).join(" · ") || undefined}
                />
              </div>
            </section>

            {/* ── TRANSPORTE ── */}
            <section className="border-b border-border/60 px-6 py-4 sm:px-8">
              <SectionTitle icon={TruckIcon} title="Transporte" />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <MetaCard
                  icon={TruckIcon}
                  label="Modalidad"
                  value={MODALIDAD_TRANSPORTE_LABELS[detail.modalidadTransporte] || detail.modalidadTransporte}
                />
                {conductor ? (
                  <MetaCard
                    icon={UserIcon}
                    label="Conductor"
                    value={`${conductor.nombres} ${conductor.apellidos}`}
                    secondary={`Doc: ${conductor.nroDocumento}${conductor.licencia ? ` · Lic: ${conductor.licencia}` : ""}`}
                  />
                ) : null}
                {vehiculo ? (
                  <MetaCard
                    icon={TruckIcon}
                    label="Vehiculo"
                    value={vehiculo.placa}
                  />
                ) : null}
                {!isPrivado && transportista ? (
                  <MetaCard
                    icon={BuildingOffice2Icon}
                    label="Transportista"
                    value={transportista.transportistaRazonSocial || "-"}
                    secondary={[
                      transportista.transportistaNroDoc ? `RUC: ${transportista.transportistaNroDoc}` : null,
                      transportista.transportistaRegistroMtc ? `MTC: ${transportista.transportistaRegistroMtc}` : null,
                    ].filter(Boolean).join(" · ") || undefined}
                  />
                ) : null}
              </div>
            </section>

            {/* ── ITEMS ── */}
            {detail.detalles.length > 0 ? (
              <section className="border-b border-border/60 px-6 py-4 sm:px-8">
                <SectionTitle icon={CubeIcon} title={`Items (${detail.detalles.length})`} />
                <div className="mt-4 overflow-hidden rounded-xl border">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-xs font-semibold uppercase tracking-wide text-white dark:bg-slate-700">
                          <th className="px-3 py-3 text-center">Cant</th>
                          <th className="px-3 py-3 text-left">Unidad</th>
                          <th className="px-3 py-3 text-left">Codigo</th>
                          <th className="px-3 py-3 text-left">Descripcion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.detalles.map((item, index) => (
                          <tr
                            key={item.idGuiaRemisionDetalle || index}
                            className="border-b last:border-0 transition-colors hover:bg-muted/20"
                          >
                            <td className="px-3 py-3 text-center font-semibold text-foreground">
                              {item.cantidad.toFixed(2)}
                            </td>
                            <td className="px-3 py-3 font-medium text-foreground">
                              {item.unidadMedida}
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs font-medium text-muted-foreground">
                                {item.codigoProducto || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-semibold uppercase tracking-[0.01em] text-foreground">
                              {item.descripcion}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : null}

            {/* ── SUNAT ── */}
            {(detail.sunatEstado && detail.sunatEstado !== "NO_APLICA") ||
            detail.sunatCodigo ||
            detail.sunatMensaje ||
            detail.sunatHash ||
            detail.sunatTicket ? (
              <section className="px-6 py-4 sm:px-8">
                <SectionTitle icon={DocumentTextIcon} title="Informacion SUNAT" />
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Estado", value: getGuiaSunatEstadoLabel(detail.sunatEstado) },
                    { label: "Codigo", value: detail.sunatCodigo || "-" },
                    { label: "Mensaje", value: detail.sunatMensaje || "-" },
                    { label: "Hash", value: detail.sunatHash || "-" },
                    { label: "Ticket", value: detail.sunatTicket || "-" },
                    { label: "XML", value: detail.sunatXmlNombre || detail.sunatZipNombre || "-" },
                    { label: "CDR", value: detail.sunatCdrNombre || "-" },
                    { label: "Enviado", value: detail.sunatEnviadoAt ? formatFechaHora(detail.sunatEnviadoAt) : "-" },
                    { label: "Respondido", value: detail.sunatRespondidoAt ? formatFechaHora(detail.sunatRespondidoAt) : "-" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        )
      })() : null}
    </div>
  )
}

/* ── Componentes internos ── */

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h4>
    </div>
  )
}

function MetaCard({
  icon: Icon,
  label,
  value,
  secondary,
  wide,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  secondary?: string
  wide?: boolean
}) {
  return (
    <div className={`flex items-start gap-2 ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}>
      <span className="mt-0.5 shrink-0 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
        {secondary ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{secondary}</p>
        ) : null}
      </div>
    </div>
  )
}
