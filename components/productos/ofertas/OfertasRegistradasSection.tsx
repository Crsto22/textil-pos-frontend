"use client"

import { type ReactNode, useState } from "react"
import Image from "next/image"
import { ArrowPathIcon, CubeIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { obtenerCountdownOfertaResumido, obtenerEstadoVigenciaOferta } from "@/lib/oferta-utils"
import { useOfertasDisponibles } from "@/lib/hooks/useOfertasDisponibles"
import type { TipoOfertaAplicada } from "@/lib/types/oferta"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { roleIsRestrictedToSucursalOffer } from "@/lib/auth/roles"

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
    case "activa": return "Activa"
    case "programada": return "Programada"
    case "vencida": return "Vencida"
    case "indefinida": return "Sin fecha"
    default: return "Invalida"
  }
}

function getTipoOfertaBadgeClassName(tipo: TipoOfertaAplicada | null) {
  switch (tipo) {
    case "SUCURSAL":
      return "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
    case "GLOBAL":
      return "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
    default:
      return "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
  }
}

function getTipoOfertaLabel(tipo: TipoOfertaAplicada | null) {
  switch (tipo) {
    case "SUCURSAL": return "Oferta sucursal"
    case "GLOBAL": return "Oferta global"
    default: return "Sin oferta"
  }
}

function getColorIndicatorStyle(colorHex: string) {
  if (typeof colorHex === "string" && /^#[0-9a-f]{3,8}$/i.test(colorHex.trim())) {
    return { backgroundColor: colorHex.trim() }
  }
  return undefined
}

function OfferBadge({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent px-2.5 py-1 text-xs font-semibold", className)}
    >
      {children}
    </Badge>
  )
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

export function OfertasRegistradasSection({ refreshToken }: OfertasRegistradasSectionProps) {
  const { user } = useAuth()
  const isRestrictedRole = roleIsRestrictedToSucursalOffer(user?.rol)

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
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3">
            {!isRestrictedRole && (
              <Checkbox
                checked={allCurrentPageSelected}
                onCheckedChange={() => toggleSelectAllCurrentPage()}
                disabled={offers.length === 0 || loading || removing}
                className="size-5 rounded-md border-slate-300"
                aria-label="Seleccionar todas las ofertas de la pagina"
              />
            )}
            <div>
              {!isRestrictedRole && (
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {selectedIds.length} seleccionada{selectedIds.length === 1 ? "" : "s"}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {totalElements} oferta{totalElements === 1 ? "" : "s"} globales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => { void refresh() }}
              disabled={loading || removing}
              aria-label="Actualizar ofertas"
              className="rounded-xl border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
            >
              <ArrowPathIcon className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>

            {!isRestrictedRole && (
              <Button
                type="button"
                variant="outline"
                onClick={() => { void removeSelectedOffers() }}
                disabled={removing || selectedIds.length === 0}
                className="rounded-xl border-rose-100 bg-rose-50 px-4 font-semibold text-rose-600 shadow-xs hover:bg-rose-100 hover:text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                {removing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    Eliminar ofertas
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {loading ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 flex items-center justify-center dark:border-slate-700">
          <LoaderSpinner text="Cargando ofertas..." />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay ofertas globales registradas.
        </div>
      ) : (
        <>
          {/* ── MOBILE cards ── */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {offers.map((offer) => {
              const estadoOferta = obtenerEstadoVigenciaOferta(offer)
              const selected = selectedIdSet.has(offer.idProductoVariante)
              const colorDotStyle = getColorIndicatorStyle(offer.colorHex)
              const precioVigente =
                typeof offer.precioVigente === "number"
                  ? offer.precioVigente
                  : typeof offer.precioOferta === "number"
                    ? offer.precioOferta
                    : offer.precio
              const hayDescuento = precioVigente < offer.precio

              return (
                <article
                  key={offer.idProductoVariante}
                  className={cn(
                    "rounded-2xl border bg-white px-4 py-3 shadow-sm dark:bg-neutral-950",
                    selected ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5" : "border-slate-200 dark:border-neutral-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!isRestrictedRole && (
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSelected(offer.idProductoVariante)}
                        className="mt-0.5 rounded-md"
                      />
                    )}
                    <OfertaRegistradaVariantPreview
                      imageUrl={offer.imageUrl}
                      productName={offer.productoNombre}
                      colorName={offer.colorNombre}
                      tallaName={offer.tallaNombre}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {offer.productoNombre}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                        {offer.sku || `Variante #${offer.idProductoVariante}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <OfferBadge className={cn("py-0.5 text-[10px]", getOfferStatusBadgeClassName(estadoOferta))}>
                        {getOfferStatusLabel(estadoOferta)}
                      </OfferBadge>
                      <OfferBadge className={cn("py-0.5 text-[10px]", getTipoOfertaBadgeClassName(offer.tipoOfertaAplicada))}>
                        {getTipoOfertaLabel(offer.tipoOfertaAplicada)}
                      </OfferBadge>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] text-slate-600 dark:border-neutral-800 dark:text-neutral-300">
                      <span className="h-2 w-2 rounded-full" style={colorDotStyle} />
                      {offer.colorNombre}
                    </span>
                    <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] text-slate-600 dark:border-neutral-800 dark:text-neutral-300">
                      {offer.tallaNombre}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-end justify-between border-t border-slate-100 pt-2.5 dark:border-neutral-800">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">Detalle oferta</p>
                      {(() => {
                        const countdown = obtenerCountdownOfertaResumido(offer)
                        if (!countdown) {
                          return <span className="text-xs text-slate-400 dark:text-neutral-500">-</span>
                        }
                        return (
                          <OfferBadge className={cn("py-0.5 text-[10px]", countdown.tipo === "vence" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300")}>
                            {countdown.texto}
                          </OfferBadge>
                        )
                      })()}
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">Precio actual</p>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {formatMonedaPen(precioVigente)}
                      </span>
                      {hayDescuento && (
                        <span className="text-xs font-medium text-slate-400 line-through dark:text-neutral-500">
                          {formatMonedaPen(offer.precio)}
                        </span>
                      )}
                    </div>
                  </div>
                  {offer.usuarioCreacionNombre && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-neutral-800">
                      <UserCircleIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                      <p className="truncate text-[11px] text-slate-500 dark:text-neutral-400">
                        {offer.usuarioCreacionNombre}
                      </p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {/* ── DESKTOP table ── */}
          <Card className="hidden overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm sm:block dark:border-neutral-800 dark:bg-neutral-950">
            <div className="overflow-x-auto">
              <table className="min-w-[1260px] w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-50/80 dark:bg-neutral-900/70">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-400">
                    {!isRestrictedRole && <th className="w-14 border-b border-slate-200 px-4 py-3 dark:border-neutral-800" />}
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Variante</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Color / Talla</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Tipo oferta</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">Precio actual</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Detalle oferta</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Creador</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => {
                    const estadoOferta = obtenerEstadoVigenciaOferta(offer)
                    const selected = selectedIdSet.has(offer.idProductoVariante)
                    const colorDotStyle = getColorIndicatorStyle(offer.colorHex)
                    const precioVigente =
                      typeof offer.precioVigente === "number"
                        ? offer.precioVigente
                        : typeof offer.precioOferta === "number"
                          ? offer.precioOferta
                          : offer.precio
                    const hayDescuento = precioVigente < offer.precio

                    return (
                      <tr
                        key={offer.idProductoVariante}
                        role={isRestrictedRole ? undefined : "button"}
                        tabIndex={isRestrictedRole ? undefined : 0}
                        aria-pressed={isRestrictedRole ? undefined : selected}
                        aria-label={
                          isRestrictedRole
                            ? undefined
                            : `Seleccionar ${offer.sku || offer.productoNombre}`
                        }
                        onClick={
                          isRestrictedRole
                            ? undefined
                            : () => toggleSelected(offer.idProductoVariante)
                        }
                        onKeyDown={(event) => {
                          if (isRestrictedRole) return
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            toggleSelected(offer.idProductoVariante)
                          }
                        }}
                        className={cn(
                          "transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 dark:hover:bg-neutral-900/60 dark:focus-visible:ring-amber-500/20",
                          !isRestrictedRole && "cursor-pointer",
                          selected ? "bg-amber-50/70 dark:bg-amber-500/5" : "bg-transparent"
                        )}
                      >
                        {!isRestrictedRole && (
                          <td className="border-b border-slate-200 px-4 py-3 align-top dark:border-neutral-800">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleSelected(offer.idProductoVariante)}
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                              aria-label={`Seleccionar ${offer.sku || offer.idProductoVariante}`}
                              className="mt-1 rounded-md"
                            />
                          </td>
                        )}
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
                              <span className="h-2.5 w-2.5 rounded-full" style={colorDotStyle} />
                              {offer.colorNombre}
                            </span>
                            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                              {offer.tallaNombre}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <OfferBadge className={getTipoOfertaBadgeClassName(offer.tipoOfertaAplicada)}>
                            {getTipoOfertaLabel(offer.tipoOfertaAplicada)}
                          </OfferBadge>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-bold text-slate-900 dark:text-white">{formatMonedaPen(precioVigente)}</span>
                            {hayDescuento && (
                              <span className="text-xs font-medium text-slate-400 line-through dark:text-neutral-500">{formatMonedaPen(offer.precio)}</span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <div className="space-y-0.5">
                            {(() => {
                              const countdown = obtenerCountdownOfertaResumido(offer)
                              if (!countdown) {
                                return <span className="text-xs text-slate-400 dark:text-neutral-500">-</span>
                              }
                              return (
                                <OfferBadge className={cn("py-0.5 text-[10px]", countdown.tipo === "vence" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300")}>
                                  {countdown.texto}
                                </OfferBadge>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          {offer.usuarioCreacionNombre ? (
                            <div className="flex items-center gap-2">
                              <UserCircleIcon className="h-4 w-4 shrink-0 text-slate-400 dark:text-neutral-500" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-slate-700 dark:text-neutral-200">{offer.usuarioCreacionNombre}</p>
                                {offer.usuarioCreacionCorreo && (
                                  <p className="truncate text-[10px] text-slate-400 dark:text-neutral-500">{offer.usuarioCreacionCorreo}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <OfferBadge className={getOfferStatusBadgeClassName(estadoOferta)}>
                            {getOfferStatusLabel(estadoOferta)}
                          </OfferBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
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
