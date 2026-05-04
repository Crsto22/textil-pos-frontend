import { memo } from "react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type EstadoFilter = "TODOS" | "ACTIVO" | "INACTIVO"

interface ComprobantesFiltersProps {
  activoFilter: EstadoFilter
  onActivoFilterChange: (value: EstadoFilter) => void
}

const ESTADO_OPTIONS: { value: EstadoFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "INACTIVO", label: "Inactivos" },
]

function ComprobantesFiltersComponent({
  activoFilter,
  onActivoFilterChange,
}: ComprobantesFiltersProps) {
  return (
    <>
      {/* ─── MOBILE: chips horizontales ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 md:hidden">
        {ESTADO_OPTIONS.map((opt) => {
          const active = activoFilter === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onActivoFilterChange(opt.value)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-xl border px-3.5 text-xs font-semibold transition-all",
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/70 dark:bg-blue-500/10 dark:text-blue-200"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* ─── DESKTOP: card con Select ─── */}
      <div className="hidden rounded-xl border bg-card p-4 md:grid md:grid-cols-2 md:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="comprobantes-filter-activo">Estado</Label>
          <Select
            value={activoFilter}
            onValueChange={(value) => onActivoFilterChange(value as EstadoFilter)}
          >
            <SelectTrigger id="comprobantes-filter-activo" className="w-full">
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="ACTIVO">Activos</SelectItem>
              <SelectItem value="INACTIVO">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}

export const ComprobantesFilters = memo(ComprobantesFiltersComponent)
