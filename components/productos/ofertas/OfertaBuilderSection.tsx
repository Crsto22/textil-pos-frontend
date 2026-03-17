"use client"

import { useMemo, useState, type CSSProperties } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  RectangleStackIcon,
  TagIcon,
} from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useOfertaBatchEditor } from "@/lib/hooks/useOfertaBatchEditor"
import type { OfertaBatchSchedulePreset } from "@/lib/types/oferta"
import { cn } from "@/lib/utils"

interface OfertaBuilderSectionProps {
  onOfferSaved: () => void
}

const SCHEDULE_PRESET_OPTIONS: Array<{
  value: OfertaBatchSchedulePreset
  label: string
}> = [
  { value: "HOY", label: "1 dia" },
  { value: "TRES_DIAS", label: "3 dias" },
  { value: "SIETE_DIAS", label: "7 dias" },
  { value: "PERSONALIZADO", label: "Personalizado" },
]

function buildProductOption(product: {
  idProducto: number
  nombre: string
  nombreCategoria: string
}): ComboboxOption {
  return {
    value: String(product.idProducto),
    label: product.nombre,
    description: product.nombreCategoria || "Sin categoria",
  }
}

function getColorIndicatorStyle(colorHex: string) {
  if (typeof colorHex === "string" && /^#[0-9a-f]{3,8}$/i.test(colorHex.trim())) {
    return { backgroundColor: colorHex.trim() }
  }

  return undefined
}

function OfertaVariantTablePreview({
  imageUrl,
  productName,
  colorName,
  tallaName,
  colorDotStyle,
}: {
  imageUrl: string | null
  productName: string
  colorName: string
  tallaName: string
  colorDotStyle: CSSProperties | undefined
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldRenderImage = typeof imageUrl === "string" && imageUrl !== "" && imageUrl !== failedImageUrl

  return (
    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
      {shouldRenderImage ? (
        <Image
          src={imageUrl}
          alt={`${productName} - ${colorName} - Talla ${tallaName}`}
          fill
          unoptimized
          className="object-cover"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-950">
          {colorDotStyle ? (
            <span
              className="h-3 w-3 rounded-full border border-white/30 shadow-sm"
              style={colorDotStyle}
            />
          ) : (
            <CubeIcon className="h-4 w-4" />
          )}
        </span>
      )}
    </span>
  )
}

function hasFiniteStock(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function getStockBadgeConfig(stock: number) {
  if (stock <= 0) {
    return {
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    }
  }

  if (stock <= 5) {
    return {
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    }
  }

  if (stock <= 15) {
    return {
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    }
  }

  return {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  }
}

export function OfertaBuilderSection({
  onOfferSaved,
}: OfertaBuilderSectionProps) {
  const {
    productQuery,
    products,
    loadingProducts,
    productsError,
    selectedProduct,
    loadingVariants,
    variantsError,
    variantQuery,
    selectedVariants,
    allFilteredSelected,
    bulkForm,
    tableItems,
    previewItems,
    showValidationFeedback,
    submitError,
    saving,
    setProductQuery,
    setVariantQuery,
    handleProductSelect,
    toggleVariantSelection,
    toggleSelectAllFilteredVariants,
    clearSelectedVariants,
    updateBulkFormField,
    applySchedulePreset,
    updateVariantDraftField,
    applyBulkToSelected,
    saveOffers,
  } = useOfertaBatchEditor()

  const productOptions = useMemo<ComboboxOption[]>(() => {
    const optionMap = new Map<string, ComboboxOption>()

    if (selectedProduct) {
      optionMap.set(
        String(selectedProduct.idProducto),
        buildProductOption(selectedProduct)
      )
    }

    products.forEach((product) => {
      optionMap.set(String(product.idProducto), buildProductOption(product))
    })

    return Array.from(optionMap.values())
  }, [products, selectedProduct])

  const shouldShowStockColumn = useMemo(
    () => tableItems.some((item) => hasFiniteStock(item.variant.stock)),
    [tableItems]
  )

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[500px_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-neutral-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-neutral-500">
              Producto
            </p>
            <div className="mt-3 space-y-2">
              <Combobox
                value={selectedProduct ? String(selectedProduct.idProducto) : ""}
                options={productOptions}
                searchValue={productQuery}
                onSearchValueChange={setProductQuery}
                onValueChange={handleProductSelect}
                placeholder="Buscar producto"
                searchPlaceholder="Escribe para buscar..."
                emptyMessage={
                  productQuery.trim() === ""
                    ? "Escribe el nombre del producto para buscar"
                    : "No se encontraron productos"
                }
                loading={loadingProducts}
                loadingMessage="Buscando productos..."
              />
              {selectedProduct && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                  <span className="truncate">{selectedProduct.nombre}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {tableItems.length}
                  </span>
                </div>
              )}
              {productsError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {productsError}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-neutral-500">
                Regla de precio
              </p>

              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                  Precio fijo
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkForm.priceInput}
                  onChange={(event) =>
                    updateBulkFormField("priceInput", event.target.value)
                  }
                  placeholder="Ej. 79.90"
                  className="h-11 rounded-xl"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  updateBulkFormField("priceMode", "PRECIO_FIJO")
                  applyBulkToSelected()
                }}
                disabled={selectedVariants.length === 0}
                className="mt-4 h-11 w-full rounded-xl border-slate-200 font-semibold dark:border-neutral-800"
              >
                <RectangleStackIcon className="h-4 w-4" />
                Aplicar precio fijo a {selectedVariants.length} variante
                {selectedVariants.length === 1 ? "" : "s"}
              </Button>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-neutral-500">
                Vigencia
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {SCHEDULE_PRESET_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applySchedulePreset(option.value)}
                    className={cn(
                      "rounded-full",
                      bulkForm.schedulePreset === option.value &&
                        "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400">
                    Inicio
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
                    <Input
                      type="datetime-local"
                      step="60"
                      value={bulkForm.ofertaInicioInput}
                      onChange={(event) =>
                        updateBulkFormField("ofertaInicioInput", event.target.value)
                      }
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400">
                    Fin
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
                    <Input
                      type="datetime-local"
                      step="60"
                      value={bulkForm.ofertaFinInput}
                      onChange={(event) =>
                        updateBulkFormField("ofertaFinInput", event.target.value)
                      }
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                {submitError}
              </p>
            )}
          </div>

          <div className="border-t border-slate-200 px-5 py-5 dark:border-neutral-800">
            <Button
              type="button"
              onClick={() => {
                void saveOffers().then((success) => {
                  if (success) {
                    onOfferSaved()
                  }
                })
              }}
              disabled={saving || previewItems.length === 0}
              className="mt-4 h-11 w-full rounded-xl  text-white border-amber-500/30 bg-amber-500"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Publicar {selectedVariants.length} oferta
                  {selectedVariants.length === 1 ? "" : "s"}
                </>
              )}
            </Button>

            {selectedVariants.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => clearSelectedVariants()}
                className="mt-2 h-10 w-full rounded-xl text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Limpiar seleccion
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Crear ofertas por variante
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                Selecciona variantes y edita el precio oferta directamente en la tabla.
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 xl:w-80">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
                <Input
                  value={variantQuery}
                  onChange={(event) => setVariantQuery(event.target.value)}
                  placeholder="Buscar por SKU, color, talla..."
                  className="h-10 rounded-xl pl-9"
                  disabled={!selectedProduct}
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={() => toggleSelectAllFilteredVariants()}
                  disabled={!selectedProduct || tableItems.length === 0}
                  className="rounded-md"
                />
                Seleccionar todas ({tableItems.length})
              </label>
            </div>
          </div>
        </div>

        {!selectedProduct ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-neutral-400">
            Selecciona un producto en el panel izquierdo para cargar su tabla de variantes.
          </div>
        ) : loadingVariants ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-2">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Cargando variantes...
            </span>
          </div>
        ) : variantsError ? (
          <div className="px-6 py-10 text-sm text-rose-600 dark:text-rose-400">
            {variantsError}
          </div>
        ) : tableItems.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-neutral-400">
            No hay variantes para mostrar con el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">
                  <th className="w-14 border-b border-slate-200 px-4 py-3 dark:border-neutral-800" />
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Variante
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Color talla
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                    Precio
                  </th>
                  {shouldShowStockColumn ? (
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                      Stock
                    </th>
                  ) : null}
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                    Oferta
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                    Desc.
                  </th>
                </tr>
              </thead>

              <tbody>
                {tableItems.map((item) => {
                  const colorDotStyle = getColorIndicatorStyle(item.variant.colorHex)
                  const stockBadge = hasFiniteStock(item.variant.stock)
                    ? getStockBadgeConfig(item.variant.stock)
                    : null
                  const offerValue = item.selected
                    ? item.draft.precioOfertaInput
                    : ""
                  const validationMessage =
                    showValidationFeedback &&
                    item.selected &&
                    item.validationResult &&
                    !item.validationResult.ok
                      ? item.validationResult.message
                      : null

                  return (
                    <tr
                      key={item.variant.idProductoVariante}
                      className={cn(
                        "transition-colors",
                        item.selected
                          ? "bg-amber-50/60 dark:bg-amber-500/5"
                          : "bg-transparent"
                      )}
                    >
                      <td className="border-b border-slate-200 px-4 py-3 align-top dark:border-neutral-800">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() =>
                            toggleVariantSelection(item.variant.idProductoVariante)
                          }
                          aria-label={`Seleccionar ${item.variant.sku || item.variant.idProductoVariante}`}
                          className="mt-1 rounded-md"
                        />
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                          <OfertaVariantTablePreview
                            imageUrl={item.imageUrl}
                            productName={selectedProduct.nombre}
                            colorName={item.variant.colorNombre}
                            tallaName={item.variant.tallaNombre}
                            colorDotStyle={colorDotStyle}
                          />

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-white">
                              {selectedProduct.nombre}
                            </p>
                            {item.variant.sku ? (
                              <p className="mt-0.5 text-[11px] lowercase tracking-[0.02em] text-slate-400 dark:text-neutral-500">
                                sku: {item.variant.sku}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">
                                Sin SKU
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={colorDotStyle}
                            />
                            {item.variant.colorNombre}
                          </span>
                          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                            {item.variant.tallaNombre}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 text-right font-semibold text-slate-900 dark:border-neutral-800 dark:text-white">
                        {formatMonedaPen(item.variant.precio)}
                      </td>

                      {shouldShowStockColumn ? (
                        <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                          {stockBadge ? (
                            <div className="flex min-w-[96px]">
                              <span
                                className={cn(
                                  "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                                  stockBadge.className
                                )}
                              >
                                {item.variant.stock}
                              </span>
                            </div>
                          ) : null}
                        </td>
                      ) : null}

                      <td className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                        <div className="space-y-1.5">
                          <div className="relative">
                            <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={offerValue}
                              onChange={(event) =>
                                updateVariantDraftField(
                                  item.variant.idProductoVariante,
                                  "precioOfertaInput",
                                  event.target.value
                                )
                              }
                              placeholder="-"
                              disabled={!item.selected}
                              className={cn(
                                "h-10 rounded-xl pl-9",
                                validationMessage &&
                                  "border-rose-300 focus-visible:ring-rose-200 dark:border-rose-500/40 dark:focus-visible:ring-rose-500/20"
                              )}
                            />
                          </div>

                          {validationMessage && (
                            <p className="text-xs text-rose-600 dark:text-rose-300">
                              {validationMessage}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">
                        {item.discountPercent !== null ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            -{item.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-neutral-600">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
