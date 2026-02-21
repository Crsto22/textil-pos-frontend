"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ProductoLabelPreview } from "@/components/producto-nuevo/ProductoLabelPreview"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Color } from "@/lib/types/color"
import type { ProductoCreateFormState } from "@/lib/types/producto-create"

interface ProductoGeneralInfoCardProps {
  isAdmin: boolean
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
  activePreviewColorId: number | null
  activePreviewImageUrl: string | null
  onOpenImages: () => void
  onPreviewColorChange: (idColor: number) => void
  onSucursalChange: (value: string) => void
  onCategoriaChange: (value: string) => void
  onSearchSucursalChange: (value: string) => void
  onSearchCategoriaChange: (value: string) => void
  onNombreChange: (value: string) => void
  onSkuChange: (value: string) => void
  onCodigoExternoChange: (value: string) => void
  onDescripcionChange: (value: string) => void
}

function hasValidId(value: number | null | undefined): value is number {
  return typeof value === "number" && value > 0
}

export function ProductoGeneralInfoCard({
  isAdmin,
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
  activePreviewColorId,
  activePreviewImageUrl,
  onOpenImages,
  onPreviewColorChange,
  onSucursalChange,
  onCategoriaChange,
  onSearchSucursalChange,
  onSearchCategoriaChange,
  onNombreChange,
  onSkuChange,
  onCodigoExternoChange,
  onDescripcionChange,
}: ProductoGeneralInfoCardProps) {
  return (
    <Card className="gap-0">
      <CardContent className="space-y-5 pt-6">
        <ProductoLabelPreview
          productName={form.nombre}
          selectedColors={selectedColors}
          activeColorId={activePreviewColorId}
          previewImageUrl={activePreviewImageUrl}
          onOpenImages={onOpenImages}
          onActiveColorChange={onPreviewColorChange}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="producto-create-page-sucursal">Sucursal *</Label>
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
            <Label htmlFor="producto-create-page-categoria">Categoria *</Label>
            <Combobox
              id="producto-create-page-categoria"
              value={hasValidId(form.idCategoria) ? String(form.idCategoria) : ""}
              options={categoriaOptions}
              searchValue={searchCategoria}
              onSearchValueChange={onSearchCategoriaChange}
              onValueChange={onCategoriaChange}
              placeholder="Selecciona categoria"
              searchPlaceholder="Buscar categoria..."
              emptyMessage="No se encontraron categorias"
              loading={loadingCategorias}
              loadingMessage="Buscando categorias..."
            />
            {errorCategorias && <p className="text-xs text-red-500">{errorCategorias}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="producto-create-page-nombre">Nombre del Producto *</Label>
          <Input
            id="producto-create-page-nombre"
            placeholder="Ej. Polo Algodon Pima"
            value={form.nombre}
            onChange={(event) => onNombreChange(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="producto-create-page-sku">SKU *</Label>
            <Input
              id="producto-create-page-sku"
              placeholder="SKU-001"
              value={form.sku}
              onChange={(event) => onSkuChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="producto-create-page-codigo-externo">Codigo Externo</Label>
            <Input
              id="producto-create-page-codigo-externo"
              placeholder="EXT-123"
              value={form.codigoExterno}
              onChange={(event) => onCodigoExternoChange(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="producto-create-page-descripcion">Descripcion</Label>
          <Textarea
            id="producto-create-page-descripcion"
            rows={3}
            placeholder="Pima 100%"
            value={form.descripcion}
            onChange={(event) => onDescripcionChange(event.target.value)}
            className="resize-none"
          />
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          Vista previa: {selectedCategoriaName || "Sin categoria seleccionada"} |{" "}
          {selectedColorsCount} colores | {selectedTallasCount} tallas | {variantRowsCount}{" "}
          variantes | {totalSelectedMedia} imagenes
        </div>
      </CardContent>
    </Card>
  )
}
