import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import type { VarianteUpdateRequest } from "@/lib/types/variante"

interface ProductoVarianteEditDialogProps {
  open: boolean
  target: CatalogVariantItem | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: VarianteUpdateRequest) => Promise<boolean>
}

interface VarianteEditFormState {
  sku: string
  precio: string
  precioMayor: string
  stock: string
}

function createEmptyForm(): VarianteEditFormState {
  return {
    sku: "",
    precio: "",
    precioMayor: "",
    stock: "",
  }
}

function toInputValue(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
}

function toOptionalPositiveInputValue(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? String(value) : ""
}

function parseRequiredPrice(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

function parseOptionalPositivePrice(value: string) {
  if (value.trim() === "") return { value: null, invalid: false }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, invalid: true }
  }
  if (parsed === 0) return { value: null, invalid: false }
  return { value: parsed, invalid: false }
}

function parseRequiredStock(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

function hasValidOffer(target: CatalogVariantItem | null): boolean {
  return typeof target?.offerPrice === "number" && target.offerPrice > 0
}

export function ProductoVarianteEditDialog({
  open,
  target,
  onOpenChange,
  onUpdate,
}: ProductoVarianteEditDialogProps) {
  const [form, setForm] = useState<VarianteEditFormState>(createEmptyForm)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !target) return

    setForm({
      sku: target.sku ?? "",
      precio: toInputValue(target.regularPrice),
      precioMayor: toOptionalPositiveInputValue(target.wholesalePrice),
      stock: toInputValue(target.stock),
    })
  }, [open, target])

  const parsedPrecio = parseRequiredPrice(form.precio)
  const parsedStock = parseRequiredStock(form.stock)
  const parsedPrecioMayor = parseOptionalPositivePrice(form.precioMayor)
  const hasSku = form.sku.trim() !== ""
  const hasOffer = hasValidOffer(target)

  const isEditValid =
    hasSku &&
    parsedPrecio !== null &&
    parsedStock !== null &&
    !parsedPrecioMayor.invalid

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(createEmptyForm())
    }
  }

  const handleUpdate = async () => {
    if (!target?.variantId || !isEditValid) {
      return
    }

    const payload: VarianteUpdateRequest = {
      colorId: target.colorId,
      tallaId: target.tallaId,
      sku: form.sku.trim(),
      precio: parsedPrecio ?? 0,
      precioMayor: parsedPrecioMayor.value,
      stock: parsedStock ?? 0,
    }

    setIsUpdating(true)
    try {
      const success = await onUpdate(target.variantId, payload)
      if (success) {
        onOpenChange(false)
        setForm(createEmptyForm())
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Variante</DialogTitle>
          <DialogDescription>
            {`Modifica la variante de "${target?.productName ?? ""}".`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {target?.colorName ?? "-"}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Talla</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {target?.tallaName ?? "-"}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-variante-sku">SKU</Label>
            <Input
              id="producto-variante-sku"
              value={form.sku}
              onChange={(event) => {
                setForm((previous) => ({ ...previous, sku: event.target.value }))
              }}
              placeholder="Ej. CAM-AZU-M"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="producto-variante-precio">Precio</Label>
              <Input
                id="producto-variante-precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(event) => {
                  setForm((previous) => ({ ...previous, precio: event.target.value }))
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="producto-variante-precio-mayor">Precio por mayor</Label>
              <Input
                id="producto-variante-precio-mayor"
                type="number"
                min="0"
                step="0.01"
                value={form.precioMayor}
                onChange={(event) => {
                  setForm((previous) => ({ ...previous, precioMayor: event.target.value }))
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="producto-variante-stock">Stock</Label>
              <Input
                id="producto-variante-stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => {
                  setForm((previous) => ({ ...previous, stock: event.target.value }))
                }}
              />
            </div>
          </div>

          {hasOffer && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
              Esta variante tiene una oferta registrada por{" "}
              <span className="font-semibold">{formatMonedaPen(target?.offerPrice)}</span>. La
              oferta no se edita desde este modal.
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isUpdating}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!isEditValid || isUpdating}>
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
