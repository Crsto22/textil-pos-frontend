"use client"

import { useMemo } from "react"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { OfertasRegistradasSection } from "@/components/productos/ofertas/OfertasRegistradasSection"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { parsePrecioOfertaInput } from "@/lib/oferta-batch"
import { formatearRangoOferta } from "@/lib/oferta-utils"
import { useOfertaBatchEditor } from "@/lib/hooks/useOfertaBatchEditor"
import type { ProductoDetalleVariante } from "@/lib/types/producto"

interface OfertaBuilderSectionProps {
  refreshToken: number
  onOfferSaved: () => void
}

function buildVariantOption(variant: ProductoDetalleVariante): ComboboxOption {
  return {
    value: String(variant.idProductoVariante),
    label: `${variant.colorNombre} - Talla ${variant.tallaNombre}`,
    description: `${variant.sku || "Sin SKU"} | ${formatMonedaPen(variant.precio)}`,
  }
}

export function OfertaBuilderSection({
  refreshToken,
  onOfferSaved,
}: OfertaBuilderSectionProps) {
  const {
    productQuery,
    products,
    loadingProducts,
    productsError,
    selectedProduct,
    filteredVariants,
    loadingVariants,
    variantsError,
    variantQuery,
    selectedVariantId,
    selectedVariant,
    selectedVariantImageUrl,
    form,
    submitError,
    saving,
    setProductQuery,
    setVariantQuery,
    handleProductSelect,
    handleVariantSelect,
    updateFormField,
    saveOffer,
  } = useOfertaBatchEditor()

  const productOptions = useMemo<ComboboxOption[]>(() => {
    const optionMap = new Map<string, ComboboxOption>()

    if (selectedProduct) {
      optionMap.set(String(selectedProduct.idProducto), {
        value: String(selectedProduct.idProducto),
        label: selectedProduct.nombre,
        description: selectedProduct.nombreCategoria || "Sin categoria",
      })
    }

    products.forEach((product) => {
      optionMap.set(String(product.idProducto), {
        value: String(product.idProducto),
        label: product.nombre,
        description: product.nombreCategoria || "Sin categoria",
      })
    })

    return Array.from(optionMap.values())
  }, [products, selectedProduct])

  const variantOptions = useMemo<ComboboxOption[]>(() => {
    const optionMap = new Map<string, ComboboxOption>()

    filteredVariants.forEach((variant) => {
      optionMap.set(String(variant.idProductoVariante), buildVariantOption(variant))
    })

    if (
      selectedVariant &&
      !optionMap.has(String(selectedVariant.idProductoVariante))
    ) {
      optionMap.set(
        String(selectedVariant.idProductoVariante),
        buildVariantOption(selectedVariant)
      )
    }

    return Array.from(optionMap.values())
  }, [filteredVariants, selectedVariant])

  const previewOfferPrice = useMemo(() => {
    const parsedInputPrice = parsePrecioOfertaInput(form.precioOfertaInput)
    if (typeof parsedInputPrice === "number" && parsedInputPrice > 0) {
      return parsedInputPrice
    }

    return typeof selectedVariant?.precioOferta === "number"
      ? selectedVariant.precioOferta
      : null
  }, [form.precioOfertaInput, selectedVariant])

  const previewScheduleLabel = useMemo(() => {
    if (form.ofertaInicioInput.trim() !== "" || form.ofertaFinInput.trim() !== "") {
      return formatearRangoOferta(form.ofertaInicioInput, form.ofertaFinInput)
    }

    return formatearRangoOferta(selectedVariant?.ofertaInicio, selectedVariant?.ofertaFin)
  }, [form.ofertaFinInput, form.ofertaInicioInput, selectedVariant])

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle>Crear o actualizar ofertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Producto
              </label>
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
              {productsError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{productsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Variante
              </label>
              <Combobox
                value={selectedVariantId}
                options={variantOptions}
                searchValue={variantQuery}
                onSearchValueChange={setVariantQuery}
                onValueChange={handleVariantSelect}
                placeholder={
                  selectedProduct ? "Selecciona variante" : "Selecciona producto primero"
                }
                searchPlaceholder="Buscar por SKU, color o talla..."
                emptyMessage={
                  selectedProduct
                    ? "No se encontraron variantes"
                    : "Selecciona un producto"
                }
                loading={loadingVariants}
                loadingMessage="Cargando variantes..."
                disabled={!selectedProduct}
              />
              {variantsError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{variantsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Precio regular
              </label>
              <Input
                type="text"
                value={selectedVariant ? formatMonedaPen(selectedVariant.precio) : ""}
                placeholder="Selecciona una variante primero"
                readOnly
                disabled={!selectedVariant}
                className="font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Precio oferta
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.precioOfertaInput}
                onChange={(event) =>
                  updateFormField("precioOfertaInput", event.target.value)
                }
                placeholder="Ej. 79.90"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Inicio
              </label>
              <Input
                type="datetime-local"
                step="60"
                value={form.ofertaInicioInput}
                onChange={(event) =>
                  updateFormField("ofertaInicioInput", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Fin
              </label>
              <Input
                type="datetime-local"
                step="60"
                value={form.ofertaFinInput}
                onChange={(event) =>
                  updateFormField("ofertaFinInput", event.target.value)
                }
              />
            </div>

            <Button
              type="button"
              onClick={() => {
                void saveOffer().then((success) => {
                  if (success) {
                    onOfferSaved()
                  }
                })
              }}
              disabled={saving || !selectedVariant}
              className="w-full bg-amber-500 text-white hover:bg-amber-400"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4" />
                  {selectedVariant && typeof selectedVariant.precioOferta === "number"
                    ? "Actualizar oferta"
                    : "Guardar oferta"}
                </>
              )}
            </Button>
          </div>

          {selectedVariant && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                  {selectedVariantImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedVariantImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="px-3 text-center text-xs text-slate-400 dark:text-slate-500">
                      Sin imagen
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedProduct?.nombre}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-700">
                      {selectedVariant.colorNombre}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-700">
                      Talla {selectedVariant.tallaNombre}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs font-mono dark:border-slate-700">
                      {selectedVariant.sku || "Sin SKU"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                        Precio regular
                      </p>
                      <p className="mt-2  font-black leading-none text-slate-950 dark:text-white ">
                        {formatMonedaPen(selectedVariant.precio)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                        Precio oferta
                      </p>
                      <p className="mt-2  font-black leading-none text-amber-700 dark:text-amber-300 ">
                        {previewOfferPrice !== null
                          ? formatMonedaPen(previewOfferPrice)
                          : "Sin oferta"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Vigencia:</span> {previewScheduleLabel}
                  </div>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{submitError}</p>
          )}
        </CardContent>
      </Card>

      <div className="min-w-0">
        <OfertasRegistradasSection refreshToken={refreshToken} />
      </div>
    </div>
  )
}
