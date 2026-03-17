"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { Plus } from "lucide-react"

import { ColorCreateDialog } from "@/components/colores/modals/ColorCreateDialog"
import { ColoresPagination } from "@/components/colores/ColoresPagination"
import { AttributeSearchInput } from "@/components/producto-nuevo/AttributeSearchInput"
import { AttributeSelectedChip } from "@/components/producto-nuevo/AttributeSelectedChip"
import { Button } from "@/components/ui/button"
import type { Color, ColorCreateRequest } from "@/lib/types/color"
import { cn } from "@/lib/utils"

interface ProductoColorsCardProps {
  availableColors: Color[]
  selectedColors: Color[]
  selectedColorIds: number[]
  loadingColores: boolean
  errorColores: string | null
  searchColor: string
  onSearchColorChange: (value: string) => void
  colorTotalElements: number
  colorTotalPages: number
  colorPage: number
  onColorPageChange: Dispatch<SetStateAction<number>>
  onCreateColor: (payload: ColorCreateRequest) => Promise<boolean>
  onToggleColorSelection: (idColor: number) => void
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function ProductoColorsCard({
  availableColors,
  selectedColors,
  selectedColorIds,
  loadingColores,
  errorColores,
  searchColor,
  onSearchColorChange,
  colorTotalElements,
  colorTotalPages,
  colorPage,
  onColorPageChange,
  onCreateColor,
  onToggleColorSelection,
}: ProductoColorsCardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const trimmedSearchColor = searchColor.trim()

  const hasExactMatch = useMemo(() => {
    if (!trimmedSearchColor) return false

    const normalizedSearch = normalizeName(trimmedSearchColor)
    return [...availableColors, ...selectedColors].some(
      (color) => normalizeName(color.nombre) === normalizedSearch
    )
  }, [availableColors, selectedColors, trimmedSearchColor])

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <AttributeSearchInput
              placeholder="Buscar color..."
              value={searchColor}
              onChange={onSearchColorChange}
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
            Nuevo color
          </Button>
        </div>

        {trimmedSearchColor && !hasExactMatch ? (
          <p className="text-xs text-muted-foreground">
            No aparece &quot;{trimmedSearchColor}&quot;. Puedes crearlo sin salir del
            producto.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {selectedColors.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin colores seleccionados.</p>
          ) : (
            selectedColors.map((color) => (
              <AttributeSelectedChip
                key={`selected-color-${color.idColor}`}
                label={color.nombre}
                colorHex={normalizeHexColor(color.codigo)}
                onRemove={() => onToggleColorSelection(color.idColor)}
              />
            ))
          )}
        </div>

        <div className="h-px w-full bg-border" />
      </div>

      <div className="min-h-0 flex-1">
        {loadingColores ? (
          <p className="text-sm text-muted-foreground">Cargando colores...</p>
        ) : errorColores ? (
          <p className="text-sm text-red-500">{errorColores}</p>
        ) : availableColors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay colores disponibles.</p>
        ) : (
          <div className="h-full min-h-0 space-y-1 overflow-y-auto pr-1">
            {availableColors.map((color) => {
              const isSelected = selectedColorIds.includes(color.idColor)
              const colorHex = normalizeHexColor(color.codigo)
              return (
                <button
                  key={color.idColor}
                  type="button"
                  onClick={() => onToggleColorSelection(color.idColor)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary dark:bg-primary/15"
                      : "hover:bg-muted"
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className={cn("font-medium", isSelected && "text-primary")}>
                    {color.nombre}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ColoresPagination
        totalElements={colorTotalElements}
        totalPages={colorTotalPages}
        page={colorPage}
        onPageChange={onColorPageChange}
      />

      <ColorCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={onCreateColor}
        initialNombre={trimmedSearchColor}
      />
    </div>
  )
}
