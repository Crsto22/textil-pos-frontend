"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowPathIcon, CubeIcon, TrashIcon } from "@heroicons/react/24/outline"

import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { formatearRangoOferta, obtenerEstadoVigenciaOferta } from "@/lib/oferta-utils"
import { useOfertasDisponibles } from "@/lib/hooks/useOfertasDisponibles"
import { cn } from "@/lib/utils"

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

function getColorIndicatorStyle(colorHex: string) {
  if (typeof colorHex === "string" && /^#[0-9a-f]{3,8}$/i.test(colorHex.trim())) {
    return { backgroundColor: colorHex.trim() }
  }

  return undefined
}

function hasFiniteStock(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function getStockBadgeClassName(stock: number) {
  if (stock <= 0) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
  }

  if (stock <= 5) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
  }

  if (stock <= 15) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
}

function OfertaRegistradaVariantPreview({
  imageUrl,
  productName,
  colorName,
  tallaName,
}: {
  imageUrl: string | null
  productName: string
  colorName: string
  tallaName: string
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldRenderImage =
    typeof imageUrl === "string" && imageUrl !== "" && imageUrl !== failedImageUrl

  return (
    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
      {shouldRenderImage ? (
        <Image
          src={imageUrl}
          alt={`${productName} - ${colorName} - Talla ${tallaName}`}
          fill
          unoptimized
          className="object-cover"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <CubeIcon className="h-5 w-5" />
      )}
    </span>
  )
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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">
                  <th className="w-14 border-b border-slate-200 px-4 py-3 dark:border-neutral-800" />
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Variante
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Color talla
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Sucursal
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                    Precio
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                    Oferta
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Stock
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Vigencia
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {offers.map((offer) => {
                  const estadoOferta = obtenerEstadoVigenciaOferta(offer)
                  const selected = selectedIdSet.has(offer.idProductoVariante)
                  const colorDotStyle = getColorIndicatorStyle(offer.colorHex)

                  return (
                    <tr
                      key={offer.idProductoVariante}
                      className={cn(
                        "transition-colors",
                        selected
                          ? "bg-amber-50/60 dark:bg-amber-500/5"
                          : "bg-transparent"
                      )}
                    >
                      <td className="border-b border-slate-200 px-4 py-3 align-top dark:border-neutral-800">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleSelected(offer.idProductoVariante)}
                          aria-label={`Seleccionar ${offer.sku || offer.idProductoVariante}`}
                          className="mt-1 rounded-md"
                        />
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                          <OfertaRegistradaVariantPreview
                            imageUrl={offer.imageUrl}
                            productName={offer.productoNombre}
                            colorName={offer.colorNombre}
                            tallaName={offer.tallaNombre}
                          />

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-white">
                              {offer.productoNombre}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">
                              {offer.sku || `Variante #${offer.idProductoVariante}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={colorDotStyle}
                            />
                            {offer.colorNombre}
                          </span>
                          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                            {offer.tallaNombre}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 text-slate-600 dark:border-neutral-800 dark:text-neutral-300">
                        {offer.sucursalNombre || "Sin sucursal"}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 text-right font-semibold text-slate-900 dark:border-neutral-800 dark:text-white">
                        {formatMonedaPen(offer.precio)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 text-right font-semibold text-amber-600 dark:border-neutral-800 dark:text-amber-300">
                        {typeof offer.precioOferta === "number"
                          ? formatMonedaPen(offer.precioOferta)
                          : "-"}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        {hasFiniteStock(offer.stock) ? (
                          <span
                            className={cn(
                              "inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                              getStockBadgeClassName(offer.stock)
                            )}
                          >
                            {offer.stock}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-neutral-500">-</span>
                        )}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 text-slate-600 dark:border-neutral-800 dark:text-neutral-300">
                        {formatearRangoOferta(offer.ofertaInicio, offer.ofertaFin)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            getOfferStatusBadgeClassName(estadoOferta)
                          )}
                        >
                          {getOfferStatusLabel(estadoOferta)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
