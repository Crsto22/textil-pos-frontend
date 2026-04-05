"use client"

import { PencilSquareIcon, TagIcon } from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type {
  VentaLineaPrecioOption,
  VentaLineaPrecioTipo,
} from "@/lib/types/venta-price"

interface PriceSelectorDropdownProps {
  options: VentaLineaPrecioOption[]
  selectedType?: VentaLineaPrecioTipo | null
  onSelect: (priceType: VentaLineaPrecioTipo) => void
  onEditPrice?: () => void
  triggerLabel?: string
  align?: "start" | "center" | "end"
}

function getOptionAccentClass(type: VentaLineaPrecioTipo) {
  switch (type) {
    case "oferta":
      return "bg-emerald-500"
    case "mayor":
      return "bg-amber-500"
    default:
      return "bg-slate-400"
  }
}

export function PriceSelectorDropdown({
  options,
  selectedType,
  onSelect,
  onEditPrice,
  triggerLabel = "Cambiar precio",
  align = "end",
}: PriceSelectorDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          title={triggerLabel}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        >
          <TagIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="w-[260px] rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        <DropdownMenuLabel className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Opciones de precio
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0 my-1 bg-slate-200 dark:bg-slate-700" />
        {options.length > 0 && (
          <DropdownMenuRadioGroup
            value={selectedType ?? options[0]?.type}
            onValueChange={(value) => onSelect(value as VentaLineaPrecioTipo)}
          >
            {options.map((option) => {
              const active = option.type === selectedType

              return (
                <DropdownMenuRadioItem
                  key={option.type}
                  value={option.type}
                  className={cn(
                    "mb-1 items-start rounded-xl px-3 py-2.5 pl-8 last:mb-0",
                    active && "bg-slate-50 dark:bg-slate-800/80"
                  )}
                >
                  <div className="flex w-full min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-2.5 w-2.5 rounded-full",
                          getOptionAccentClass(option.type)
                        )}
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {option.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatMonedaPen(option.precio)}
                    </span>
                    {option.description ? (
                      <span className="text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        )}
        {onEditPrice && (
          <>
            {options.length > 0 && (
              <DropdownMenuSeparator className="mx-0 my-1 bg-slate-200 dark:bg-slate-700" />
            )}
            <button
              type="button"
              onClick={onEditPrice}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-blue-400"
            >
              <PencilSquareIcon className="h-4 w-4 shrink-0" />
              Editar precio manualmente
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
