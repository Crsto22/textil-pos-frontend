"use client"

import type { Dispatch, SetStateAction } from "react"

import { AttributeSearchInput } from "@/components/producto-nuevo/AttributeSearchInput"
import { AttributeSelectedChip } from "@/components/producto-nuevo/AttributeSelectedChip"
import { TallasPagination } from "@/components/tallas/TallasPagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Talla } from "@/lib/types/talla"
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
  onToggleTallaSelection: (idTalla: number) => void
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
  onToggleTallaSelection,
}: ProductoTallasCardProps) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Tallas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        <AttributeSearchInput
          placeholder="Buscar talla..."
          value={searchTalla}
          onChange={onSearchTallaChange}
        />

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

        {loadingTallas ? (
          <p className="text-sm text-muted-foreground">Cargando tallas...</p>
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
                      ? "border-blue-600 bg-[#E9E6F7] font-semibold text-[#4338CA]"
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

        <TallasPagination
          totalElements={tallaTotalElements}
          totalPages={tallaTotalPages}
          page={tallaPage}
          onPageChange={onTallaPageChange}
        />
      </CardContent>
    </Card>
  )
}
