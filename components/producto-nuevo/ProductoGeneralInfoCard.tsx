"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ProductoLabelPreview } from "@/components/producto-nuevo/ProductoLabelPreview"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Color } from "@/lib/types/color"
import type { Talla } from "@/lib/types/talla"
import type { ProductoCreateFormState } from "@/lib/types/producto-create"

interface ProductoGeneralInfoCardProps {
  isAdmin: boolean
  hasSucursal: boolean
  nombreSucursal?: string
  form: ProductoCreateFormState
  sucursalOptions: ComboboxOption[]
  categoriaOptions: ComboboxOption[]
  searchSucursal: string
  searchCategoria: string
  loadingSucursales: boolean
  errorSucursales: string | null
  loadingCategorias: boolean
  errorCategorias: string | null
  selectedCategoriaName?: string
  selectedColorsCount: number
  selectedTallasCount: number
  variantRowsCount: number
  totalSelectedMedia: number
  selectedColors: Color[]
  selectedTallas: Talla[]
  activePreviewColorId: number | null
  activePreviewImageUrl: string | null
  onOpenImages: () => void
  onOpenColors: () => void
  onOpenTallas: () => void
  onPreviewColorChange: (idColor: number) => void
  onSucursalChange: (value: string) => void
  onCategoriaChange: (value: string) => void
  onOpenCategoriaCreate: () => void
  onSearchSucursalChange: (value: string) => void
  onSearchCategoriaChange: (value: string) => void
  onNombreChange: (value: string) => void
  onDescripcionChange: (value: string) => void
  canCreateCategoria: boolean
  categoriaCreateDisabledReason?: string | null
}

function hasValidId(value: number | null | undefined): value is number {
  return typeof value === "number" && value > 0
}

export function ProductoGeneralInfoCard({
  isAdmin,
  hasSucursal,
  nombreSucursal,
  form,
  sucursalOptions,
  categoriaOptions,
  searchSucursal,
  searchCategoria,
  loadingSucursales,
  errorSucursales,
  loadingCategorias,
  errorCategorias,
  selectedCategoriaName,
  selectedColorsCount,
  selectedTallasCount,
  variantRowsCount,
  totalSelectedMedia,
  selectedColors,
  selectedTallas,
  activePreviewColorId,
  activePreviewImageUrl,
  onOpenImages,
  onOpenColors,
  onOpenTallas,
  onPreviewColorChange,
  onSucursalChange,
  onCategoriaChange,
  onOpenCategoriaCreate,
  onSearchSucursalChange,
  onSearchCategoriaChange,
  onNombreChange,
  onDescripcionChange,
  canCreateCategoria,
  categoriaCreateDisabledReason,
}: ProductoGeneralInfoCardProps) {
  const trimmedSearchCategoria = searchCategoria.trim()
  const categoriaCreateActionLabel = !canCreateCategoria
    ? (categoriaCreateDisabledReason ?? "Selecciona una sucursal primero")
    : trimmedSearchCategoria
      ? `Crear categoria "${trimmedSearchCategoria}"`
      : "Nueva categoria"

  return (
    <Card className="gap-0 rounded-[28px] border-0 bg-muted/30 py-0 shadow-none dark:bg-muted/10">
      <CardContent className="space-y-6 px-5 py-5">
        <ProductoLabelPreview
          productName={form.nombre}
          selectedColors={selectedColors}
          selectedTallas={selectedTallas}
          activeColorId={activePreviewColorId}
          previewImageUrl={activePreviewImageUrl}
          hasSucursal={hasSucursal}
          onOpenImages={onOpenImages}
          onOpenColors={onOpenColors}
          onOpenTallas={onOpenTallas}
          onActiveColorChange={onPreviewColorChange}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="producto-create-page-sucursal"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Sucursal *
            </Label>
            {isAdmin ? (
              <Combobox
                id="producto-create-page-sucursal"
                value={hasValidId(form.idSucursal) ? String(form.idSucursal) : ""}
                options={sucursalOptions}
                searchValue={searchSucursal}
                onSearchValueChange={onSearchSucursalChange}
                onValueChange={onSucursalChange}
                placeholder="Selecciona sucursal"
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="No se encontraron sucursales"
                loading={loadingSucursales}
                loadingMessage="Buscando sucursales..."
              />
            ) : (
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">
                {nombreSucursal || "Sin sucursal asignada"}
              </div>
            )}
            {errorSucursales && isAdmin && (
              <p className="text-xs text-red-500">{errorSucursales}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="producto-create-page-categoria"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Categoria *
            </Label>
            <Combobox
              id="producto-create-page-categoria"
              value={hasValidId(form.idCategoria) ? String(form.idCategoria) : ""}
              options={categoriaOptions}
              searchValue={searchCategoria}
              onSearchValueChange={onSearchCategoriaChange}
              onValueChange={onCategoriaChange}
              placeholder={isAdmin && !hasSucursal ? "Selecciona una sucursal primero" : "Selecciona categoria"}
              searchPlaceholder="Buscar categoria..."
              emptyMessage="No se encontraron categorias"
              loading={loadingCategorias}
              loadingMessage="Buscando categorias..."
              disabled={isAdmin && !hasSucursal}
              onCreateAction={() => onOpenCategoriaCreate()}
              createActionLabel={categoriaCreateActionLabel}
              createActionDisabled={!canCreateCategoria}
            />
            {errorCategorias && <p className="text-xs text-red-500">{errorCategorias}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="producto-create-page-nombre"
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Nombre del producto *
          </Label>
          <Input
            id="producto-create-page-nombre"
            placeholder="Ej. Polo Algodon Pima"
            value={form.nombre}
            onChange={(event) => onNombreChange(event.target.value)}
            className="h-12 rounded-2xl shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="producto-create-page-descripcion"
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Descripcion
          </Label>
          <Textarea
            id="producto-create-page-descripcion"
            rows={4}
            placeholder="Pima 100%..."
            value={form.descripcion}
            onChange={(event) => onDescripcionChange(event.target.value)}
            className="min-h-[116px] resize-none rounded-2xl shadow-none"
          />
        </div>

        <div className="rounded-2xl bg-background/80 p-4">
          <p className="text-[11px] italic leading-5 text-muted-foreground">
            El SKU y precios se gestionan por variante en la matriz central.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {selectedCategoriaName || "Sin categoria"} | {selectedColorsCount} colores |{" "}
            {selectedTallasCount} tallas | {variantRowsCount} variantes | {totalSelectedMedia} imagenes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
