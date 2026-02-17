import { memo } from "react"
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline"

import { SucursalesCardsSkeleton } from "@/components/sucursales/SucursalesCardsSkeleton"
import { cn } from "@/lib/utils"
import type { Sucursal } from "@/lib/types/sucursal"

interface SucursalesCardsProps {
  sucursales: Sucursal[]
  loading: boolean
  onEditSucursal: (sucursal: Sucursal) => void
  onDeleteSucursal: (sucursal: Sucursal) => void
}

/* ─── Status & accent color mapping ─── */

interface CardTheme {
  headerBg: string
  iconBorder: string
  iconText: string
  statusBadge: string
  statusText: string
}

const themes: Record<string, CardTheme> = {
  ACTIVO: {
    headerBg: "bg-blue-50 dark:bg-blue-950/30",
    iconBorder: "border-blue-400 dark:border-blue-500",
    iconText: "text-blue-500 dark:text-blue-400",
    statusBadge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    statusText: "Operativa",
  },
  INACTIVO: {
    headerBg: "bg-rose-50 dark:bg-rose-950/30",
    iconBorder: "border-rose-400 dark:border-rose-500",
    iconText: "text-rose-500 dark:text-rose-400",
    statusBadge:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    statusText: "Cerrada",
  },
}

function getTheme(status: string): CardTheme {
  return (
    themes[status] ?? {
      headerBg: "bg-gray-50 dark:bg-gray-900/30",
      iconBorder: "border-gray-400",
      iconText: "text-gray-500 dark:text-gray-400",
      statusBadge:
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      statusText: status,
    }
  )
}

/* ─── Avatar colors for staff ─── */

const avatarColors = [
  "bg-blue-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
]

function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length]
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/* ─── Main component ─── */

function SucursalesCardsComponent({
  sucursales,
  loading,
  onEditSucursal,
  onDeleteSucursal,
}: SucursalesCardsProps) {
  if (loading) {
    return <SucursalesCardsSkeleton />
  }

  if (sucursales.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
        No se encontraron sucursales
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sucursales.map((sucursal) => {
        const theme = getTheme(sucursal.estado)
        const usuarios = Array.isArray(sucursal.usuarios)
          ? sucursal.usuarios
          : []
        const usuariosTotal = Number.isFinite(sucursal.usuariosTotal)
          ? sucursal.usuariosTotal
          : usuarios.length


        return (
          <article
            key={sucursal.idSucursal}
            className="relative overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            {/* ─── Header with colored background ─── */}
            <div
              className={cn(
                "px-5 pt-5 pb-4",
                theme.headerBg
              )}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Icon + Title */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-card",
                      theme.iconBorder
                    )}
                  >
                    <BuildingOffice2Icon
                      className={cn("h-5 w-5", theme.iconText)}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold leading-snug text-foreground">
                      {sucursal.nombre}
                    </h3>
                    {/* Tags */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {sucursal.nombreEmpresa}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          theme.statusBadge
                        )}
                      >
                        {theme.statusText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onEditSucursal(sucursal)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-white/60 dark:hover:bg-blue-500/10"
                    aria-label={`Editar ${sucursal.nombre}`}
                    title="Editar sucursal"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSucursal(sucursal)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-white/60 dark:hover:bg-red-500/10"
                    aria-label={`Eliminar ${sucursal.nombre}`}
                    title="Eliminar sucursal"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Info rows ─── */}
            <div className="space-y-2 px-5 pt-4">
              <p className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span className="line-clamp-2 leading-snug">
                  {sucursal.direccion || "Sin dirección"}
                </span>
              </p>
              <p className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <PhoneIcon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span className="truncate">
                  {sucursal.telefono || "Sin teléfono"}
                </span>
              </p>
            </div>

            {/* ─── Staff section ─── */}
            <div className="px-5 pt-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <UserGroupIcon className="h-3.5 w-3.5" />
                  Staff
                </p>
                <div className="flex -space-x-2">
                  {usuarios.slice(0, 4).map((usuario, idx) => (
                    <span
                      key={`${sucursal.idSucursal}-${usuario}`}
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-white shadow-sm",
                        getAvatarColor(idx)
                      )}
                      title={usuario}
                    >
                      {getInitials(usuario)}
                    </span>
                  ))}
                  {usuariosTotal > 4 && (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-slate-200 text-[10px] font-bold text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                      +{usuariosTotal - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>



            {/* ─── Bottom spacing ─── */}
            <div className="h-5" />
          </article>
        )
      })}
    </div>
  )
}

export const SucursalesCards = memo(SucursalesCardsComponent)
