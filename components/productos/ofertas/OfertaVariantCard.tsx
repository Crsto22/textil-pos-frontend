"use client"

import { useState } from "react"

import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  CubeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface OfertaVariantCardBadge {
  label: string
  className: string
}

interface OfertaVariantCardProps {
  productoNombre: string
  colorNombre: string
  tallaNombre: string
  sku: string
  precio: number
  precioOferta: number | null
  vigenciaLabel: string
  imageUrl?: string | null
  locationLabel?: string | null
  startLabel?: string | null
  endLabel?: string | null
  primaryBadge?: OfertaVariantCardBadge
  selected?: boolean
  onSelect?: () => void
}

export function OfertaVariantCard({
  productoNombre,
  colorNombre,
  tallaNombre,
  sku,
  precio,
  precioOferta,
  vigenciaLabel,
  imageUrl = null,
  locationLabel = null,
  startLabel = null,
  endLabel = null,
  primaryBadge,
  selected = false,
  onSelect,
}: OfertaVariantCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const hasOfferPrice = typeof precioOferta === "number" && precioOferta > 0
  const discountPercent =
    hasOfferPrice && precio > 0
      ? Math.max(0, Math.round(((precio - precioOferta) / precio) * 100))
      : null
  const resolvedImageUrl = imageUrl ?? undefined
  const shouldRenderImage =
    typeof resolvedImageUrl === "string" && resolvedImageUrl !== failedImageUrl

  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={onSelect ? `Seleccionar oferta de ${productoNombre}` : undefined}
      className={cn(
        "flex h-full w-full flex-col rounded-[24px] border bg-white p-5 text-left shadow-[0_16px_34px_-28px_rgba(15,23,42,0.28)] dark:bg-neutral-950",
        onSelect ? "cursor-pointer outline-none" : "cursor-default",
        selected
          ? "border-amber-400 bg-amber-50/40 shadow-[0_0_0_1px_rgba(245,158,11,0.14),0_24px_46px_-34px_rgba(245,158,11,0.24)] dark:border-amber-500/40 dark:bg-amber-500/8"
          : "border-slate-200 dark:border-neutral-800",
        onSelect &&
          "focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-200 dark:focus-visible:ring-amber-500/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-h-8 items-center">
          {primaryBadge ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
                primaryBadge.className
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {primaryBadge.label}
            </span>
          ) : (
            <span />
          )}
        </div>

        {onSelect ? (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Seleccionar oferta de ${productoNombre}`}
            className="mt-0.5 size-5 rounded-md border-slate-300 data-[state=checked]:border-amber-500"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center text-slate-300 dark:text-neutral-600">
            <CheckIcon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-white text-slate-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
          {shouldRenderImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedImageUrl}
              alt={`${productoNombre} - ${colorNombre} - Talla ${tallaNombre}`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setFailedImageUrl(resolvedImageUrl)}
            />
          ) : (
            <CubeIcon className="h-8 w-8" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-lg font-black leading-tight text-slate-950 dark:text-neutral-50 sm:text-xl">
            {productoNombre}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-neutral-500 sm:text-sm">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationLabel || "Sin sucursal"}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-neutral-900 dark:text-neutral-200">
              SKU {sku || "Sin SKU"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-neutral-900 dark:text-neutral-200">
              Talla {tallaNombre}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-neutral-900 dark:text-neutral-200">
              {colorNombre}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">
          Precio de venta
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-lg font-semibold leading-none text-slate-950 dark:text-neutral-50 sm:text-xl">
                {hasOfferPrice ? formatMonedaPen(precioOferta) : formatMonedaPen(precio)}
              </span>
              {hasOfferPrice && (
                <span className="pb-0.5 text-xs font-semibold text-slate-300 line-through dark:text-neutral-600 sm:text-sm">
                  {formatMonedaPen(precio)}
                </span>
              )}
            </div>
          </div>

          {discountPercent !== null && discountPercent > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-black text-white shadow-[0_10px_18px_-14px_rgba(16,185,129,0.9)] sm:text-sm">
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
              -{discountPercent}%
            </span>
          )}
        </div>
      </div>

      {startLabel && endLabel ? (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] items-center gap-2 text-[11px] font-bold sm:text-xs">
          <div className="flex min-w-0 items-center gap-2 text-slate-400 dark:text-neutral-500">
            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{startLabel}</span>
          </div>

          <div className="h-px w-full bg-slate-200 dark:bg-neutral-800" />

          <div className="flex min-w-0 items-center justify-end gap-2 text-amber-600 dark:text-amber-300">
            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{endLabel}</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-neutral-900 dark:text-neutral-300">
          {vigenciaLabel}
        </div>
      )}
    </article>
  )
}
