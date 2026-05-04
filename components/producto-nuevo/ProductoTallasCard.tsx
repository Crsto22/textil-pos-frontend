"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { Plus } from "lucide-react"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import { AttributeSearchInput } from "@/components/producto-nuevo/AttributeSearchInput"
import { AttributeSelectedChip } from "@/components/producto-nuevo/AttributeSelectedChip"
import { TallaCreateDialog } from "@/components/tallas/modals/TallaCreateDialog"
import { TallasPagination } from "@/components/tallas/TallasPagination"
import { Button } from "@/components/ui/button"
import type { Talla, TallaCreateRequest } from "@/lib/types/talla"
import { cn } from "@/lib/utils"

interface ProductoTallasCardProps {
  availableTallas: Talla[]
  selectedTallas: Talla[]
  selectedTallaIds: number[]
  loadingTallas: boolean
  errorTallas: string | null
  searchTalla: string
  onSearchTallaChange: (value: string) => void
  tallaTotalElements: number
  tallaTotalPages: number
  tallaPage: number
  onTallaPageChange: Dispatch<SetStateAction<number>>
  onCreateTalla: (payload: TallaCreateRequest) => Promise<boolean>
  onToggleTallaSelection: (idTalla: number) => void
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function ProductoTallasCard({
  availableTallas,
  selectedTallas,
  selectedTallaIds,
  loadingTallas,
  errorTallas,
  searchTalla,
  onSearchTallaChange,
  tallaTotalElements,
  tallaTotalPages,
  tallaPage,
  onTallaPageChange,
  onCreateTalla,
  onToggleTallaSelection,
}: ProductoTallasCardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const trimmedSearchTalla = searchTalla.trim()

  const hasExactMatch = useMemo(() => {
    if (!trimmedSearchTalla) return false

    const normalizedSearch = normalizeName(trimmedSearchTalla)
    return [...availableTallas, ...selectedTallas].some(
      (talla) => normalizeName(talla.nombre) === normalizedSearch
    )
  }, [availableTallas, selectedTallas, trimmedSearchTalla])

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <AttributeSearchInput
              placeholder="Buscar talla..."
              value={searchTalla}
              onChange={onSearchTallaChange}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nueva talla
          </Button>
        </div>

        {trimmedSearchTalla && !hasExactMatch ? (
          <p className="text-xs text-muted-foreground">
            No aparece &quot;{trimmedSearchTalla}&quot;. Puedes crearla sin salir del
            producto.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {selectedTallas.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin tallas seleccionadas.</p>
          ) : (
            selectedTallas.map((talla) => (
              <AttributeSelectedChip
                key={`selected-talla-${talla.idTalla}`}
                label={talla.nombre}
                onRemove={() => onToggleTallaSelection(talla.idTalla)}
              />
            ))
          )}
        </div>

        <div className="h-px w-full bg-border" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loadingTallas ? (
          <LoaderSpinner size="sm" text="Cargando tallas..." />
        ) : errorTallas ? (
          <p className="text-sm text-red-500">{errorTallas}</p>
        ) : availableTallas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tallas disponibles.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTallas.map((talla) => {
              const isSelected = selectedTallaIds.includes(talla.idTalla)
              return (
                <button
                  key={talla.idTalla}
                  type="button"
                  onClick={() => onToggleTallaSelection(talla.idTalla)}
                  className={cn(
                    "min-w-11 rounded-2xl border px-3 py-2 text-sm transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/10 font-semibold text-primary dark:bg-primary/15"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                  aria-pressed={isSelected}
                >
                  {talla.nombre}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <TallasPagination
        totalElements={tallaTotalElements}
        totalPages={tallaTotalPages}
        page={tallaPage}
        onPageChange={onTallaPageChange}
      />

      <TallaCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={onCreateTalla}
        initialNombre={trimmedSearchTalla}
      />
    </div>
  )
}
