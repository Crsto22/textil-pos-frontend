"use client"

import { type ReactNode, useState } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { obtenerCountdownOfertaResumido, obtenerEstadoVigenciaOferta } from "@/lib/oferta-utils"
import { useOfertasSucursal } from "@/lib/hooks/useOfertasSucursal"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { TipoOfertaAplicada } from "@/lib/types/oferta"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { roleIsRestrictedToSucursalOffer } from "@/lib/auth/roles"

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

function hasFiniteStock(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function getStockBadgeClassName(stock: number) {
  if (stock <= 0)
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
  if (stock <= 5)
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
  if (stock <= 15)
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
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

function VariantPreview({
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

interface OfertasSucursalSectionProps {
  refreshToken?: number
}

export function OfertasSucursalSection({ refreshToken = 0 }: OfertasSucursalSectionProps) {
  const { user } = useAuth()
  const isRestrictedRole = roleIsRestrictedToSucursalOffer(user?.rol)

  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [selectedSucursalName, setSelectedSucursalName] = useState<string>("")

  const effectiveSucursalId = isRestrictedRole ? (user?.idSucursal ?? null) : selectedSucursalId
  const effectiveSucursalName = isRestrictedRole ? (user?.nombreSucursal ?? "") : selectedSucursalName

  const {
    sucursalOptions,
    loadingSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(!isRestrictedRole)

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
  } = useOfertasSucursal(effectiveSucursalId, refreshToken)

  return (
    <div className="space-y-5">
      {/* Sucursal selector + toolbar */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 sm:max-w-xs w-full">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">
              <BuildingStorefrontIcon className="h-3.5 w-3.5" />
              Sucursal
            </label>
            {isRestrictedRole ? (
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 shadow-xs dark:border-violet-500/30 dark:bg-violet-500/10">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  <BuildingStorefrontIcon className="h-4 w-4 shrink-0" />
                </span>
                <span className="truncate text-sm font-semibold text-violet-700 dark:text-violet-300">
                  {effectiveSucursalName || "Tu sucursal"}
                </span>
              </div>
            ) : (
              <Combobox
                value={selectedSucursalId ? String(selectedSucursalId) : ""}
                options={sucursalOptions}
                searchValue={searchSucursal}
                onSearchValueChange={setSearchSucursal}
                onValueChange={(value) => {
                  const id = value ? Number(value) : null
                  setSelectedSucursalId(id)
                  const opt = sucursalOptions.find((o) => o.value === value)
                  setSelectedSucursalName(opt?.label ?? "")
                }}
                placeholder="Seleccionar sucursal"
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="No se encontraron sucursales"
                loading={loadingSucursales}
                loadingMessage="Cargando sucursales..."
                triggerClassName="min-h-11 rounded-xl border-slate-200 bg-white px-3 shadow-xs hover:border-violet-300 hover:bg-violet-50/60 data-[state=open]:border-violet-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10"
                contentClassName="rounded-xl border-slate-200 shadow-xl dark:border-neutral-800"
                searchInputClassName="rounded-lg"
              />
            )}
          </div>

          {effectiveSucursalId && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => void refresh()}
                disabled={loading || removing}
                aria-label="Actualizar"
                className="rounded-xl border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <ArrowPathIcon className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void removeSelectedOffers()}
                disabled={removing || selectedIds.length === 0}
                className="rounded-xl border-rose-100 bg-rose-50 px-4 font-semibold text-rose-600 shadow-xs hover:bg-rose-100 hover:text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                {removing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Quitando...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    Quitar override ({selectedIds.length})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {effectiveSucursalId && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
            <Checkbox
              checked={allCurrentPageSelected}
              onCheckedChange={() => toggleSelectAllCurrentPage()}
              disabled={offers.length === 0 || loading || removing}
              className="size-5 rounded-md border-slate-300"
              aria-label="Seleccionar todas"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedIds.length} seleccionada{selectedIds.length === 1 ? "" : "s"} ·{" "}
              {totalElements} oferta{totalElements === 1 ? "" : "s"} de{" "}
              <span className="font-semibold text-violet-700 dark:text-violet-300">
                {effectiveSucursalName}
              </span>
            </p>
          </div>
        )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {!effectiveSucursalId ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Selecciona una sucursal para ver sus ofertas especificas.
        </div>
      ) : loading ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 flex items-center justify-center dark:border-slate-700">
          <LoaderSpinner text="Cargando ofertas de sucursal..." />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Esta sucursal no tiene ofertas especificas configuradas. Usa &quot;Crear ofertas&quot; para agregar una.
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
                    selected ? "border-violet-300 bg-violet-50/60 dark:border-violet-500/40 dark:bg-violet-500/5" : "border-slate-200 dark:border-neutral-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleSelected(offer.idProductoVariante)}
                      className="mt-0.5 rounded-md"
                    />
                    <VariantPreview
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
                      {hasFiniteStock(offer.stock) && (
                        <OfferBadge className={cn("min-w-8 justify-center border py-0.5 text-[10px]", getStockBadgeClassName(offer.stock))}>
                          {offer.stock}
                        </OfferBadge>
                      )}
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
                      <p className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">Override sucursal</p>
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
                      <span className="text-base font-bold text-slate-900 dark:text-white">{formatMonedaPen(precioVigente)}</span>
                      {hayDescuento && (
                        <span className="text-xs font-medium text-slate-400 line-through dark:text-neutral-500">{formatMonedaPen(offer.precio)}</span>
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
              <table className="min-w-[1220px] w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-50/80 dark:bg-neutral-900/70">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-400">
                    <th className="w-14 border-b border-slate-200 px-4 py-3 dark:border-neutral-800" />
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Variante</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Color / Talla</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Tipo oferta</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">Precio actual</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Detalle override</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Creador</th>
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Stock</th>
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
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected}
                        aria-label={`Seleccionar ${offer.sku || offer.productoNombre}`}
                        onClick={() => toggleSelected(offer.idProductoVariante)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            toggleSelected(offer.idProductoVariante)
                          }
                        }}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 dark:hover:bg-neutral-900/60 dark:focus-visible:ring-violet-500/20",
                          selected ? "bg-violet-50/70 dark:bg-violet-500/5" : "bg-transparent"
                        )}
                      >
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
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <div className="flex items-center gap-3">
                            <VariantPreview imageUrl={offer.imageUrl} productName={offer.productoNombre} colorName={offer.colorNombre} tallaName={offer.tallaNombre} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-white">{offer.productoNombre}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">{offer.sku || `Variante #${offer.idProductoVariante}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                              <span className="h-2.5 w-2.5 rounded-full" style={colorDotStyle} />
                              {offer.colorNombre}
                            </span>
                            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">{offer.tallaNombre}</span>
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <OfferBadge className={getTipoOfertaBadgeClassName(offer.tipoOfertaAplicada)}>{getTipoOfertaLabel(offer.tipoOfertaAplicada)}</OfferBadge>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-bold text-slate-900 dark:text-white">{formatMonedaPen(precioVigente)}</span>
                            {hayDescuento && <span className="text-xs font-medium text-slate-400 line-through dark:text-neutral-500">{formatMonedaPen(offer.precio)}</span>}
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
                          {hasFiniteStock(offer.stock) ? (
                            <OfferBadge className={cn("min-w-10 justify-center border", getStockBadgeClassName(offer.stock))}>{offer.stock}</OfferBadge>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          <OfferBadge className={getOfferStatusBadgeClassName(estadoOferta)}>{getOfferStatusLabel(estadoOferta)}</OfferBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <ProductosPagination
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
            itemLabel="ofertas de sucursal"
          />
        </>
      )}
    </div>
  )
}
