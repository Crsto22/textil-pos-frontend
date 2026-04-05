"use client"

import { type ReactNode, useCallback, useMemo, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import type { MediaItem } from "@/lib/types/producto-create"
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ListBulletIcon,
  Squares2X2Icon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { Barcode, Store, Warehouse } from "lucide-react"

import { ShirtHangerIcon } from "@/components/icons/ShirtHangerIcon"
import { ProductoVariantStockEditor } from "@/components/producto-nuevo/ProductoVariantStockEditor"
import { ProductoVariantDeleteDialog } from "@/components/producto-nuevo/modals/ProductoVariantDeleteDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  VariantEditableField,
  VariantRow,
  VariantSucursalStockInput,
  VariantStatus,
} from "@/lib/types/producto-create"
import {
  formatearRangoOferta,
  obtenerEstadoVigenciaOferta,
  type EstadoVigenciaOferta,
} from "@/lib/oferta-utils"
import { cn } from "@/lib/utils"

interface ProductoVariantMatrixCardProps {
  hasSelectedColors: boolean
  hasSelectedTallas: boolean
  stockSucursales: VariantSucursalStockInput[]
  variantRows: VariantRow[]
  mediaByColor: Record<number, MediaItem[]>
  isAutoSkuEnabled: boolean
  isAutoBarcodeEnabled: boolean
  onAutoSkuToggle: (enabled: boolean) => void
  onAutoBarcodeToggle: (enabled: boolean) => void
  onVariantFieldChange: (
    key: string,
    field: VariantEditableField,
    value: string
  ) => void
  onApplyVariantFieldToAll: (
    field: "precio" | "precioMayor",
    value: string,
    variantKeys?: string[]
  ) => void
  onVariantSucursalStockChange: (
    key: string,
    idSucursal: number,
    value: string
  ) => void
  onApplyVariantSucursalStockToAll: (
    idSucursal: number,
    value: string,
    variantKeys?: string[]
  ) => void
  deletingVariantKeys: string[]
  onRemoveVariant: (key: string) => Promise<boolean> | boolean
  onSetVariantStatus: (key: string, status: VariantStatus) => void
}

interface CurrencyInputProps {
  value: string
  onChange: (nextValue: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

type VariantMatrixViewMode = "cards" | "table"

function hasPersistedVariantId(idProductoVariante?: number | null): idProductoVariante is number {
  return typeof idProductoVariante === "number" && idProductoVariante > 0
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function resolveContrastTextColor(hexColor: string): "#111827" | "#ffffff" {
  const clean = hexColor.replace("#", "")
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

  return luminance > 170 ? "#111827" : "#ffffff"
}

function VariantCombinationPreview({
  variant,
  colorImageUrl,
}: {
  variant: VariantRow
  colorImageUrl: string | null
}) {
  const colorHex = normalizeHexColor(variant.color.codigo)
  const iconColor = resolveContrastTextColor(colorHex)

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm"
        style={{ backgroundColor: colorHex }}
      >
        {colorImageUrl ? (
          <Image
            src={colorImageUrl}
            alt={variant.color.nombre}
            fill
            unoptimized
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <ShirtHangerIcon
            className="h-6 w-6"
            style={{ color: iconColor }}
            title={`Prenda ${variant.color.nombre} talla ${variant.talla.nombre}`}
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-bold uppercase leading-none text-foreground">
          {variant.color.nombre}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colorHex }}
          />
          Talla {variant.talla.nombre}
        </p>
      </div>
    </div>
  )
}

function getVariantCombinationLabel(variant: Pick<VariantRow, "color" | "talla">): string {
  return `${variant.color.nombre} Talla ${variant.talla.nombre}`
}

function toggleFilterId(current: number[], id: number): number[] {
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
}

function VariantInactiveOverlay({
  variant,
  onEnable,
}: {
  variant: VariantRow
  onEnable: () => void
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/72 p-4 text-center backdrop-blur-sm">
      <div className="max-w-[260px] space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Variante inactiva</p>
          <p className="text-xs text-muted-foreground">
            {getVariantCombinationLabel(variant)}
          </p>
        </div>

        <Button type="button" size="sm" className="w-full" onClick={onEnable}>
          Habilitar Variante
        </Button>
      </div>
    </div>
  )
}

function CurrencyInput({
  value,
  onChange,
  className,
  disabled,
  placeholder,
}: CurrencyInputProps) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
        S/
      </span>
      <Input
        type="number"
        min="0"
        step="0.01"
        className="pl-10"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function FieldLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      <span>{children}</span>
    </p>
  )
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatCompactPenAmount(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function getReadonlyOfferState(variant: VariantRow): EstadoVigenciaOferta {
  return obtenerEstadoVigenciaOferta({
    precio: variant.readonlyOffer?.precioBase ?? parseOptionalNumber(variant.precio),
    precioOferta: variant.readonlyOffer?.precioOferta ?? null,
    ofertaInicio: variant.readonlyOffer?.ofertaInicio,
    ofertaFin: variant.readonlyOffer?.ofertaFin,
  })
}

function getReadonlyOfferClass(offerState: EstadoVigenciaOferta): string {
  switch (offerState) {
    case "activa":
    case "indefinida":
      return "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300"
    case "programada":
      return "border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300"
    case "vencida":
    case "invalida":
      return "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
    default:
      return "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
  }
}

// ─── Accordion: Aplicar Stock por Sucursal ───────────────────────────────────

function StockSucursalAccordion({
  allSucursales,
  stockSucursales,
  selectedSucursalIds,
  disableBulkOptions,
  visibleActiveVariantKeys,
  onToggleSucursal,
  onSelectAllSucursales,
  onApplyVariantSucursalStockToAll,
}: {
  allSucursales: VariantSucursalStockInput[]
  stockSucursales: VariantSucursalStockInput[]
  selectedSucursalIds: number[]
  disableBulkOptions: boolean
  visibleActiveVariantKeys: string[]
  onToggleSucursal: (idSucursal: number) => void
  onSelectAllSucursales: () => void
  onApplyVariantSucursalStockToAll: (idSucursal: number, value: string, variantKeys?: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const allSelected = selectedSucursalIds.length === allSucursales.length

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-dashed bg-muted/20 dark:bg-muted/10">
      {/* Header con toggle */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/30 dark:hover:bg-muted/20"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Aplicar Stock por Sucursal
        </p>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Selector de sucursales — siempre visible */}
      {allSucursales.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t px-3 py-2">
          {/* Pill "Todas" */}
          <button
            type="button"
            onClick={onSelectAllSucursales}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
              allSelected
                ? "border-slate-400 bg-slate-100 text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                : "border-dashed border-slate-300 text-muted-foreground hover:border-slate-400 hover:text-foreground"
            )}
          >
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              allSelected ? "bg-slate-500 dark:bg-slate-300" : "bg-slate-300"
            )} />
            Todas
          </button>

          {/* Pills por sucursal */}
          {allSucursales.map((sucursal) => {
            const isSelected = selectedSucursalIds.includes(sucursal.idSucursal)
            const isAlmacen = sucursal.tipoSucursal === "ALMACEN"
            const PillIcon = isAlmacen ? Warehouse : Store
            return (
              <button
                key={sucursal.idSucursal}
                type="button"
                onClick={() => onToggleSucursal(sucursal.idSucursal)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  isSelected
                    ? isAlmacen
                      ? "border-amber-300 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                      : "border-blue-300 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    : "border-dashed border-slate-300 text-muted-foreground hover:border-slate-400 hover:text-foreground"
                )}
              >
                <PillIcon className="h-3 w-3 shrink-0" />
                {sucursal.nombreSucursal.replace(/^almacen\s+/i, "Alm. ")}
              </button>
            )
          })}
        </div>
      )}

      {/* Inputs bulk — colapsables */}
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "opacity-100" : "max-h-0 opacity-0"
        )}
        style={open ? { maxHeight: contentRef.current?.scrollHeight ?? 9999 } : { maxHeight: 0 }}
      >
        <div className="grid gap-3 px-3 pb-3 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {stockSucursales.map((sucursal) => (
            <div key={sucursal.idSucursal} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-foreground">
                {sucursal.nombreSucursal}
              </p>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                disabled={disableBulkOptions}
                onChange={(event) =>
                  onApplyVariantSucursalStockToAll(
                    sucursal.idSucursal,
                    event.target.value,
                    visibleActiveVariantKeys
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductoVariantMatrixCard({
  hasSelectedColors,
  hasSelectedTallas,
  stockSucursales,
  variantRows,
  mediaByColor,
  isAutoSkuEnabled,
  isAutoBarcodeEnabled,
  onAutoSkuToggle,
  onAutoBarcodeToggle,
  onVariantFieldChange,
  onApplyVariantFieldToAll,
  onVariantSucursalStockChange,
  onApplyVariantSucursalStockToAll,
  deletingVariantKeys,
  onRemoveVariant,
  onSetVariantStatus,
}: ProductoVariantMatrixCardProps) {
  const hasAttributeSelection = hasSelectedColors && hasSelectedTallas
  const [deleteTargetKey, setDeleteTargetKey] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<VariantMatrixViewMode>("cards")
  const [filteredTallaIds, setFilteredTallaIds] = useState<number[]>([])
  const [filteredColorIds, setFilteredColorIds] = useState<number[]>([])
  const [selectedSucursalIds, setSelectedSucursalIds] = useState<number[]>(
    () => stockSucursales.map((s) => s.idSucursal)
  )

  const handleToggleSucursal = useCallback((idSucursal: number) => {
    setSelectedSucursalIds((prev) => {
      if (prev.includes(idSucursal)) {
        // No deseleccionar si es la única seleccionada
        if (prev.length === 1) return prev
        return prev.filter((id) => id !== idSucursal)
      }
      return [...prev, idSucursal]
    })
  }, [])

  const handleSelectAllSucursales = useCallback(() => {
    setSelectedSucursalIds(stockSucursales.map((s) => s.idSucursal))
  }, [stockSucursales])

  const effectiveStockSucursales = useMemo(
    () => stockSucursales.filter((s) => selectedSucursalIds.includes(s.idSucursal)),
    [stockSucursales, selectedSucursalIds]
  )

  const tallaFilterOptions = useMemo(() => {
    const seen = new Set<number>()

    return variantRows.filter((variant) => {
      if (seen.has(variant.talla.idTalla)) return false
      seen.add(variant.talla.idTalla)
      return true
    })
  }, [variantRows])

  const colorFilterOptions = useMemo(() => {
    const seen = new Set<number>()

    return variantRows.filter((variant) => {
      if (seen.has(variant.color.idColor)) return false
      seen.add(variant.color.idColor)
      return true
    })
  }, [variantRows])

  const effectiveFilteredTallaIds = useMemo(() => {
    const availableTallaIds = new Set(tallaFilterOptions.map((variant) => variant.talla.idTalla))
    return filteredTallaIds.filter((id) => availableTallaIds.has(id))
  }, [filteredTallaIds, tallaFilterOptions])

  const effectiveFilteredColorIds = useMemo(() => {
    const availableColorIds = new Set(colorFilterOptions.map((variant) => variant.color.idColor))
    return filteredColorIds.filter((id) => availableColorIds.has(id))
  }, [colorFilterOptions, filteredColorIds])

  const visibleVariantRows = useMemo(() => {
    const tallaFilterSet = new Set(effectiveFilteredTallaIds)
    const colorFilterSet = new Set(effectiveFilteredColorIds)

    return variantRows.filter((variant) => {
      const matchesTalla =
        tallaFilterSet.size === 0 || tallaFilterSet.has(variant.talla.idTalla)
      const matchesColor =
        colorFilterSet.size === 0 || colorFilterSet.has(variant.color.idColor)

      return matchesTalla && matchesColor
    })
  }, [effectiveFilteredColorIds, effectiveFilteredTallaIds, variantRows])

  const visibleActiveVariantKeys = useMemo(
    () =>
      visibleVariantRows
        .filter((variant) => variant.estado === "ACTIVO")
        .map((variant) => variant.key),
    [visibleVariantRows]
  )

  const hasQuickFiltersActive =
    effectiveFilteredTallaIds.length > 0 || effectiveFilteredColorIds.length > 0
  const disableBulkOptions = !hasAttributeSelection || visibleActiveVariantKeys.length === 0

  const deleteTarget = useMemo(
    () =>
      deleteTargetKey
        ? variantRows.find((variant) => variant.key === deleteTargetKey) ?? null
        : null,
    [deleteTargetKey, variantRows]
  )

  const isDeletingTarget =
    !!deleteTarget?.key && deletingVariantKeys.includes(deleteTarget.key)

  const handleDeleteIntent = (variant: VariantRow) => {
    if (hasPersistedVariantId(variant.idProductoVariante)) {
      setDeleteTargetKey(variant.key)
      return
    }

    onSetVariantStatus(variant.key, "INACTIVO")
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && !isDeletingTarget) {
      setDeleteTargetKey(null)
    }
  }

  const handleConfirmDelete = async (key: string): Promise<boolean> => {
    const success = await onRemoveVariant(key)
    if (success) {
      setDeleteTargetKey(null)
    }
    return success
  }

  return (
    <Card className="gap-0 border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Squares2X2Icon className="h-5 w-5 text-blue-600" />
            Matriz de Variantes
          </CardTitle>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {visibleVariantRows.length === variantRows.length
                ? `${variantRows.length} combinaciones`
                : `${visibleVariantRows.length} de ${variantRows.length} combinaciones`}
            </span>
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as VariantMatrixViewMode)}
            >
              <TabsList className="h-10 rounded-full border bg-background p-1">
                <TabsTrigger
                  value="cards"
                  className="h-8 w-8 rounded-full p-0 data-[state=active]:shadow-sm"
                  title="Vista por tarjetas"
                  aria-label="Vista por tarjetas"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="h-8 w-8 rounded-full p-0 data-[state=active]:shadow-sm"
                  title="Vista por tabla"
                  aria-label="Vista por tabla"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1">
              <span className="text-xs font-semibold text-muted-foreground">
                SKU automatico
              </span>
              <Switch
                checked={isAutoSkuEnabled}
                onCheckedChange={onAutoSkuToggle}
                aria-label="Activar SKU automatico"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Código de barras automatico
              </span>
              <Switch
                checked={isAutoBarcodeEnabled}
                onCheckedChange={onAutoBarcodeToggle}
                aria-label="Activar código de barras automatico"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pt-6">
        <div
          className="mb-4 grid gap-3 rounded-lg border border-dashed bg-muted/20 p-3 md:grid-cols-2"
        >
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aplicar Precio a Todas
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 49.90"
              disabled={disableBulkOptions}
              onChange={(event) =>
                onApplyVariantFieldToAll("precio", event.target.value, visibleActiveVariantKeys)
              }
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aplicar Precio Mayor
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 39.90"
              disabled={disableBulkOptions}
              onChange={(event) =>
                onApplyVariantFieldToAll(
                  "precioMayor",
                  event.target.value,
                  visibleActiveVariantKeys
                )
              }
            />
          </div>

        </div>

        {stockSucursales.length > 0 ? (
          <StockSucursalAccordion
            allSucursales={stockSucursales}
            stockSucursales={effectiveStockSucursales}
            selectedSucursalIds={selectedSucursalIds}
            disableBulkOptions={disableBulkOptions}
            visibleActiveVariantKeys={visibleActiveVariantKeys}
            onToggleSucursal={handleToggleSucursal}
            onSelectAllSucursales={handleSelectAllSucursales}
            onApplyVariantSucursalStockToAll={onApplyVariantSucursalStockToAll}
          />
        ) : null}

        {variantRows.length > 0 ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border bg-background px-4 py-3 shadow-sm">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tallas
              </span>
              {tallaFilterOptions.map((variant) => {
                const isActive = effectiveFilteredTallaIds.includes(variant.talla.idTalla)
                return (
                  <button
                    key={`filter-talla-${variant.talla.idTalla}`}
                    type="button"
                    onClick={() =>
                      setFilteredTallaIds((previous) =>
                        toggleFilterId(previous, variant.talla.idTalla)
                      )
                    }
                    className={cn(
                      "min-w-10 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        : hasQuickFiltersActive
                          ? "border-border bg-background text-muted-foreground hover:bg-muted"
                          : "border-border bg-background text-foreground hover:bg-muted"
                    )}
                    aria-pressed={isActive}
                  >
                    {variant.talla.nombre}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Colores
              </span>
              {colorFilterOptions.map((variant) => {
                const isActive = effectiveFilteredColorIds.includes(variant.color.idColor)
                return (
                  <button
                    key={`filter-color-${variant.color.idColor}`}
                    type="button"
                    title={variant.color.nombre}
                    onClick={() =>
                      setFilteredColorIds((previous) =>
                        toggleFilterId(previous, variant.color.idColor)
                      )
                    }
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all",
                      isActive
                        ? "scale-105 border-slate-900 shadow-sm dark:border-slate-100"
                        : hasQuickFiltersActive
                          ? "border-border opacity-55 hover:opacity-100"
                          : "border-border hover:scale-105"
                    )}
                    style={{ backgroundColor: normalizeHexColor(variant.color.codigo) }}
                    aria-label={`Filtrar por color ${variant.color.nombre}`}
                    aria-pressed={isActive}
                  >
                    <span className="sr-only">{variant.color.nombre}</span>
                  </button>
                )
              })}
              {hasQuickFiltersActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setFilteredTallaIds([])
                    setFilteredColorIds([])
                  }}
                >
                  Limpiar
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {variantRows.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Image
                src="/img/ProductoVariantes.svg"
                alt="Ilustracion de matriz de variantes vacia"
                width={340}
                height={170}
                className="h-auto w-full max-w-[340px]"
                priority={false}
              />
              <p className="text-sm text-muted-foreground">
                {hasAttributeSelection
                  ? "No hay variantes configuradas todavia. Ajusta colores o tallas para volver a generar la matriz."
                  : "Selecciona al menos un color y una talla para generar automaticamente la matriz de variantes."}
              </p>
            </div>
          </div>
        ) : visibleVariantRows.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Ninguna variante coincide con los filtros rapidos actuales.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajusta tallas o colores para volver a mostrar las combinaciones.
            </p>
          </div>
        ) : (
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as VariantMatrixViewMode)}
            className="space-y-0"
          >
            <TabsContent value="cards">
              <div className="grid gap-3 md:grid-cols-2">
                {visibleVariantRows.map((variant) => {
                  const isInactiveVariant = variant.estado === "INACTIVO"
                  const isDeletingVariant = deletingVariantKeys.includes(variant.key)
                  const offerState = variant.readonlyOffer
                    ? getReadonlyOfferState(variant)
                    : null
                  const offerPrice = variant.readonlyOffer?.precioOferta ?? null
                  const offerBadgeValue =
                    offerPrice !== null ? formatCompactPenAmount(offerPrice) : null
                  const offerSummaryTitle =
                    variant.readonlyOffer && offerState
                      ? [
                          "Precio oferta",
                          offerPrice !== null ? formatCompactPenAmount(offerPrice) : null,
                          `Vigencia: ${formatearRangoOferta(
                            variant.readonlyOffer.ofertaInicio,
                            variant.readonlyOffer.ofertaFin
                          )}`,
                        ]
                          .filter(Boolean)
                          .join(" | ")
                      : ""

                  return (
                    <article
                      key={variant.key}
                      className={cn(
                        "relative overflow-hidden rounded-[24px] border bg-background shadow-sm transition",
                        isInactiveVariant && "border-dashed border-slate-300"
                      )}
                    >
                      <div
                        className={cn(
                          "transition",
                          isInactiveVariant && "pointer-events-none select-none blur-[2px] opacity-35"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
                          <VariantCombinationPreview
                            variant={variant}
                            colorImageUrl={mediaByColor[variant.color.idColor]?.[0]?.previewUrl ?? null}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={!hasAttributeSelection || isInactiveVariant || isDeletingVariant}
                            onClick={() => handleDeleteIntent(variant)}
                            aria-label={`Desactivar variante ${variant.color.nombre}/${variant.talla.nombre}`}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            {isDeletingVariant ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="space-y-4 px-4 py-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1.5">
                              <FieldLabel icon={<TagIcon className="h-3.5 w-3.5" />}>
                                SKU *
                              </FieldLabel>
                              <Input
                                type="text"
                                value={variant.sku}
                                placeholder={`${variant.color.nombre}-${variant.talla.nombre}`}
                                onChange={(event) =>
                                  onVariantFieldChange(variant.key, "sku", event.target.value)
                                }
                                disabled={isInactiveVariant || isDeletingVariant || isAutoSkuEnabled}
                              />
                              {isAutoSkuEnabled ? (
                                <p className="text-[11px] text-muted-foreground">
                                  Generado auto.
                                </p>
                              ) : null}
                            </div>

                            <div className="space-y-1.5">
                              <FieldLabel icon={<Barcode className="h-3.5 w-3.5" />}>
                                Cod. barras
                              </FieldLabel>
                              <div className="relative">
                                <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="text"
                                  className="pl-10"
                                  value={variant.codigoBarras}
                                  placeholder="7501234567890"
                                  onChange={(event) =>
                                    onVariantFieldChange(variant.key, "codigoBarras", event.target.value)
                                  }
                                  disabled={isInactiveVariant || isDeletingVariant || isAutoBarcodeEnabled}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 border-t pt-4">
                            <FieldLabel>Stock por sucursal</FieldLabel>
                            <ProductoVariantStockEditor
                              sucursales={effectiveStockSucursales}
                              values={variant.stocksSucursales}
                              totalStock={variant.stock}
                              disabled={isInactiveVariant || isDeletingVariant}
                              onChange={(idSucursal, value) =>
                                onVariantSucursalStockChange(
                                  variant.key,
                                  idSucursal,
                                  value
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                              <FieldLabel>Precio reg.</FieldLabel>
                              <CurrencyInput
                                value={variant.precio}
                                placeholder="0.00"
                                onChange={(nextValue) =>
                                  onVariantFieldChange(variant.key, "precio", nextValue)
                                }
                                disabled={isInactiveVariant || isDeletingVariant}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <FieldLabel>Precio mayor</FieldLabel>
                              <CurrencyInput
                                value={variant.precioMayor}
                                placeholder="0.00"
                                onChange={(nextValue) =>
                                  onVariantFieldChange(variant.key, "precioMayor", nextValue)
                                }
                                disabled={isInactiveVariant || isDeletingVariant}
                              />
                            </div>
                          </div>
                        </div>

                        {variant.readonlyOffer && offerState && (
                          <div
                            className={cn(
                              "mt-3 flex items-center justify-between gap-2 rounded-xl border p-2 text-xs",
                              getReadonlyOfferClass(offerState)
                            )}
                            title={offerSummaryTitle}
                          >
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 font-semibold text-current shadow-sm">
                              <TagIcon className="h-4 w-4" />
                              Oferta {offerBadgeValue}
                            </span>
                            <Link
                              href="/productos/ofertas"
                              title="Ir a Ofertas"
                              className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 font-semibold text-current shadow-sm transition-colors hover:bg-background"
                            >
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              Ir a ofertas
                            </Link>
                          </div>
                        )}
                      </div>

                      {isInactiveVariant ? (
                        <VariantInactiveOverlay
                          variant={variant}
                          onEnable={() => onSetVariantStatus(variant.key, "ACTIVO")}
                        />
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="table">
              <div className="overflow-x-auto rounded-[22px] border bg-background shadow-sm">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead className="bg-muted/35">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Variante
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        SKU & Codigo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Stock por sucursal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Precios
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleVariantRows.map((variant) => {
                      const isInactiveVariant = variant.estado === "INACTIVO"
                      const isDeletingVariant = deletingVariantKeys.includes(variant.key)

                      return (
                        <tr
                          key={variant.key}
                          className={cn(
                            "border-b align-top last:border-b-0",
                            isInactiveVariant && "bg-slate-50/30 dark:bg-slate-900/20"
                          )}
                        >
                          <td className="px-4 py-4">
                            <div
                              className={cn(
                                "min-w-[180px] transition",
                                isInactiveVariant &&
                                  "pointer-events-none select-none blur-[2px] opacity-35"
                              )}
                            >
                              <VariantCombinationPreview
                                variant={variant}
                                colorImageUrl={mediaByColor[variant.color.idColor]?.[0]?.previewUrl ?? null}
                              />
                            </div>
                            {isInactiveVariant ? (
                              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-background/80 px-3 py-2 text-xs">
                                <p className="font-semibold text-foreground">Variante inactiva</p>
                                <p className="text-muted-foreground">
                                  {getVariantCombinationLabel(variant)}
                                </p>
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className={cn(
                                "min-w-[240px] space-y-2 transition",
                                isInactiveVariant &&
                                  "pointer-events-none select-none blur-[2px] opacity-35"
                              )}
                            >
                              <Input
                                type="text"
                                value={variant.sku}
                                placeholder={`${variant.color.nombre}-${variant.talla.nombre}`}
                                onChange={(event) =>
                                  onVariantFieldChange(variant.key, "sku", event.target.value)
                                }
                                disabled={isInactiveVariant || isDeletingVariant || isAutoSkuEnabled}
                              />
                              <Input
                                type="text"
                                value={variant.codigoBarras}
                                placeholder="7501234567890"
                                onChange={(event) =>
                                  onVariantFieldChange(variant.key, "codigoBarras", event.target.value)
                                }
                                disabled={isInactiveVariant || isDeletingVariant || isAutoBarcodeEnabled}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className={cn(
                                "min-w-[230px] transition",
                                isInactiveVariant &&
                                  "pointer-events-none select-none blur-[2px] opacity-35"
                              )}
                            >
                              <ProductoVariantStockEditor
                                sucursales={effectiveStockSucursales}
                                values={variant.stocksSucursales}
                                totalStock={variant.stock}
                                compact
                                disabled={isInactiveVariant || isDeletingVariant}
                                onChange={(idSucursal, value) =>
                                  onVariantSucursalStockChange(
                                    variant.key,
                                    idSucursal,
                                    value
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className={cn(
                                "min-w-[150px] space-y-2 transition",
                                isInactiveVariant &&
                                  "pointer-events-none select-none blur-[2px] opacity-35"
                              )}
                            >
                              <CurrencyInput
                                value={variant.precio}
                                placeholder="Reg."
                                onChange={(nextValue) =>
                                  onVariantFieldChange(variant.key, "precio", nextValue)
                                }
                                disabled={isInactiveVariant || isDeletingVariant}
                              />
                              <CurrencyInput
                                value={variant.precioMayor}
                                placeholder="Mayor"
                                onChange={(nextValue) =>
                                  onVariantFieldChange(variant.key, "precioMayor", nextValue)
                                }
                                disabled={isInactiveVariant || isDeletingVariant}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {isInactiveVariant ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => onSetVariantStatus(variant.key, "ACTIVO")}
                              >
                                Habilitar
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={!hasAttributeSelection || isDeletingVariant}
                                onClick={() => handleDeleteIntent(variant)}
                                aria-label={`Desactivar variante ${variant.color.nombre}/${variant.talla.nombre}`}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                {isDeletingVariant ? (
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <ProductoVariantDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        deletingVariantKeys={deletingVariantKeys}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirmDelete={handleConfirmDelete}
      />
    </Card>
  )
}
