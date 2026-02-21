"use client"

import type { Dispatch, SetStateAction } from "react"

import { ColoresPagination } from "@/components/colores/ColoresPagination"
import { AttributeSearchInput } from "@/components/producto-nuevo/AttributeSearchInput"
import { AttributeSelectedChip } from "@/components/producto-nuevo/AttributeSelectedChip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Color } from "@/lib/types/color"
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
  onToggleColorSelection: (idColor: number) => void
}

function normalizeHexColor(code: string): string {
  const trimmed = code.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
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
  onToggleColorSelection,
}: ProductoColorsCardProps) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Colores</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        <AttributeSearchInput
          placeholder="Buscar color..."
          value={searchColor}
          onChange={onSearchColorChange}
        />

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

        {loadingColores ? (
          <p className="text-sm text-muted-foreground">Cargando colores...</p>
        ) : errorColores ? (
          <p className="text-sm text-red-500">{errorColores}</p>
        ) : availableColors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay colores disponibles.</p>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
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
                    isSelected ? "bg-[#E9E6F7] text-[#4338CA]" : "hover:bg-muted"
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className={cn("font-medium", isSelected && "text-[#4338CA]")}>
                    {color.nombre}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <ColoresPagination
          totalElements={colorTotalElements}
          totalPages={colorTotalPages}
          page={colorPage}
          onPageChange={onColorPageChange}
        />
      </CardContent>
    </Card>
  )
}
