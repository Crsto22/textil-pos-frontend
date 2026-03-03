"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { VentaDetalleModal } from "@/components/ventas/historial/VentaDetalleModal"
import { VentasHistorialFilters } from "@/components/ventas/historial/VentasHistorialFilters"
import { VentasHistorialStats } from "@/components/ventas/historial/VentasHistorialStats"
import { VentasHistorialTable } from "@/components/ventas/historial/VentasHistorialTable"
import { formatComprobante } from "@/components/ventas/historial/historial.utils"
import { useVentaDetalle } from "@/lib/hooks/useVentaDetalle"
import { useVentasHistorial } from "@/lib/hooks/useVentasHistorial"
import type { VentaHistorialFilters } from "@/lib/types/venta"

const DEFAULT_FILTERS: VentaHistorialFilters = {
  search: "",
  estado: "TODOS",
  comprobante: "TODOS",
  fechaDesde: "",
  fechaHasta: "",
}

function normalizeDateFromInput(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function normalizeDateToInput(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T23:59:59`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function VentasHistorialPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<VentaHistorialFilters>(DEFAULT_FILTERS)
  const {
    ventas,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshVentas,
  } = useVentasHistorial()
  const {
    open: detailOpen,
    detalle,
    loading: detailLoading,
    error: detailError,
    openVentaDetalle,
    retryVentaDetalle,
    closeVentaDetalle,
  } = useVentaDetalle()

  useEffect(() => {
    const ventaIdParam = searchParams.get("ventaId")
    if (!ventaIdParam) return

    const ventaId = Number(ventaIdParam)
    if (!Number.isFinite(ventaId) || ventaId <= 0) return

    void openVentaDetalle(ventaId)
    router.replace(pathname, { scroll: false })
  }, [openVentaDetalle, pathname, router, searchParams])

  const estadoOptions = useMemo(() => {
    const values = new Set<string>()
    ventas.forEach((venta) => {
      if (venta.estado?.trim()) values.add(venta.estado.trim().toUpperCase())
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [ventas])

  const filteredVentas = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase()
    const from = normalizeDateFromInput(filters.fechaDesde)
    const to = normalizeDateToInput(filters.fechaHasta)

    return ventas.filter((venta) => {
      const estadoNormalizado = venta.estado.trim().toUpperCase()
      const comprobanteNormalizado = venta.tipoComprobante.trim().toUpperCase()

      if (filters.estado !== "TODOS" && estadoNormalizado !== filters.estado) {
        return false
      }

      if (
        filters.comprobante !== "TODOS" &&
        comprobanteNormalizado !== filters.comprobante
      ) {
        return false
      }

      const fechaVenta = new Date(venta.fecha)
      if (from && fechaVenta < from) return false
      if (to && fechaVenta > to) return false

      if (!searchTerm) return true

      const hayTexto = [
        String(venta.idVenta),
        venta.nombreCliente,
        venta.nombreUsuario,
        venta.nombreSucursal,
        comprobanteNormalizado,
        estadoNormalizado,
        formatComprobante(venta),
      ]
        .join(" ")
        .toLowerCase()

      return hayTexto.includes(searchTerm)
    })
  }, [filters, ventas])

  const totalMontoPagina = useMemo(
    () => filteredVentas.reduce((sum, venta) => sum + venta.total, 0),
    [filteredVentas]
  )
  const totalEmitidas = useMemo(
    () => filteredVentas.filter((venta) => venta.estado.toUpperCase() === "EMITIDA").length,
    [filteredVentas]
  )
  const totalAnuladas = useMemo(
    () => filteredVentas.filter((venta) => venta.estado.toUpperCase() === "ANULADA").length,
    [filteredVentas]
  )

  const handleFiltersChange = (next: VentaHistorialFilters) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="space-y-4">
      <VentasHistorialFilters
        filters={filters}
        estadoOptions={estadoOptions}
        totalShown={filteredVentas.length}
        pageElements={numberOfElements}
        totalElements={totalElements}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      <VentasHistorialStats
        ventasPaginaCount={filteredVentas.length}
        totalElements={totalElements}
        emitidasCount={totalEmitidas}
        anuladasCount={totalAnuladas}
        totalMontoPagina={totalMontoPagina}
      />

      <VentasHistorialTable
        ventas={filteredVentas}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onRetry={() => {
          void refreshVentas()
        }}
        onPageChange={setDisplayedPage}
        onViewDetail={(venta) => {
          void openVentaDetalle(venta.idVenta)
        }}
      />

      <VentaDetalleModal
        open={detailOpen}
        detalle={detalle}
        loading={detailLoading}
        error={detailError}
        onRetry={() => {
          void retryVentaDetalle()
        }}
        onOpenChange={(open) => {
          if (!open) {
            closeVentaDetalle()
          }
        }}
      />
    </div>
  )
}
