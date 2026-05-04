"use client"

import { useMemo, useState, type CSSProperties } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CubeIcon,
  FunnelIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  Squares2X2Icon,
  TableCellsIcon,
  TagIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOfertaBatchEditor } from "@/lib/hooks/useOfertaBatchEditor"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { OfertaBatchSchedulePreset } from "@/lib/types/oferta"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { roleIsRestrictedToSucursalOffer } from "@/lib/auth/roles"

interface OfertaBuilderSectionProps {
  onOfferSaved: (tipo: "GLOBAL" | "SUCURSAL") => void
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
  const shouldRenderImage =
    typeof imageUrl === "string" && imageUrl !== "" && imageUrl !== failedImageUrl

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

function getStockSucursalVariante(
  variant: {
    stocksSucursales?: Array<{ idSucursal: number; cantidad: number }>
  },
  idSucursal: number | null
): number | null {
  if (idSucursal === null) return null

  const stockSucursal = variant.stocksSucursales?.find(
    (stockItem) => stockItem.idSucursal === idSucursal
  )

  return hasFiniteStock(stockSucursal?.cantidad) ? stockSucursal.cantidad : 0
}

function getStockBadgeConfig(stock: number) {
  if (stock <= 0)
    return { className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300" }
  if (stock <= 5)
    return { className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" }
  if (stock <= 15)
    return { className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300" }
  return { className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" }
}

export function OfertaBuilderSection({ onOfferSaved }: OfertaBuilderSectionProps) {
  const { user } = useAuth()
  const isRestrictedRole = roleIsRestrictedToSucursalOffer(user?.rol)

  const [tipoOferta, setTipoOferta] = useState<"GLOBAL" | "SUCURSAL">("GLOBAL")
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [selectedSucursalName, setSelectedSucursalName] = useState<string>("")
  const [variantsViewMode, setVariantsViewMode] = useState<"table" | "cards">("table")
  const [selectedColorFilter, setSelectedColorFilter] = useState("all")
  const [selectedTallaFilter, setSelectedTallaFilter] = useState("all")

  const effectiveTipoOferta: "GLOBAL" | "SUCURSAL" = isRestrictedRole ? "SUCURSAL" : tipoOferta
  const effectiveSucursalId = isRestrictedRole ? (user?.idSucursal ?? null) : selectedSucursalId
  const effectiveSucursalName = isRestrictedRole ? (user?.nombreSucursal ?? "") : selectedSucursalName

  const {
    sucursalOptions,
    loadingSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(effectiveTipoOferta === "SUCURSAL" && !isRestrictedRole)

  const activeIdSucursal = effectiveTipoOferta === "SUCURSAL" ? effectiveSucursalId : null

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
    setVariantSelectionForIds,
    clearSelectedVariants,
    updateBulkFormField,
    applySchedulePreset,
    updateVariantDraftField,
    saveOffers,
  } = useOfertaBatchEditor(activeIdSucursal)

  const productOptions = useMemo<ComboboxOption[]>(() => {
    const optionMap = new Map<string, ComboboxOption>()
    if (selectedProduct) {
      optionMap.set(String(selectedProduct.idProducto), buildProductOption(selectedProduct))
    }
    products.forEach((product) => {
      optionMap.set(String(product.idProducto), buildProductOption(product))
    })
    return Array.from(optionMap.values())
  }, [products, selectedProduct])

  const shouldShowStockColumn = useMemo(
    () => effectiveTipoOferta === "SUCURSAL" && effectiveSucursalId !== null,
    [effectiveSucursalId, effectiveTipoOferta]
  )

  const colorFilterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          tableItems.map((item) => [
            item.variant.colorNombre,
            {
              value: item.variant.colorNombre,
              label: item.variant.colorNombre,
              colorHex: item.variant.colorHex,
            },
          ])
        ).values()
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [tableItems]
  )

  const tallaFilterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          tableItems.map((item) => [
            item.variant.tallaNombre,
            { value: item.variant.tallaNombre, label: item.variant.tallaNombre },
          ])
        ).values()
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [tableItems]
  )

  const displayedItems = useMemo(
    () =>
      tableItems.filter((item) => {
        const matchesColor =
          selectedColorFilter === "all" ||
          item.variant.colorNombre === selectedColorFilter
        const matchesTalla =
          selectedTallaFilter === "all" ||
          item.variant.tallaNombre === selectedTallaFilter
        return matchesColor && matchesTalla
      }),
    [selectedColorFilter, selectedTallaFilter, tableItems]
  )

  const allDisplayedSelected = useMemo(
    () => displayedItems.length > 0 && displayedItems.every((item) => item.selected),
    [displayedItems]
  )

  function handleTipoChange(tipo: "GLOBAL" | "SUCURSAL") {
    if (tipo === tipoOferta) return
    setTipoOferta(tipo)
    setSelectedSucursalId(null)
    setSelectedSucursalName("")
    handleProductSelect("")
    clearSelectedVariants()
  }

  function resetVariantFilters() {
    setSelectedColorFilter("all")
    setSelectedTallaFilter("all")
  }

  function handleToggleDisplayedVariants() {
    if (displayedItems.length === 0) return
    setVariantSelectionForIds(
      displayedItems.map((item) => item.variant.idProductoVariante),
      !allDisplayedSelected
    )
  }

  const canSave =
    effectiveTipoOferta === "GLOBAL"
      ? previewItems.length > 0
      : previewItems.length > 0 && effectiveSucursalId !== null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[500px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">

          {/* Tipo de oferta toggle */}
          <div className="border-b border-slate-200 px-5 py-4 dark:border-neutral-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-neutral-500">
              Tipo de oferta
            </p>
            {isRestrictedRole ? (
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                  <BuildingStorefrontIcon className="h-4 w-4" />
                  Por sucursal
                </span>
                <p className="mt-2 text-[11px] text-slate-400 dark:text-neutral-500">
                  Tu rol solo permite crear ofertas para tu sucursal.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTipoChange("GLOBAL")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                    tipoOferta === "GLOBAL"
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                  )}
                >
                  <GlobeAltIcon className="h-4 w-4" />
                  Global
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoChange("SUCURSAL")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                    tipoOferta === "SUCURSAL"
                      ? "border-violet-600 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-400 dark:text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                  )}
                >
                  <BuildingStorefrontIcon className="h-4 w-4" />
                  Por sucursal
                </button>
              </div>
            )}
          </div>

          {/* Sucursal selector — solo visible en modo SUCURSAL */}
          {effectiveTipoOferta === "SUCURSAL" && (
            <div className="border-b border-slate-200 px-5 py-4 dark:border-neutral-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-neutral-500">
                Sucursal
              </p>
              {isRestrictedRole ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 dark:border-violet-500/30 dark:bg-violet-500/10">
                    <BuildingStorefrontIcon className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                    <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                      {effectiveSucursalName || "Tu sucursal"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <Combobox
                    value={selectedSucursalId ? String(selectedSucursalId) : ""}
                    options={sucursalOptions}
                    searchValue={searchSucursal}
                    onSearchValueChange={setSearchSucursal}
                    onValueChange={(value) => {
                      const id = value ? Number(value) : null
                      setSelectedSucursalId(id)
                      const opt = sucursalOptions.find((o) => o.value === value)
                      setSelectedSucursalName(opt?.label ?? "")
                      handleProductSelect("")
                      clearSelectedVariants()
                      resetVariantFilters()
                    }}
                    placeholder="Seleccionar sucursal"
                    searchPlaceholder="Buscar sucursal..."
                    emptyMessage="No se encontraron sucursales"
                    loading={loadingSucursales}
                    loadingMessage="Cargando sucursales..."
                  />
                  {selectedSucursalId && (
                    <p className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-300">
                      <BuildingStorefrontIcon className="h-3.5 w-3.5 shrink-0" />
                      {selectedSucursalName} · override de sucursal
                    </p>
                  )}
                  {!selectedSucursalId && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Selecciona una sucursal para continuar.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Producto selector */}
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
                disabled={effectiveTipoOferta === "SUCURSAL" && !effectiveSucursalId}
              />
              {selectedProduct && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                  <span className="truncate">{selectedProduct.nombre}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {displayedItems.length}
                  </span>
                </div>
              )}
              {productsError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{productsError}</p>
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
                  onChange={(event) => {
                    updateBulkFormField("priceMode", "PRECIO_FIJO")
                    updateBulkFormField("priceInput", event.target.value)
                  }}
                  placeholder="Ej. 79.90"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Se refleja automaticamente en las variantes seleccionadas.
                </p>
              </div>
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
                  if (success) onOfferSaved(effectiveTipoOferta)
                })
              }}
              disabled={saving || !canSave}
              className={cn(
                "mt-4 h-11 w-full rounded-xl text-white",
                effectiveTipoOferta === "SUCURSAL"
                  ? "border-violet-500/30 bg-violet-600 hover:bg-violet-700"
                  : "border-amber-500/30 bg-amber-500 hover:bg-amber-600"
              )}
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
                  {effectiveTipoOferta === "SUCURSAL" && effectiveSucursalName
                    ? ` · ${effectiveSucursalName}`
                    : ""}
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

      {/* Tabla de variantes */}
      <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Variantes del producto
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                {effectiveTipoOferta === "SUCURSAL" && effectiveSucursalName ? (
                  <>
                    <BuildingStorefrontIcon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span className="font-semibold text-violet-700 dark:text-violet-300">
                      {effectiveSucursalName}
                    </span>
                    <span>· override de sucursal</span>
                  </>
                ) : (
                  "Selecciona variantes y edita el precio oferta directamente en la tabla."
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                <Tabs
                  value={variantsViewMode}
                  onValueChange={(value) => setVariantsViewMode(value as "table" | "cards")}
                  className="gap-0"
                >
                  <TabsList className="h-10 rounded-xl">
                    <TabsTrigger value="table" className="gap-2 px-3">
                      <TableCellsIcon className="h-4 w-4" />
                      Tabla
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="gap-2 px-3">
                      <Squares2X2Icon className="h-4 w-4" />
                      Tarjetas
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                <Checkbox
                  checked={allDisplayedSelected}
                  onCheckedChange={() => handleToggleDisplayedVariants()}
                  disabled={!selectedProduct || displayedItems.length === 0}
                  className="rounded-md"
                />
                Seleccionar todas ({displayedItems.length})
              </label>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <FunnelIcon className="h-3.5 w-3.5" />
                Tallas
              </span>
              <button
                type="button"
                onClick={() => setSelectedTallaFilter("all")}
                disabled={!selectedProduct}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  selectedTallaFilter === "all"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                )}
              >
                Todas
              </button>
              {tallaFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedTallaFilter(option.value)}
                  disabled={!selectedProduct}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    selectedTallaFilter === option.value
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:max-w-[40%] lg:justify-end">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-400">
                Colores
              </span>
              <button
                type="button"
                onClick={() => setSelectedColorFilter("all")}
                disabled={!selectedProduct}
                className={cn(
                  "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  selectedColorFilter === "all"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                )}
              >
                Todas
              </button>
              {colorFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedColorFilter(option.value)}
                  disabled={!selectedProduct}
                  title={option.label}
                  aria-label={`Filtrar por color ${option.label}`}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    selectedColorFilter === option.value
                      ? "border-slate-900 ring-2 ring-slate-200 dark:border-white dark:ring-neutral-700"
                      : "border-white/70 hover:scale-105 dark:border-neutral-700"
                  )}
                  style={
                    option.colorHex && /^#[0-9a-f]{3,8}$/i.test(option.colorHex.trim())
                      ? { backgroundColor: option.colorHex.trim() }
                      : undefined
                  }
                >
                  {!option.colorHex ? (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-300">
                      {option.label.slice(0, 1)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!selectedProduct ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-neutral-400">
            {effectiveTipoOferta === "SUCURSAL" && !effectiveSucursalId
              ? "Selecciona primero una sucursal, luego busca un producto."
              : "Selecciona un producto en el panel izquierdo para cargar su tabla de variantes."}
          </div>
        ) : loadingVariants ? (
          <div className="px-6 py-16 flex items-center justify-center">
            <LoaderSpinner text="Cargando variantes..." />
          </div>
        ) : variantsError ? (
          <div className="px-6 py-10 text-sm text-rose-600 dark:text-rose-400">
            {variantsError}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-neutral-400">
            No hay variantes para mostrar con el filtro actual.
          </div>
        ) : variantsViewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">
                  <th className="w-14 border-b border-slate-200 px-4 py-3 dark:border-neutral-800" />
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Variante</th>
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Color talla</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">Precio</th>
                  {shouldShowStockColumn ? (
                    <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Stock</th>
                  ) : null}
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">Oferta</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-neutral-800">Desc.</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((item) => {
                  const colorDotStyle = getColorIndicatorStyle(item.variant.colorHex)
                  const stockSucursal = getStockSucursalVariante(
                    item.variant,
                    shouldShowStockColumn ? effectiveSucursalId : null
                  )
                  const stockBadge = hasFiniteStock(stockSucursal)
                    ? getStockBadgeConfig(stockSucursal)
                    : null
                  const offerValue = item.selected ? item.draft.precioOfertaInput : ""
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
                      role="button"
                      tabIndex={0}
                      aria-pressed={item.selected}
                      aria-label={`Seleccionar ${item.variant.sku || item.variant.idProductoVariante}`}
                      onClick={() => toggleVariantSelection(item.variant.idProductoVariante)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          toggleVariantSelection(item.variant.idProductoVariante)
                        }
                      }}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 dark:hover:bg-neutral-900/60",
                        effectiveTipoOferta === "SUCURSAL"
                          ? "focus-visible:ring-violet-200 dark:focus-visible:ring-violet-500/20"
                          : "focus-visible:ring-amber-200 dark:focus-visible:ring-amber-500/20",
                        item.selected
                          ? effectiveTipoOferta === "SUCURSAL"
                            ? "bg-violet-50/60 dark:bg-violet-500/5"
                            : "bg-amber-50/60 dark:bg-amber-500/5"
                          : "bg-transparent"
                      )}
                    >
                      <td className="border-b border-slate-200 px-4 py-3 align-top dark:border-neutral-800">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() =>
                            toggleVariantSelection(item.variant.idProductoVariante)
                          }
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
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
                            <span className="h-2.5 w-2.5 rounded-full" style={colorDotStyle} />
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
                                {stockSucursal}
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
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
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
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {displayedItems.map((item) => {
              const colorDotStyle = getColorIndicatorStyle(item.variant.colorHex)
              const stockSucursal = getStockSucursalVariante(
                item.variant,
                shouldShowStockColumn ? effectiveSucursalId : null
              )
              const stockBadge = hasFiniteStock(stockSucursal)
                ? getStockBadgeConfig(stockSucursal)
                : null
              const offerValue = item.selected ? item.draft.precioOfertaInput : ""
              const validationMessage =
                showValidationFeedback &&
                item.selected &&
                item.validationResult &&
                !item.validationResult.ok
                  ? item.validationResult.message
                  : null

              return (
                <article
                  key={item.variant.idProductoVariante}
                  role="button"
                  tabIndex={0}
                  aria-pressed={item.selected}
                  aria-label={`Seleccionar ${item.variant.sku || item.variant.idProductoVariante}`}
                  onClick={() => toggleVariantSelection(item.variant.idProductoVariante)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      toggleVariantSelection(item.variant.idProductoVariante)
                    }
                  }}
                  className={cn(
                    "flex h-full flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors outline-none hover:bg-slate-50/80 focus-visible:ring-2 dark:bg-neutral-950 dark:hover:bg-neutral-900/60",
                    effectiveTipoOferta === "SUCURSAL"
                      ? "focus-visible:ring-violet-200 dark:focus-visible:ring-violet-500/20"
                      : "focus-visible:ring-amber-200 dark:focus-visible:ring-amber-500/20",
                    item.selected
                      ? effectiveTipoOferta === "SUCURSAL"
                        ? "border-violet-300 bg-violet-50/60 dark:border-violet-500/40 dark:bg-violet-500/5"
                        : "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5"
                      : "border-slate-200 dark:border-neutral-800"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <OfertaVariantTablePreview
                        imageUrl={item.imageUrl}
                        productName={selectedProduct.nombre}
                        colorName={item.variant.colorNombre}
                        tallaName={item.variant.tallaNombre}
                        colorDotStyle={colorDotStyle}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {selectedProduct.nombre}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">
                          {item.variant.sku || `Variante #${item.variant.idProductoVariante}`}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() =>
                        toggleVariantSelection(item.variant.idProductoVariante)
                      }
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      aria-label={`Seleccionar ${item.variant.sku || item.variant.idProductoVariante}`}
                      className="mt-0.5 rounded-md"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                      <span className="h-2.5 w-2.5 rounded-full" style={colorDotStyle} />
                      {item.variant.colorNombre}
                    </span>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                      {item.variant.tallaNombre}
                    </span>
                    {shouldShowStockColumn && stockBadge ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                          stockBadge.className
                        )}
                      >
                        Stock {stockSucursal}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-neutral-500">
                        Precio base
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {formatMonedaPen(item.variant.precio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-neutral-500">
                        Descuento
                      </p>
                      <div className="mt-1">
                        {item.discountPercent !== null ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            -{item.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-neutral-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-neutral-500">
                      Precio oferta
                    </label>
                    <div className="relative">
                      <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offerValue}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
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
                      <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
                        {validationMessage}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
