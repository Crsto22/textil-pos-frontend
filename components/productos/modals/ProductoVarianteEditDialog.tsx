"use client"

import { useEffect, useRef, useState } from "react"

import { AlertTriangle, Barcode, Eye, Loader2, MapPin, Plus, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { resolveBackendUrl } from "@/lib/resolve-backend-url"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import type { VarianteUpdateRequest } from "@/lib/types/variante"

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import { MediaSelectionConfirmDialog } from "@/components/producto-nuevo/media/MediaSelectionConfirmDialog"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import { ImageLightbox } from "@/components/productos/modals/ImageLightbox"
import {
  MovimientoStockVarianteModal,
  type MovimientoStockSuccessPayload,
} from "@/components/stock/MovimientoStockVarianteModal"

const MAX_IMAGES = 5

export interface ColorImagen {
  idColorImagen: number
  url: string
  urlThumb: string
  orden: number
  esPrincipal: boolean
}

interface ProductoVarianteEditDialogProps {
  open: boolean
  target: CatalogVariantItem | null
  initialImages?: ColorImagen[]
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: VarianteUpdateRequest) => Promise<boolean>
  onGenerateBarcode: () => Promise<string | null>
  isGeneratingBarcode: boolean
  onStockMovementSuccess?: () => void
}

interface VarianteEditFormState {
  sku: string
  codigoBarras: string
  precio: string
  precioMayor: string
}

function createEmptyForm(): VarianteEditFormState {
  return { sku: "", codigoBarras: "", precio: "", precioMayor: "" }
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
  if (!Number.isFinite(parsed) || parsed < 0) return { value: null, invalid: true }
  if (parsed === 0) return { value: null, invalid: false }
  return { value: parsed, invalid: false }
}

function hasValidOffer(target: CatalogVariantItem | null): boolean {
  return typeof target?.offerPrice === "number" && target.offerPrice > 0
}

function parseColorImagenes(data: unknown): ColorImagen[] {
  let list: unknown[]
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    list = Array.isArray(obj.imagenes) ? obj.imagenes : []
  } else {
    return []
  }

  return list
    .filter((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string")
    .map((item) => {
      const it = item as Record<string, unknown>
      const rawUrl = it.url as string
      const rawThumb = typeof it.urlThumb === "string" ? it.urlThumb : rawUrl
      return {
        idColorImagen: Number(it.idColorImagen) || 0,
        url: resolveBackendUrl(rawUrl) ?? rawUrl,
        urlThumb: resolveBackendUrl(rawThumb) ?? rawThumb,
        orden: Number(it.orden) || 0,
        esPrincipal: Boolean(it.esPrincipal),
      }
    })
    .filter((item) => item.idColorImagen > 0)
}

export function ProductoVarianteEditDialog({
  open,
  target,
  initialImages = [],
  onOpenChange,
  onUpdate,
  onGenerateBarcode,
  isGeneratingBarcode,
  onStockMovementSuccess,
}: ProductoVarianteEditDialogProps) {
  const [form, setForm] = useState<VarianteEditFormState>(createEmptyForm)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showBarcodeConfirm, setShowBarcodeConfirm] = useState(false)
  const [showStockMovementModal, setShowStockMovementModal] = useState(false)
  const [stockMovementSucursalId, setStockMovementSucursalId] = useState<number | null>(null)
  const [stockItems, setStockItems] = useState(target?.stocksSucursalesVenta ?? [])
  const [stockTotal, setStockTotal] = useState(target?.stock ?? 0)

  // Image gallery
  const [images, setImages] = useState<ColorImagen[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload confirm
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !target) return
    setForm({
      sku: target.sku ?? "",
      codigoBarras: target.codigoBarras ?? "",
      precio: toInputValue(target.regularPrice),
      precioMayor: toOptionalPositiveInputValue(target.wholesalePrice),
    })
    setPendingFile(null)
    setPendingPreviewUrl(null)
    setLightboxIndex(null)
    setImages(initialImages)
    setIsLoadingImages(false)
    setStockItems(target.stocksSucursalesVenta)
    setStockTotal(target.stock ?? 0)
    setShowStockMovementModal(false)
    setStockMovementSucursalId(null)
  }, [open, target]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lightboxIndex === null) return
    if (images.length === 0) {
      setLightboxIndex(null)
      return
    }

    if (lightboxIndex > images.length - 1) {
      setLightboxIndex(images.length - 1)
    }
  }, [images, lightboxIndex])

  const parsedPrecio = parseRequiredPrice(form.precio)
  const parsedPrecioMayor = parseOptionalPositivePrice(form.precioMayor)
  const hasSku = form.sku.trim() !== ""
  const hasOffer = hasValidOffer(target)
  const isEditValid = hasSku && parsedPrecio !== null && !parsedPrecioMayor.invalid
  const originalBarcode = target?.codigoBarras ?? ""
  const hasBarcodeChanged =
    originalBarcode.trim() !== "" &&
    form.codigoBarras.trim() !== "" &&
    form.codigoBarras.trim() !== originalBarcode.trim()

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating || isUploadingImage || deletingImageId !== null) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(createEmptyForm())
      setShowBarcodeConfirm(false)
      setImages([])
      setLightboxIndex(null)
      setShowStockMovementModal(false)
      setStockMovementSucursalId(null)
      setStockItems([])
      setStockTotal(0)
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
      setPendingFile(null)
      setPendingPreviewUrl(null)
    }
  }

  const handleStockMovementSuccess = (payload: MovimientoStockSuccessPayload) => {
    const signedCantidad = payload.tipoMovimiento === "ENTRADA" ? payload.cantidad : -payload.cantidad
    setStockItems((prev) => {
      const existing = prev.find((item) => item.idSucursal === payload.idSucursal)
      if (existing) {
        return prev.map((item) =>
          item.idSucursal === payload.idSucursal
            ? { ...item, stock: Math.max(0, item.stock + signedCantidad) }
            : item
        )
      }

      return [
        ...prev,
        {
          idSucursal: payload.idSucursal,
          nombreSucursal: payload.nombreSucursal,
          stock: Math.max(0, signedCantidad),
        },
      ]
    })
    setStockTotal((prev) => Math.max(0, prev + signedCantidad))
    onStockMovementSuccess?.()
  }

  const handleOpenStockMovement = (idSucursal?: number | null) => {
    setStockMovementSucursalId(typeof idSucursal === "number" && idSucursal > 0 ? idSucursal : null)
    setShowStockMovementModal(true)
  }

  const handleUploadImage = async (file: File) => {
    if (!target?.variantId) return
    if (images.length >= MAX_IMAGES) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes por color`)
      return
    }

    const formData = new FormData()
    formData.append("files", file, file.name)

    setIsUploadingImage(true)
    try {
      const res = await authFetch(`/api/variante/${target.variantId}/imagenes`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message ?? "Error al subir imagen")
        return
      }

      if (Array.isArray(data?.imagenes)) {
        setImages(parseColorImagenes(data.imagenes))
      }
      toast.success("Imagen subida correctamente")
    } catch {
      toast.error("Error al subir imagen")
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteImage = async (idColorImagen: number) => {
    if (!target?.variantId) return
    setDeletingImageId(idColorImagen)
    try {
      const res = await authFetch(
        `/api/variante/${target.variantId}/imagenes/${idColorImagen}`,
        { method: "DELETE" }
      )
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message ?? "Error al eliminar imagen")
        return
      }

      if (Array.isArray(data?.imagenesRestantes)) {
        setImages(parseColorImagenes(data.imagenesRestantes))
      } else {
        setImages((prev) => prev.filter((img) => img.idColorImagen !== idColorImagen))
      }
      toast.success("Imagen eliminada")
    } catch {
      toast.error("Error al eliminar imagen")
    } finally {
      setDeletingImageId(null)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(file)
    setPendingPreviewUrl(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleConfirmImage = () => {
    if (pendingFile) void handleUploadImage(pendingFile)
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
  }

  const handleCancelImage = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
  }

  const handleGenerateBarcode = async () => {
    const code = await onGenerateBarcode()
    if (code) setForm((prev) => ({ ...prev, codigoBarras: code }))
  }

  const executeUpdate = async () => {
    if (!target?.variantId || !isEditValid) return
    const payload: VarianteUpdateRequest = {
      colorId: target.colorId,
      tallaId: target.tallaId,
      sku: form.sku.trim(),
      codigoBarras: form.codigoBarras.trim() || null,
      precio: parsedPrecio ?? 0,
      precioMayor: parsedPrecioMayor.value,
      stock: target.stock ?? 0,
    }
    setIsUpdating(true)
    try {
      const success = await onUpdate(target.variantId, payload)
      if (success) {
        onOpenChange(false)
        setForm(createEmptyForm())
        setImages([])
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdate = () => {
    if (hasBarcodeChanged) { setShowBarcodeConfirm(true); return }
    void executeUpdate()
  }

  const handleConfirmUpdate = () => {
    setShowBarcodeConfirm(false)
    void executeUpdate()
  }

  const isMobile = useIsMobile()
  const isBusy = isUpdating || isUploadingImage || deletingImageId !== null
  const emptySlots = Math.max(0, MAX_IMAGES - images.length)
  const canAddStockMovement = Boolean(target?.variantId)
  const showStockMovementPerSucursal = stockItems.length > 1

  const formBody = (
    <div className="grid gap-4 py-2">
            {/* Color / Talla */}
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

            {/* Image gallery */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                Imágenes del color
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({images.length}/{MAX_IMAGES}) · Aplican a todas las variantes de este color
                </span>
              </Label>

              <div className="flex flex-wrap gap-2">
                {isLoadingImages
                  ? Array.from({ length: MAX_IMAGES }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 w-24 animate-pulse rounded-xl border bg-muted/40"
                      />
                    ))
                  : images.map((img) => (
                      <div
                        key={img.idColorImagen}
                        className="group relative h-24 w-24 overflow-hidden rounded-xl border bg-muted/30"
                      >
                        <button
                          type="button"
                          aria-label="Ver imagen"
                          onClick={() => setLightboxIndex(images.findIndex((item) => item.idColorImagen === img.idColorImagen))}
                          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/0 transition-colors group-hover:bg-black/40"
                        >
                          <Eye className="h-6 w-6 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
                          <span className="sr-only">Ver imagen</span>
                        </button>

                        <img
                          src={img.urlThumb || img.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />

                        {img.esPrincipal && (
                          <span className="pointer-events-none absolute left-1 top-1 z-20 rounded bg-black/60 px-1 py-0.5 text-[10px] font-semibold text-white">
                            Principal
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleDeleteImage(img.idColorImagen)}
                          disabled={isBusy}
                          className="absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:pointer-events-none"
                          aria-label="Eliminar imagen"
                        >
                          {deletingImageId === img.idColorImagen ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}

                {/* Empty upload slots */}
                {!isLoadingImages &&
                  Array.from({ length: emptySlots }).map((_, i) => (
                    <button
                      key={`empty-${i}`}
                      type="button"
                      disabled={isBusy}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-muted/20 text-muted-foreground transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-950/30"
                    >
                      {isUploadingImage && i === 0 ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          <span className="text-[10px] font-medium">Agregar</span>
                        </>
                      )}
                    </button>
                  ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isBusy}
              />
            </div>

            {/* SKU / Barcode */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="producto-variante-sku">SKU</Label>
                <Input
                  id="producto-variante-sku"
                  value={form.sku}
                  onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="Ej. CAM-AZU-M"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="producto-variante-codigo-barras" className="flex items-center gap-1.5">
                  <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                  Codigo de Barras
                  <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="producto-variante-codigo-barras"
                    value={form.codigoBarras}
                    onChange={(e) => setForm((prev) => ({ ...prev, codigoBarras: e.target.value }))}
                    placeholder="Ej. 7501234567890"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Generar código de barras"
                    disabled={isGeneratingBarcode || isBusy}
                    onClick={() => void handleGenerateBarcode()}
                  >
                    {isGeneratingBarcode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="producto-variante-precio">Precio</Label>
                <Input
                  id="producto-variante-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
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
                  onChange={(e) => setForm((prev) => ({ ...prev, precioMayor: e.target.value }))}
                />
              </div>
            </div>

            {/* Stock */}
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Stock
                </p>
                {!showStockMovementPerSucursal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    disabled={isBusy || !canAddStockMovement}
                    onClick={() => handleOpenStockMovement(stockItems[0]?.idSucursal ?? null)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar movimiento
                  </Button>
                )}
              </div>
              {target && stockItems.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-3">
                  {stockItems.map((stockItem) => (
                    <div
                      key={stockItem.idSucursal}
                      className="flex min-w-0 flex-col gap-2 rounded-lg border bg-muted/20 p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs text-muted-foreground">{stockItem.nombreSucursal}</p>
                        <p className="font-semibold tabular-nums">{stockItem.stock}</p>
                      </div>
                      {showStockMovementPerSucursal && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-full gap-1.5 px-2 text-[11px]"
                          disabled={isBusy || !canAddStockMovement}
                          onClick={() => handleOpenStockMovement(stockItem.idSucursal)}
                        >
                          <Plus className="h-3 w-3" />
                          Agregar movimiento
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-1 text-sm">
                    <span className="font-medium text-blue-700 dark:text-blue-300">Total</span>
                    <span className="font-bold tabular-nums text-blue-700 dark:text-blue-300">
                      {stockTotal}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Stock total:{" "}
                  <span className="font-semibold text-foreground">{stockTotal}</span>
                </p>
              )}
            </div>

            {hasOffer && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
                Esta variante tiene una oferta registrada por{" "}
                <span className="font-semibold">{formatMonedaPen(target?.offerPrice)}</span>. La
                oferta no se edita desde este modal.
              </div>
            )}
          </div>
  )

  const barcodeConfirmDialog = (
    <Dialog open={showBarcodeConfirm} onOpenChange={setShowBarcodeConfirm}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cambio de código de barras
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Estás a punto de cambiar el código de barras de esta variante. Esto puede
                afectar el escaneo e identificación del producto.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/40 dark:bg-amber-900/10">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Anterior:</span> {originalBarcode}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Nuevo:</span> {form.codigoBarras.trim()}
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowBarcodeConfirm(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmUpdate} disabled={isUpdating}>
            {isUpdating ? "Guardando..." : "Confirmar y guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const lightbox = (
    <ImageLightbox
      images={images.map((image) => image.url)}
      currentIndex={lightboxIndex}
      onClose={() => setLightboxIndex(null)}
      onIndexChange={setLightboxIndex}
    />
  )

  const mediaConfirm = (
    <MediaSelectionConfirmDialog
      fileName={pendingFile?.name ?? null}
      previewUrl={pendingPreviewUrl}
      onAccept={handleConfirmImage}
      onCancel={handleCancelImage}
    />
  )

  const stockMovementModal = (
    <MovimientoStockVarianteModal
      open={showStockMovementModal}
      onOpenChange={setShowStockMovementModal}
      variante={target}
      stocksSucursales={stockItems}
      defaultIdSucursal={stockMovementSucursalId}
      onSuccess={handleStockMovementSuccess}
    />
  )

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="flex h-[90dvh] flex-col gap-0 p-0">
            <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
              <SheetTitle className="text-sm">Editar Variante</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              {formBody}
            </div>
            <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={isBusy} onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" onClick={handleUpdate} disabled={!isEditValid || isBusy}>
                  {isUpdating ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </SheetContent>
          {mediaConfirm}
          {barcodeConfirmDialog}
          {stockMovementModal}
        </Sheet>
        {lightbox}
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]" showCloseButton={!isBusy}>
          <DialogHeader>
            <DialogTitle>Editar Variante</DialogTitle>
            <DialogDescription>
              {`Modifica la variante de "${target?.productName ?? ""}".`}
            </DialogDescription>
          </DialogHeader>
          {formBody}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isBusy}>Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleUpdate} disabled={!isEditValid || isBusy}>
              {isUpdating ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
        {mediaConfirm}
        {barcodeConfirmDialog}
        {stockMovementModal}
      </Dialog>
      {lightbox}
    </>
  )
}
