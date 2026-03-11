"use client"

import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline"

import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { OfertaVariantCard } from "@/components/productos/ofertas/OfertaVariantCard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  formatearRangoOferta,
  normalizarFechaHoraLocal,
  obtenerEstadoVigenciaOferta,
} from "@/lib/oferta-utils"
import { useOfertasDisponibles } from "@/lib/hooks/useOfertasDisponibles"

interface OfertasRegistradasSectionProps {
  refreshToken: number
}

function getOfferStatusBadgeClassName(estado: ReturnType<typeof obtenerEstadoVigenciaOferta>) {
  switch (estado) {
    case "activa":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
    case "programada":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
    case "vencida":
      return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
    case "indefinida":
      return "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300"
    default:
      return "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300"
  }
}

function getOfferStatusLabel(estado: ReturnType<typeof obtenerEstadoVigenciaOferta>) {
  switch (estado) {
    case "activa":
      return "Activa"
    case "programada":
      return "Programada"
    case "vencida":
      return "Vencida"
    case "indefinida":
      return "Sin fecha"
    default:
      return "Invalida"
  }
}

function formatOfferCardDate(value: string | null | undefined): string | null {
  const normalizedValue = normalizarFechaHoraLocal(value)
  if (normalizedValue === "") return null

  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) return null

  const parts = parsed
    .toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replaceAll(".", "")
    .split(" ")

  if (parts.length >= 2) {
    parts[1] = parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
  }

  return parts.join(" ")
}

export function OfertasRegistradasSection({
  refreshToken,
}: OfertasRegistradasSectionProps) {
  const {
    offers,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    removing,
    selectedIds,
    selectedIdSet,
    allCurrentPageSelected,
    setPage,
    refresh,
    toggleSelected,
    toggleSelectAllCurrentPage,
    removeSelectedOffers,
  } = useOfertasDisponibles(refreshToken)

  return (
    <div className="space-y-5">
      <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3">
            <Checkbox
              checked={allCurrentPageSelected}
              onCheckedChange={() => toggleSelectAllCurrentPage()}
              disabled={offers.length === 0 || loading || removing}
              className="size-5 rounded-md border-slate-300"
              aria-label="Seleccionar todas las ofertas de la pagina"
            />

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                {selectedIds.length} seleccionada{selectedIds.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {totalElements} oferta{totalElements === 1 ? "" : "s"} disponible
                {totalElements === 1 ? "" : "s"} en esta vista
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => {
                void refresh()
              }}
              disabled={loading || removing}
              aria-label="Actualizar ofertas"
              className="rounded-xl border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
            >
              <ArrowPathIcon className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void removeSelectedOffers()
              }}
              disabled={removing || selectedIds.length === 0}
              className="rounded-xl border-rose-100 bg-rose-50 px-4 font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
            >
              {removing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4" />
                  Eliminar Ofertas
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {loading ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Cargando ofertas...
          </span>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay ofertas disponibles en esta pagina.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {offers.map((offer) => {
            const estadoOferta = obtenerEstadoVigenciaOferta(offer)
            const selected = selectedIdSet.has(offer.idProductoVariante)

            return (
              <OfertaVariantCard
                key={offer.idProductoVariante}
                productoNombre={offer.productoNombre}
                colorNombre={offer.colorNombre}
                tallaNombre={offer.tallaNombre}
                sku={offer.sku || `Variante #${offer.idProductoVariante}`}
                precio={offer.precio}
                precioOferta={offer.precioOferta}
                vigenciaLabel={formatearRangoOferta(offer.ofertaInicio, offer.ofertaFin)}
                imageUrl={offer.imageUrl}
                locationLabel={offer.sucursalNombre || "Sin sucursal"}
                startLabel={formatOfferCardDate(offer.ofertaInicio)}
                endLabel={formatOfferCardDate(offer.ofertaFin)}
                selected={selected}
                onSelect={() => toggleSelected(offer.idProductoVariante)}
                primaryBadge={{
                  label: getOfferStatusLabel(estadoOferta),
                  className: getOfferStatusBadgeClassName(estadoOferta),
                }}
              />
            )
          })}
        </div>
      )}

      <ProductosPagination
        totalElements={totalElements}
        totalPages={totalPages}
        page={page}
        onPageChange={setPage}
        itemLabel="ofertas"
        activePageClassName="bg-slate-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
        inactivePageClassName="text-muted-foreground hover:bg-slate-100 dark:hover:bg-neutral-800"
      />
    </div>
  )
}
