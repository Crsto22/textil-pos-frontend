"use client"

import { useState } from "react"
import {
  BuildingOffice2Icon,
  CheckIcon,
  ChevronUpDownIcon,
  MapPinIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCanFilterBySucursal } from "@/lib/hooks/useCanFilterByUsuario"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import { cn } from "@/lib/utils"

export function SucursalGlobalSelector() {
  const canFilter = useCanFilterBySucursal()
  const { sucursalGlobal, setSucursalGlobal } = useSucursalGlobal()
  const { sucursalOptions, loadingSucursales } = useSucursalOptions(canFilter)
  const [open, setOpen] = useState(false)

  if (!canFilter) return null

  const selectedValue = sucursalGlobal ? String(sucursalGlobal.idSucursal) : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Sucursal predeterminada global"
          className={cn(
            "hidden h-9 items-center gap-2 rounded-full border px-2.5 text-[12px] font-medium outline-none transition-all sm:flex",
            "ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            sucursalGlobal
              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              : "border-slate-200 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
          )}
        >
          {sucursalGlobal ? (
            <>
              {/* Avatar con inicial */}
              {sucursalOptions.find((o) => o.value === selectedValue)?.avatarText ? (
                <span
                  className={cn(
                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold uppercase",
                    sucursalOptions.find((o) => o.value === selectedValue)?.avatarClassName ??
                      "bg-blue-100 text-blue-600 dark:bg-blue-500/20"
                  )}
                >
                  {sucursalOptions.find((o) => o.value === selectedValue)?.avatarText}
                </span>
              ) : (
                <BuildingOffice2Icon className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="max-w-[110px] truncate">{sucursalGlobal.nombre}</span>
            </>
          ) : (
            <>
              <Squares2X2Icon className="h-3.5 w-3.5 shrink-0" />
              <span>Todas</span>
            </>
          )}
          <ChevronUpDownIcon className="h-3 w-3 shrink-0 opacity-40" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 overflow-hidden p-0 shadow-lg">
        {/* Cabecera */}


        {/* Lista */}
        <div className="max-h-[260px] overflow-y-auto py-1">
          {/* Opción "Todas" */}
          <button
              type="button"
              onClick={() => {
                setSucursalGlobal(null)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                !sucursalGlobal && "bg-blue-50/60 dark:bg-blue-500/10"
              )}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                <Squares2X2Icon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                  Todas las sucursales
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Sin sucursal predeterminada
                </p>
              </div>
              <CheckIcon
                className={cn(
                  "h-4 w-4 shrink-0 text-blue-600",
                  !sucursalGlobal ? "opacity-100" : "opacity-0"
                )}
              />
          </button>

          {/* Sucursales */}
          {loadingSucursales ? (
            <div className="space-y-1 px-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : sucursalOptions.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">Sin sucursales disponibles</p>
            </div>
          ) : (
            sucursalOptions.map((option) => {
              const isSelected = option.value === selectedValue
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSucursalGlobal({
                      idSucursal: Number(option.value),
                      nombre: option.label,
                    })
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                    isSelected && "bg-blue-50/60 dark:bg-blue-500/10"
                  )}
                >
                  {option.avatarText ? (
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                        option.avatarClassName ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {option.avatarText}
                    </span>
                  ) : (
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                      <BuildingOffice2Icon className="h-4 w-4 text-slate-400" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <MapPinIcon className="h-2.5 w-2.5 shrink-0" />
                        {option.description}
                      </p>
                    )}
                  </div>
                  <CheckIcon
                    className={cn(
                      "h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              )
            })
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center gap-2 border-t bg-slate-50/80 px-4 py-2.5 dark:bg-white/[0.02]">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              sucursalGlobal ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
            )}
          />
          <p className="text-[11px] text-muted-foreground">
            {sucursalGlobal
              ? `Filtrando por: ${sucursalGlobal.nombre}`
              : "Mostrando todas las sucursales"}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
