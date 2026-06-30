"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  CheckIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { getMetodoPagoLabel, getMetodoPagoLogo } from "@/components/pagos/pagos.utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoaderSpinner } from "@/components/ui/loader-spinner"
import { authFetch } from "@/lib/auth/auth-fetch"
import { buildComprobanteLabel } from "@/lib/comprobante"
import { useComprobanteOptions } from "@/lib/hooks/useComprobanteOptions"
import { useDocumentoLookup } from "@/lib/hooks/useDocumentoLookup"
import { resolveBackendUrl } from "@/lib/resolve-backend-url"
import type { DocumentoRucResponse } from "@/lib/types/documento"
import type { EcommercePedidoAdmin, EcommercePedidoPageResponse } from "@/lib/types/ecommerce-pedido"

const ESTADOS = ["TODOS", "ESPERANDO_COMPROBANTE", "PAGO_EN_REVISION", "ACEPTADO", "CANCELADO", "CANCELADO_POR_TIEMPO"] as const
const PERIODOS = ["HOY", "AYER", "SEMANA", "MES", "FECHA"] as const
const TIPOS_VENTA_WEB = new Set(["NOTA DE VENTA", "BOLETA", "FACTURA"])

function money(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value || 0)
}

function dateOnly(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-PE")
}

function timeOnly(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

function estadoLabel(value: (typeof ESTADOS)[number]) {
  return {
    TODOS: "Todos",
    ESPERANDO_COMPROBANTE: "Nuevos",
    PAGO_EN_REVISION: "En Progreso",
    ACEPTADO: "Completados",
    CANCELADO: "Cancelado",
    CANCELADO_POR_TIEMPO: "Vencido",
  }[value]
}

function periodoLabel(value: (typeof PERIODOS)[number]) {
  return { HOY: "Hoy", AYER: "Ayer", SEMANA: "Semana", MES: "Mes", FECHA: "Fecha" }[value]
}

function estadoDisplay(value: string) {
  const key = value.trim().toUpperCase()
  if (key === "ESPERANDO_COMPROBANTE") return "Nuevo"
  if (key === "PAGO_EN_REVISION") return "En Progreso"
  if (key === "ACEPTADO") return "Completado"
  if (key === "CANCELADO_POR_TIEMPO") return "Vencido"
  if (key === "CANCELADO") return "Cancelado"
  return value
}

function estadoClass(value: string) {
  const key = value.trim().toUpperCase()
  if (key === "ACEPTADO") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
  if (key === "PAGO_EN_REVISION") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
  if (key === "CANCELADO" || key === "CANCELADO_POR_TIEMPO") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
}

function estadoDotClass(value: string) {
  const key = value.trim().toUpperCase()
  if (key === "ACEPTADO") return "bg-emerald-500"
  if (key === "PAGO_EN_REVISION") return "bg-amber-500"
  if (key === "CANCELADO" || key === "CANCELADO_POR_TIEMPO") return "bg-rose-500"
  return "bg-blue-500"
}

function countdown(expiraAt: string | null | undefined, now: number) {
  if (!expiraAt) return "-"
  const diff = new Date(expiraAt).getTime() - now
  if (!Number.isFinite(diff)) return "-"
  if (diff <= 0) return "Vencido"
  const total = Math.floor(diff / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function initials(pedido: EcommercePedidoAdmin) {
  return `${pedido.cliente.nombres?.[0] ?? ""}${pedido.cliente.apellidos?.[0] ?? ""}`.toUpperCase() || "CL"
}

function wantsInvoice(pedido: EcommercePedidoAdmin | null | undefined) {
  return Boolean(pedido?.cliente.deseaFactura && pedido.cliente.ruc)
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}:</span> {value}
    </p>
  )
}

function avatarClass(index: number) {
  return ["bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"][index % 5]
}

function message(data: unknown, fallback: string) {
  return data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
    ? String((data as { message: string }).message)
    : fallback
}

function extractFilename(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i)
  return match?.[1] ?? `reporte_pedidos_ecommerce_${Date.now()}.xlsx`
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function ProductCircles({ detalles }: { detalles: EcommercePedidoAdmin["detalles"] }) {
  const visible = detalles.slice(0, 4)
  const extra = detalles.length - visible.length

  return (
    <div className="flex -space-x-2">
      {visible.map((detalle, index) => {
        const src = detalle.imagenUrl ? resolveBackendUrl(detalle.imagenUrl) : null
        return (
          <div
            key={`${detalle.idProductoVariante ?? "producto"}-${index}`}
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500 shadow-sm dark:border-slate-900 dark:bg-slate-800 dark:text-slate-300"
            title={detalle.nombreProducto ?? "Producto"}
          >
            {src ? (
              <img src={src} alt={detalle.nombreProducto ?? "Producto"} className="h-full w-full object-cover" />
            ) : (
              (detalle.nombreProducto ?? "P").slice(0, 1).toUpperCase()
            )}
          </div>
        )
      })}
      {extra > 0 ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600 shadow-sm dark:border-slate-900 dark:bg-slate-700 dark:text-slate-200">
          +{extra}
        </div>
      ) : null}
    </div>
  )
}

function formatDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function weekStart(date: Date) {
  const start = new Date(date)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  return start
}

function resolveDateRange(periodo: (typeof PERIODOS)[number], fechaDesde: string, fechaHasta: string) {
  const today = new Date()
  if (periodo === "HOY") return { desde: formatDateParam(today), hasta: formatDateParam(today) }
  if (periodo === "AYER") {
    const yesterday = addDays(today, -1)
    return { desde: formatDateParam(yesterday), hasta: formatDateParam(yesterday) }
  }
  if (periodo === "SEMANA") return { desde: formatDateParam(weekStart(today)), hasta: formatDateParam(today) }
  if (periodo === "MES") return { desde: formatDateParam(monthStart(today)), hasta: formatDateParam(today) }
  return { desde: fechaDesde || fechaHasta, hasta: fechaHasta || fechaDesde }
}

const EMPTY_STATS = {
  completados: 0,
  vencidos: 0,
  enProgreso: 0,
  gananciasCompletadas: 0,
}

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<EcommercePedidoAdmin[]>([])
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]>("TODOS")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EcommercePedidoAdmin | null>(null)
  const [acceptTarget, setAcceptTarget] = useState<EcommercePedidoAdmin | null>(null)
  const [cancelTarget, setCancelTarget] = useState<EcommercePedidoAdmin | null>(null)
  const [selectedComprobanteId, setSelectedComprobanteId] = useState("")
  const [busy, setBusy] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("HOY")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [estadisticas, setEstadisticas] = useState(EMPTY_STATS)
  const [rucData, setRucData] = useState<DocumentoRucResponse | null>(null)
  const [rucError, setRucError] = useState<string | null>(null)
  const [rucInput, setRucInput] = useState("")
  const [editingRuc, setEditingRuc] = useState(false)

  const { comprobantes, loadingComprobantes, errorComprobantes } = useComprobanteOptions({
    enabled: Boolean(acceptTarget),
    habilitadoVenta: true,
  })
  const { loading: loadingRuc, lookupDocumento } = useDocumentoLookup()

  const dateRange = useMemo(
    () => resolveDateRange(periodo, fechaDesde, fechaHasta),
    [fechaDesde, fechaHasta, periodo],
  )

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), size: "20" })
    if (search.trim()) params.set("q", search.trim())
    if (estado !== "TODOS") params.set("estado", estado)
    if (dateRange.desde) params.set("fechaDesde", dateRange.desde)
    if (dateRange.hasta) params.set("fechaHasta", dateRange.hasta)
    try {
      const response = await authFetch(`/api/ecommerce/pedidos?${params}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(message(data, "No se pudo listar pedidos"))
      const pageData = data as EcommercePedidoPageResponse
      setPedidos(Array.isArray(pageData.content) ? pageData.content : [])
      setTotalPages(Number(pageData.totalPages) || 0)
      setTotalElements(Number(pageData.totalElements) || 0)
      setEstadisticas(pageData.estadisticas ?? EMPTY_STATS)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo listar pedidos")
      setPedidos([])
      setEstadisticas(EMPTY_STATS)
    } finally {
      setLoading(false)
    }
  }, [dateRange.desde, dateRange.hasta, estado, page, search])

  useEffect(() => {
    const id = window.setTimeout(() => void fetchPedidos(), 250)
    return () => window.clearTimeout(id)
  }, [fetchPedidos])

  useEffect(() => setPage(0), [estado, fechaDesde, fechaHasta, periodo, search])
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const comprobantesVentaWeb = useMemo(
    () => comprobantes.filter((item) => TIPOS_VENTA_WEB.has(item.tipoComprobante)),
    [comprobantes]
  )
  const comprobantesDisponibles = useMemo(
    () => {
      if (!wantsInvoice(acceptTarget)) return comprobantesVentaWeb.filter((item) => item.tipoComprobante !== "FACTURA")
      return rucData?.razonSocial
        ? comprobantesVentaWeb.filter((item) => item.tipoComprobante === "FACTURA")
        : comprobantesVentaWeb.filter((item) => item.tipoComprobante !== "FACTURA")
    },
    [acceptTarget, comprobantesVentaWeb, rucData?.razonSocial]
  )
  const comprobanteSeleccionado = useMemo(
    () => comprobantesDisponibles.find((item) => String(item.idComprobante) === selectedComprobanteId) ?? null,
    [comprobantesDisponibles, selectedComprobanteId]
  )

  useEffect(() => {
    if (!acceptTarget || comprobantesDisponibles.length === 0) return
    if (selectedComprobanteId && comprobantesDisponibles.some((item) => String(item.idComprobante) === selectedComprobanteId)) return
    const preferred = comprobantesDisponibles.find((item) => item.tipoComprobante === "BOLETA")
    setSelectedComprobanteId(String((preferred ?? comprobantesDisponibles[0]).idComprobante))
  }, [acceptTarget, comprobantesDisponibles, selectedComprobanteId])

  const consultarRuc = useCallback(async (ruc: string) => {
    const normalized = ruc.replace(/\D/g, "")
    setRucData(null)
    setRucError(null)
    setRucInput(normalized)
    if (!normalized.match(/^\d{11}$/)) {
      setRucError("Ingrese un RUC de 11 digitos")
      return
    }
    const result = await lookupDocumento("RUC", normalized)
    if (!result.ok || result.tipoDocumento !== "RUC") {
      setRucError(result.ok ? "No se pudo validar el RUC" : result.message)
      return
    }
    const razonSocial = result.data.razonSocial?.replace(/\s+/g, " ").trim()
    if (!razonSocial) {
      setRucError("El RUC no devolvio razon social")
      return
    }
    setEditingRuc(false)
    setRucData({ ...result.data, ruc: normalized, razonSocial })
  }, [lookupDocumento])

  useEffect(() => {
    if (!acceptTarget) return
    const ruc = acceptTarget.cliente.ruc ?? ""
    setRucInput(ruc)
    setEditingRuc(false)
    if (wantsInvoice(acceptTarget)) void consultarRuc(ruc)
  }, [acceptTarget, consultarRuc])

  const acceptPedido = async () => {
    if (!acceptTarget || !comprobanteSeleccionado) return
    if (comprobanteSeleccionado.tipoComprobante === "FACTURA" && !rucData?.razonSocial) {
      toast.error("Valida el RUC antes de emitir factura")
      return
    }
    setBusy(true)
    try {
      const response = await authFetch(`/api/ecommerce/pedidos/${acceptTarget.idEcommercePedido}/aceptar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoComprobante: comprobanteSeleccionado.tipoComprobante,
          serie: comprobanteSeleccionado.serie,
          facturaRuc: rucData?.ruc ?? rucInput,
          razonSocial: rucData?.razonSocial,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(message(data, "No se pudo aceptar el pedido"))
      toast.success("Pedido aceptado")
      setSelected(null)
      setAcceptTarget(null)
      setCancelTarget(null)
      await fetchPedidos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo aceptar el pedido")
    } finally {
      setBusy(false)
    }
  }

  const cancelPedido = async () => {
    if (!cancelTarget) return
    setBusy(true)
    try {
      const response = await authFetch(`/api/ecommerce/pedidos/${cancelTarget.idEcommercePedido}/cancelar`, { method: "POST" })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(message(data, "No se pudo cancelar el pedido"))
      toast.success("Pedido cancelado")
      setSelected(null)
      setCancelTarget(null)
      await fetchPedidos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar el pedido")
    } finally {
      setBusy(false)
    }
  }

  const clearFilters = () => {
    setPeriodo("HOY")
    setFechaDesde("")
    setFechaHasta("")
    setEstado("TODOS")
    setSearch("")
    setPage(0)
  }

  const exportExcel = async () => {
    setExcelLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.desde) params.set("fechaDesde", dateRange.desde)
      if (dateRange.hasta) params.set("fechaHasta", dateRange.hasta)
      const response = await authFetch(`/api/ecommerce/pedidos/reporte/excel?${params}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null
        throw new Error(payload?.message || "No se pudo exportar el Excel")
      }
      const blob = await response.blob()
      if (blob.size === 0) throw new Error("El Excel llego vacio")
      downloadBlob(extractFilename(response.headers.get("content-disposition")), blob)
      toast.success("Reporte Excel descargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar el Excel")
    } finally {
      setExcelLoading(false)
    }
  }

  const statsCards = [
    {
      label: "Pedidos completados",
      value: String(estadisticas.completados ?? 0),
      icon: CheckIcon,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "Pedidos vencidos",
      value: String(estadisticas.vencidos ?? 0),
      icon: XMarkIcon,
      className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      label: "Pedidos en progreso",
      value: String(estadisticas.enProgreso ?? 0),
      icon: ClockIcon,
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "Ganancias completadas",
      value: money(estadisticas.gananciasCompletadas ?? 0),
      icon: DocumentTextIcon,
      className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
    },
  ]

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {loading ? (
                    <>
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{card.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">{card.value}</p>
                    </>
                  )}
                </div>
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${card.className}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          )
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {PERIODOS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriodo(option)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${option === periodo ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                {periodoLabel(option)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={clearFilters}>Limpiar</Button>
            <button
              type="button"
              onClick={() => void exportExcel()}
              disabled={excelLoading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-700/50"
            >
              {excelLoading ? "Descargando..." : "Reporte Excel"}
            </button>
          </div>
        </div>
        {periodo === "FECHA" && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {ESTADOS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEstado(option)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${option === estado ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                {estadoLabel(option)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 md:w-[420px]">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido o cliente..." className="h-10 rounded-xl pl-10" />
            </div>
            <Button variant="outline" className="h-10 rounded-xl" onClick={() => void fetchPedidos()}>
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1260px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-5 py-3 text-left">Pedido / Fecha</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-left">Productos</th>
                <th className="px-5 py-3 text-left">Monto / Pago</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Factura</th>
                <th className="px-5 py-3 text-center">Docs</th>
                <th className="px-5 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-14 text-center"><LoaderSpinner text="Cargando pedidos..." /></td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-14 text-center text-sm text-muted-foreground">Sin pedidos para los filtros seleccionados</td></tr>
              ) : (
                pedidos.map((pedido, index) => {
                  const metodoLogo = getMetodoPagoLogo(pedido.metodoPago ?? "")
                  const comprobanteSrc = pedido.comprobanteUrl ? resolveBackendUrl(pedido.comprobanteUrl) : null
                  const tiempo = pedido.estado === "ESPERANDO_COMPROBANTE" ? countdown(pedido.reservaExpiraAt, now) : "-"
                  const factura = wantsInvoice(pedido)
                  return (
                    <tr key={pedido.idEcommercePedido} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950 dark:text-slate-100">#{pedido.codigo.replace(/^#?/, "")}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dateOnly(pedido.fecha)}, {timeOnly(pedido.fecha)} • {pedido.detalles?.length ?? 0} item(s)</p>
                        {tiempo !== "-" ? <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">Reserva {tiempo}</p> : null}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${avatarClass(index)}`}>{initials(pedido)}</div>
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-slate-100">{pedido.cliente.nombres} {pedido.cliente.apellidos}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{pedido.cliente.telefono || pedido.cliente.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <ProductCircles detalles={pedido.detalles ?? []} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950 dark:text-slate-100">{money(pedido.total)}</p>
                        <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          {metodoLogo ? <Image src={metodoLogo.src} alt={metodoLogo.alt} width={13} height={13} className="h-3 w-3 object-contain" /> : null}
                          {getMetodoPagoLabel(pedido.metodoPago ?? "")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${estadoClass(pedido.estado)}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${estadoDotClass(pedido.estado)}`} />
                          {estadoDisplay(pedido.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {factura ? (
                          <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-300">Necesita factura</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">RUC {pedido.cliente.ruc}</p>
                          </div>
                        ) : <span className="text-xs text-slate-400">No</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {comprobanteSrc ? (
                          <button type="button" onClick={() => setSelected(pedido)} className="inline-flex overflow-hidden rounded-lg border border-slate-200 hover:ring-2 hover:ring-blue-400 dark:border-slate-600 dark:hover:ring-blue-500 transition-all">
                            <img src={comprobanteSrc} alt={`Comprobante ${pedido.codigo}`} className="h-14 w-20 object-cover" />
                          </button>
                        ) : (
                          <button type="button" onClick={() => setSelected(pedido)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-200">
                            <DocumentTextIcon className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="icon-sm" title="Ver detalle" onClick={() => setSelected(pedido)}>
                          <EyeIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {loading ? <LoaderSpinner text="Cargando pedidos..." /> : pedidos.map((pedido, index) => (
            <article key={pedido.idEcommercePedido} className="rounded-2xl border bg-slate-50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${avatarClass(index)}`}>{initials(pedido)}</div>
                  <div>
                    <p className="font-bold">#{pedido.codigo}</p>
                    <p className="text-xs text-muted-foreground">{pedido.cliente.nombres} {pedido.cliente.apellidos}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${estadoClass(pedido.estado)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${estadoDotClass(pedido.estado)}`} />
                  {estadoDisplay(pedido.estado)}
                </span>
              </div>
              {wantsInvoice(pedido) ? (
                <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-300">Necesita factura - RUC {pedido.cliente.ruc}</p>
              ) : null}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>{getMetodoPagoLabel(pedido.metodoPago ?? "")}</span>
                <b>{money(pedido.total)}</b>
              </div>
              <div className="mt-3">
                <ProductCircles detalles={pedido.detalles ?? []} />
              </div>
              <Button variant="outline" className="mt-3 w-full" onClick={() => setSelected(pedido)}>
                <EyeIcon className="h-4 w-4" /> Ver detalle
              </Button>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between border-t p-4">
          <p className="text-xs text-muted-foreground">{totalElements} pedidos{totalPages > 0 ? ` - pagina ${page + 1} de ${totalPages}` : ""}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl">
          {selected ? (
            <div>
              <DialogHeader className="border-b px-5 py-4 text-left">
                <DialogTitle>Pedido <span className="text-blue-600">{selected.codigo}</span></DialogTitle>
                <DialogDescription>Revisa el pedido y valida el comprobante de pago.</DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-[1fr_1fr]">
                <div className="space-y-4 border-r p-5 dark:border-slate-700">
                  <section className="rounded-lg border bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="font-semibold">{selected.cliente.nombres} {selected.cliente.apellidos}</p>
                    <div className="mt-2 grid gap-1">
                      <DetailRow label="DNI" value={selected.cliente.dni} />
                      <DetailRow label="Telefono" value={selected.cliente.telefono} />
                      <DetailRow label="Correo" value={selected.cliente.correo} />
                    </div>
                    {wantsInvoice(selected) ? <p className="text-xs font-semibold text-blue-600">Factura RUC {selected.cliente.ruc}</p> : null}
                  </section>
                  <section className="rounded-lg border bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-2 font-semibold">Datos del pedido</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      <DetailRow label="Fecha" value={`${dateOnly(selected.fecha)} ${timeOnly(selected.fecha)}`} />
                      <DetailRow label="Estado" value={estadoDisplay(selected.estado)} />
                      <DetailRow label="Metodo de pago" value={hasText(selected.metodoPago) ? getMetodoPagoLabel(selected.metodoPago ?? "") : null} />
                      <DetailRow label="Sucursal" value={selected.nombreSucursal} />
                      <DetailRow label="Venta" value={selected.ventaNumero} />
                      <DetailRow label="Aceptado por" value={selected.usuarioAceptacionNombre} />
                      <DetailRow label="Aceptado el" value={selected.aceptadoAt ? `${dateOnly(selected.aceptadoAt)} ${timeOnly(selected.aceptadoAt)}` : null} />
                      <DetailRow label="Total" value={<b>{money(selected.total)}</b>} />
                    </div>
                  </section>
                  {(hasText(selected.envio.tipo) || hasText(selected.envio.direccion) || hasText(selected.envio.referencia) || hasText(selected.envio.departamento) || hasText(selected.envio.provincia) || hasText(selected.envio.distrito) || hasText(selected.envio.tarifa)) ? (
                    <section className="rounded-lg border bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="mb-2 font-semibold">Envio</p>
                      <div className="grid gap-1">
                        <DetailRow label="Tipo" value={selected.envio.tipo} />
                        <DetailRow label="Direccion" value={selected.envio.direccion} />
                        <DetailRow label="Referencia" value={selected.envio.referencia} />
                        <DetailRow label="Departamento" value={selected.envio.departamento} />
                        <DetailRow label="Provincia" value={selected.envio.provincia} />
                        <DetailRow label="Distrito" value={selected.envio.distrito} />
                        <DetailRow label="Tarifa" value={selected.envio.tarifa} />
                      </div>
                    </section>
                  ) : null}
                  <section className="overflow-hidden rounded-lg border">
                    {selected.detalles.map((detalle, index) => {
                      const imagen = detalle.imagenUrl ? resolveBackendUrl(detalle.imagenUrl) : null
                      return (
                      <div key={`${detalle.idProductoVariante}-${index}`} className="flex items-center justify-between border-b p-3 last:border-0 dark:border-slate-700">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-800">
                            {imagen ? <img src={imagen} alt={detalle.nombreProducto || "Producto"} className="h-full w-full object-cover" /> : "IMG"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{detalle.nombreProducto || "Producto"}</p>
                            <p className="text-xs text-muted-foreground">{detalle.colorNombre || "-"} / {detalle.tallaNombre || "-"} x{detalle.cantidad}</p>
                          </div>
                        </div>
                        <b>{money(detalle.subtotal)}</b>
                      </div>
                    )})}
                    <div className="flex justify-between bg-slate-50 p-3 dark:bg-slate-800/50"><span>Total</span><b>{money(selected.total)}</b></div>
                  </section>
                </div>
                <div className="space-y-4 bg-slate-50 p-5 dark:bg-slate-800/50">
                  <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed bg-white p-4 dark:border-slate-600 dark:bg-slate-800">
                    {selected.comprobanteUrl ? (
                      <img src={resolveBackendUrl(selected.comprobanteUrl) ?? ""} alt="Comprobante" className="max-h-[280px] w-full object-contain" />
                    ) : <p className="text-sm text-muted-foreground">Sin comprobante</p>}
                  </div>
                  {selected.estado === "PAGO_EN_REVISION" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950" onClick={() => { setCancelTarget(selected); setSelected(null) }}>
                        <XMarkIcon className="h-4 w-4" /> Rechazar Pago
                      </Button>
                      <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => { setAcceptTarget(selected); setSelected(null); setSelectedComprobanteId("") }}>
                        <CheckIcon className="h-4 w-4" /> Aprobar Pedido
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(acceptTarget)} onOpenChange={(open) => !open && setAcceptTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceptar pedido {acceptTarget?.codigo}</DialogTitle>
            <DialogDescription>Se generara una venta con origen WEB.</DialogDescription>
          </DialogHeader>
          {acceptTarget ? (
            <section className="rounded-lg border bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Cliente:</span> {acceptTarget.cliente.nombres} {acceptTarget.cliente.apellidos}</p>
                <p><span className="text-muted-foreground">Telefono:</span> {acceptTarget.cliente.telefono || "-"}</p>
                <p><span className="text-muted-foreground">Fecha:</span> {dateOnly(acceptTarget.fecha)} {timeOnly(acceptTarget.fecha)}</p>
                <p><span className="text-muted-foreground">Total:</span> <b>{money(acceptTarget.total)}</b></p>
                <p><span className="text-muted-foreground">Documento:</span> <b>{comprobanteSeleccionado?.tipoComprobante ?? (wantsInvoice(acceptTarget) ? "FACTURA" : "NOTA DE VENTA")}</b></p>
                {wantsInvoice(acceptTarget) ? <p><span className="text-muted-foreground">RUC:</span> {rucInput || acceptTarget.cliente.ruc}</p> : null}
              </div>
              {wantsInvoice(acceptTarget) ? (
                <div className="mt-3 border-t pt-3 text-sm dark:border-slate-700">
                  {loadingRuc ? <p className="text-blue-600">Consultando RUC...</p> : null}
                  {rucData ? (
                    <div className="space-y-1">
                      <p><span className="text-muted-foreground">Razon social:</span> <b>{rucData.razonSocial}</b></p>
                      <p className="text-xs text-muted-foreground">Estado: {rucData.estado || "-"} - Condicion: {rucData.condicion || "-"}</p>
                    </div>
                  ) : null}
                  {rucError ? <p className="text-red-600">{rucError}</p> : null}
                  {!rucData ? <p className="mt-1 text-xs text-muted-foreground">Puedes aprobar como boleta o nota de venta, o corregir el RUC para emitir factura.</p> : null}
                  {editingRuc ? (
                    <div className="mt-3 flex gap-2">
                      <Input value={rucInput} onChange={(event) => setRucInput(event.target.value.replace(/\D/g, "").slice(0, 11))} maxLength={11} className="h-9" />
                      <Button type="button" size="sm" onClick={() => void consultarRuc(rucInput)} disabled={loadingRuc}>Verificar</Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setEditingRuc(true)}>
                      Editar RUC
                    </Button>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}
          <label className="block text-sm font-medium">
            Comprobante
            <select value={selectedComprobanteId} onChange={(event) => setSelectedComprobanteId(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" disabled={loadingComprobantes}>
              <option value="">{loadingComprobantes ? "Cargando comprobantes..." : "Seleccione comprobante"}</option>
              {comprobantesDisponibles.map((item) => <option key={item.idComprobante} value={item.idComprobante}>{buildComprobanteLabel(item)}</option>)}
            </select>
          </label>
          {wantsInvoice(acceptTarget) && !rucData?.razonSocial && !loadingComprobantes && comprobantesDisponibles.length === 0 ? <p className="text-sm text-red-600">No hay BOLETA o NOTA DE VENTA habilitada para aprobar sin razon social.</p> : null}
          {wantsInvoice(acceptTarget) && rucData?.razonSocial && !loadingComprobantes && comprobantesDisponibles.length === 0 ? <p className="text-sm text-red-600">No hay comprobante FACTURA habilitado para venta web.</p> : null}
          {errorComprobantes ? <p className="text-sm text-red-600">{errorComprobantes}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptTarget(null)} disabled={busy}>Cancelar</Button>
            <Button onClick={() => void acceptPedido()} disabled={busy || loadingComprobantes || loadingRuc || !comprobanteSeleccionado || (comprobanteSeleccionado?.tipoComprobante === "FACTURA" && !rucData?.razonSocial)}>
              {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
              Aceptar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido {cancelTarget?.codigo}</DialogTitle>
            <DialogDescription>Se liberara el stock reservado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={busy}>Volver</Button>
            <Button variant="destructive" onClick={() => void cancelPedido()} disabled={busy}>
              {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
