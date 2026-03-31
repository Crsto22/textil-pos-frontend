"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
  getSunatBadgeClass,
} from "@/components/ventas/historial/historial.utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useVentaDetalle } from "@/lib/hooks/useVentaDetalle"
import { useVentasHistorial } from "@/lib/hooks/useVentasHistorial"
import {
  getNotaCreditoDownloadConfig,
  openNotaCreditoDocument,
} from "@/lib/nota-credito-documents"
import { NOTA_CREDITO_MOTIVO_OPTIONS } from "@/lib/nota-credito"
import type { VentaHistorialFilters, VentaNotaCreditoMotivoCodigo, VentaNotaCreditoRequest } from "@/lib/types/venta"

function getTodayDateValue(): string {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

function parsePositiveNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isNotaCreditoComprobante(tipoComprobante: string): boolean {
  const normalized = tipoComprobante.trim().toUpperCase()
  return normalized === "BOLETA" || normalized === "FACTURA"
}

type ComprobanteFiltro = "TODOS" | "BOLETA" | "FACTURA"
type NotaCreditoMotivo = Extract<VentaNotaCreditoMotivoCodigo, "02" | "03" | "06" | "07">

const TODAY_DATE = getTodayDateValue()
const GLOBAL_SEARCH_START_DATE = "2000-01-01"
const DEFAULT_MOTIVO: NotaCreditoMotivo = "02"
const ESTADO_EMITIDA = "EMITIDA"
const MOTIVOS_REQUIEREN_ITEMS = new Set<NotaCreditoMotivo>(["07"])

function getResponseMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback
  const data = payload as Record<string, unknown>
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message
  }
  return fallback
}

function extractNotaCreditoId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null

  const data = payload as Record<string, unknown>

  const directId = Number(data.idNotaCredito)
  if (Number.isInteger(directId) && directId > 0) {
    return directId
  }

  const nestedResponse = data.response
  if (nestedResponse && typeof nestedResponse === "object") {
    const nestedId = Number((nestedResponse as Record<string, unknown>).idNotaCredito)
    if (Number.isInteger(nestedId) && nestedId > 0) {
      return nestedId
    }
  }

  return null
}

const DEFAULT_FILTERS: VentaHistorialFilters = {
  search: "",
  estado: ESTADO_EMITIDA,
  comprobante: "TODOS",
  idUsuario: null,
  idSucursal: null,
  idCliente: null,
  periodo: "HOY",
  usarRangoFechas: false,
  fecha: TODAY_DATE,
  fechaDesde: TODAY_DATE,
  fechaHasta: TODAY_DATE,
}

export function NuevaNotaCreditoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialVentaId = parsePositiveNumber(searchParams.get("idVenta"))

  const [filters, setFilters] = useState<VentaHistorialFilters>(DEFAULT_FILTERS)
  const [comprobanteFiltro, setComprobanteFiltro] = useState<ComprobanteFiltro>("TODOS")
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(initialVentaId)
  const [codigoMotivo, setCodigoMotivo] = useState<NotaCreditoMotivo>(DEFAULT_MOTIVO)
  const [descripcionMotivo, setDescripcionMotivo] = useState("")
  const [selectedCantidades, setSelectedCantidades] = useState<Record<number, number>>({})
  const [isSubmittingNotaCredito, setIsSubmittingNotaCredito] = useState(false)

  const motivoDescriptionByCode = useMemo(() => {
    const descriptionMap = {} as Record<NotaCreditoMotivo, string>
    for (const option of NOTA_CREDITO_MOTIVO_OPTIONS) {
      descriptionMap[option.value as NotaCreditoMotivo] = option.label
    }
    return descriptionMap
  }, [])

  const queryFilters = useMemo<VentaHistorialFilters>(() => {
    const hasSearchTerm = filters.search.trim().length > 0

    if (!hasSearchTerm) {
      return filters
    }

    return {
      ...filters,
      usarRangoFechas: true,
      fechaDesde: GLOBAL_SEARCH_START_DATE,
      fechaHasta: TODAY_DATE,
    }
  }, [filters])

  const {
    ventas,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    setDisplayedPage,
    refreshVentas,
  } = useVentasHistorial(queryFilters)

  const {
    detalle,
    loading: loadingDetalle,
    error: errorDetalle,
    openVentaDetalle,
    retryVentaDetalle,
  } = useVentaDetalle()

  useEffect(() => {
    if (!initialVentaId) return

    setSelectedVentaId(initialVentaId)
    void openVentaDetalle(initialVentaId)
  }, [initialVentaId, openVentaDetalle])

  useEffect(() => {
    setSelectedCantidades({})
  }, [selectedVentaId])

  useEffect(() => {
    setDescripcionMotivo(motivoDescriptionByCode[codigoMotivo] ?? "")
  }, [codigoMotivo, motivoDescriptionByCode])

  useEffect(() => {
    if (!MOTIVOS_REQUIEREN_ITEMS.has(codigoMotivo)) {
      setSelectedCantidades({})
    }
  }, [codigoMotivo])

  const isVentaEmitida = (estado: string) => {
    const normalized = estado.trim().toUpperCase()
    return normalized === ESTADO_EMITIDA || normalized === "EMITIDO"
  }

  const ventasPermitidas = useMemo(
    () =>
      ventas.filter(
        (venta) =>
          isNotaCreditoComprobante(venta.tipoComprobante) && isVentaEmitida(venta.estado)
      ),
    [ventas]
  )

  const ventasFiltradas = useMemo(() => {
    if (comprobanteFiltro === "TODOS") return ventasPermitidas
    return ventasPermitidas.filter(
      (venta) => venta.tipoComprobante.trim().toUpperCase() === comprobanteFiltro
    )
  }, [comprobanteFiltro, ventasPermitidas])

  const detalleEsValido = detalle ? isNotaCreditoComprobante(detalle.tipoComprobante) : true
  const requiereItems = MOTIVOS_REQUIEREN_ITEMS.has(codigoMotivo)

  const itemsSeleccionados = useMemo(() => {
    if (!detalle) return []

    return detalle.detalles
      .map((item) => {
        const cantidad = selectedCantidades[item.idVentaDetalle] ?? 0
        return {
          idVentaDetalle: item.idVentaDetalle,
          cantidad,
          cantidadMaxima: item.cantidad,
          nombreProducto: item.nombreProducto,
        }
      })
      .filter((item) => item.cantidad > 0)
  }, [detalle, selectedCantidades])

  const handleCantidadItemChange = (idVentaDetalle: number, rawValue: string, maxValue: number) => {
    const parsed = Number(rawValue)

    setSelectedCantidades((current) => {
      if (!rawValue || !Number.isFinite(parsed) || parsed <= 0) {
        const next = { ...current }
        delete next[idVentaDetalle]
        return next
      }

      const bounded = Math.min(Math.max(Math.floor(parsed), 1), Math.max(maxValue, 1))
      return {
        ...current,
        [idVentaDetalle]: bounded,
      }
    })
  }

  const buildNotaCreditoPayload = (): { ok: true; payload: VentaNotaCreditoRequest } | { ok: false } => {
    if (!detalle || !detalleEsValido) {
      toast.error("Selecciona una boleta o factura valida")
      return { ok: false }
    }

    const normalizedDescripcion = descripcionMotivo.trim()

    if (!normalizedDescripcion) {
      toast.error("La descripcion del motivo es obligatoria")
      return { ok: false }
    }

    if (normalizedDescripcion.length < 5) {
      toast.error("La descripcion del motivo debe tener al menos 5 caracteres")
      return { ok: false }
    }

    if (normalizedDescripcion.length > 255) {
      toast.error("La descripcion del motivo no puede exceder 255 caracteres")
      return { ok: false }
    }

    if (!MOTIVOS_REQUIEREN_ITEMS.has(codigoMotivo)) {
      return {
        ok: true,
        payload: {
          codigoMotivo,
          descripcionMotivo: normalizedDescripcion,
          items: [],
        },
      }
    }

    if (itemsSeleccionados.length === 0) {
      toast.error("Para el motivo 07 debes seleccionar al menos un item")
      return { ok: false }
    }

    for (const item of itemsSeleccionados) {
      if (item.cantidad <= 0 || item.cantidad > item.cantidadMaxima) {
        toast.error(`Cantidad invalida en ${item.nombreProducto}`)
        return { ok: false }
      }
    }

    return {
      ok: true,
      payload: {
        codigoMotivo,
        descripcionMotivo: normalizedDescripcion,
        items: itemsSeleccionados.map((item) => ({
          idVentaDetalle: item.idVentaDetalle,
          cantidad: item.cantidad,
        })),
      },
    }
  }

  const handleEmitirNotaCredito = async () => {
    if (!detalle || isSubmittingNotaCredito) return

    const payloadResult = buildNotaCreditoPayload()
    if (!payloadResult.ok) return

    setIsSubmittingNotaCredito(true)
    try {
      const response = await authFetch(`/api/venta/${detalle.idVenta}/nota-credito`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadResult.payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error(getResponseMessage(data, "No se pudo emitir la nota de credito"))
        return
      }

      toast.success(getResponseMessage(data, "Nota de credito emitida correctamente"))

      const idNotaCredito = extractNotaCreditoId(data)
      if (idNotaCredito) {
        const openResult = await openNotaCreditoDocument(
          getNotaCreditoDownloadConfig("pdf", { idNotaCredito })
        )

        if (!openResult.ok) {
          toast.error("La nota se emitio, pero no se pudo abrir el PDF.")
        }
      }

      setSelectedCantidades({})
      setDescripcionMotivo("")

      await Promise.all([
        retryVentaDetalle(),
        refreshVentas(),
      ])

      router.push("/ventas/nota-credito")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo emitir la nota de credito"
      )
    } finally {
      setIsSubmittingNotaCredito(false)
    }
  }

  return (
    <div className="space-y-4">
      {!selectedVentaId ? (
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Nueva nota de credito</p>
              <p className="text-xs text-muted-foreground">
                Selecciona una boleta o factura con estado emitida y revisa su detalle antes de emitir la nota.
              </p>
              <p className="text-xs text-muted-foreground">
                Sin texto se muestran ventas de hoy. Al buscar, se consulta todo el historial.
              </p>
            </div>
            <Link
              href="/ventas/nota-credito"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Volver a notas de credito
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Buscar venta</label>
              <div className="relative mt-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder="Buscar por cliente, numero de comprobante o id..."
                  className="h-10 pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Comprobante</label>
              <select
                value={comprobanteFiltro}
                onChange={(event) => setComprobanteFiltro(event.target.value as ComprobanteFiltro)}
                className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none"
              >
                <option value="TODOS">Boletas y facturas</option>
                <option value="BOLETA">Solo boletas</option>
                <option value="FACTURA">Solo facturas</option>
              </select>
            </div>
          </div>
        </section>
      ) : null}

      {!selectedVentaId ? (
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
          {error ? (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  void refreshVentas()
                }}
                className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold hover:bg-rose-100 dark:border-rose-700 dark:hover:bg-rose-900/40"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm" style={{ minWidth: "960px" }}>
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Comprobante</th>
                  <th className="px-3 py-3 text-left">Cliente</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-center">SUNAT</th>
                  <th className="px-3 py-3 text-center">Accion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      Cargando ventas...
                    </td>
                  </tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      No hay boletas/facturas emitidas para los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((venta) => (
                    <tr key={venta.idVenta} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-3 font-medium">{formatFechaHora(venta.fecha)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">{venta.tipoComprobante}</span>
                          <span className="text-xs text-muted-foreground">{formatComprobante(venta)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">{venta.nombreCliente || "Sin cliente"}</td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {formatMonto(venta.total, venta.moneda)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(venta.estado)}`}
                        >
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSunatBadgeClass(venta.sunatEstado)}`}
                        >
                          {venta.sunatEstado || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVentaId(venta.idVenta)
                            void openVentaDetalle(venta.idVenta)
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              {totalElements} venta(s)
              {totalPages > 0 ? ` - Pagina ${page + 1} de ${totalPages}` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setDisplayedPage(page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setDisplayedPage(page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {selectedVentaId ? (
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <p className="text-sm font-semibold">Detalle de venta seleccionada</p>
            <p className="text-xs text-muted-foreground">
              Vista previa de productos para preparar la nota de credito.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedVentaId ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedVentaId(null)
                  setSelectedCantidades({})
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
              >
                Regresar para seleccionar otra boleta/factura
              </button>
            ) : null}
            {selectedVentaId ? (
              <button
                type="button"
                onClick={() => {
                  void retryVentaDetalle()
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Recargar
              </button>
            ) : null}
          </div>
        </div>

        {loadingDetalle ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando detalle...</p>
        ) : errorDetalle ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
            {errorDetalle}
          </p>
        ) : detalle && !detalleEsValido ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
            La venta seleccionada no es boleta ni factura, por lo que no aplica para nota de credito.
          </p>
        ) : detalle ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Comprobante</p>
                <p className="mt-1 text-sm font-semibold">
                  {detalle.tipoComprobante} {formatComprobante(detalle)}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cliente</p>
                <p className="mt-1 text-sm font-semibold">{detalle.nombreCliente || "Sin cliente"}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fecha</p>
                <p className="mt-1 text-sm font-semibold">{formatFechaHora(detalle.fecha)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="mt-1 text-sm font-semibold">{formatMonto(detalle.total, detalle.moneda)}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm" style={{ minWidth: requiereItems ? "1040px" : "860px" }}>
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 text-left">Producto</th>
                    <th className="px-3 py-3 text-left">Variante</th>
                    <th className="px-3 py-3 text-center">Cantidad</th>
                    <th className="px-3 py-3 text-right">Precio</th>
                    <th className="px-3 py-3 text-right">Descuento</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    {requiereItems ? (
                      <th className="px-3 py-3 text-center">Devolucion parcial</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {detalle.detalles.length === 0 ? (
                    <tr>
                      <td colSpan={requiereItems ? 7 : 6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                        Esta venta no tiene productos registrados.
                      </td>
                    </tr>
                  ) : (
                    detalle.detalles.map((item) => {
                      const cantidadActual = selectedCantidades[item.idVentaDetalle] ?? 0

                      return (
                        <tr key={item.idVentaDetalle} className="border-b last:border-0">
                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{item.nombreProducto}</span>
                              <span className="text-xs text-muted-foreground">{item.descripcion}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            Color: {item.color || "-"} / Talla: {item.talla || "-"}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold">{item.cantidad}</td>
                          <td className="px-3 py-3 text-right">{formatMonto(item.precioUnitario, detalle.moneda)}</td>
                          <td className="px-3 py-3 text-right">{formatMonto(item.descuento, detalle.moneda)}</td>
                          <td className="px-3 py-3 text-right font-semibold">
                            {formatMonto(item.totalDetalle, detalle.moneda)}
                          </td>
                          {requiereItems ? (
                            <td className="px-3 py-3">
                              <Input
                                type="number"
                                min="0"
                                max={String(item.cantidad)}
                                step="1"
                                value={cantidadActual > 0 ? String(cantidadActual) : ""}
                                onChange={(event) =>
                                  handleCantidadItemChange(
                                    item.idVentaDetalle,
                                    event.target.value,
                                    item.cantidad
                                  )
                                }
                                className="h-9"
                                placeholder={`0 - ${item.cantidad}`}
                                disabled={isSubmittingNotaCredito}
                              />
                            </td>
                          ) : null}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-sm font-semibold">Emitir nota de credito</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Motivos habilitados: 02, 03, 06 y 07. Para 07 debes indicar items y cantidades.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Codigo motivo</label>
                  <select
                    value={codigoMotivo}
                    onChange={(event) => setCodigoMotivo(event.target.value as NotaCreditoMotivo)}
                    disabled={isSubmittingNotaCredito}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {NOTA_CREDITO_MOTIVO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Descripcion motivo
                  </label>
                  <Textarea
                    value={descripcionMotivo}
                    onChange={(event) => setDescripcionMotivo(event.target.value)}
                    disabled={isSubmittingNotaCredito}
                    maxLength={255}
                    placeholder="Describe el motivo de la nota de credito"
                    className="min-h-21 resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {descripcionMotivo.trim().length}/255 caracteres
                  </p>
                </div>
              </div>

              {requiereItems ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Completa las cantidades a devolver directamente en la columna &quot;Devolucion parcial&quot; de la tabla.
                </p>
              ) : null}

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    void handleEmitirNotaCredito()
                  }}
                  disabled={isSubmittingNotaCredito || !detalleEsValido}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingNotaCredito ? "Emitiendo..." : "Emitir nota de credito"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No se encontro detalle para la venta seleccionada.
          </p>
        )}
        </section>
      ) : null}
    </div>
  )
}
