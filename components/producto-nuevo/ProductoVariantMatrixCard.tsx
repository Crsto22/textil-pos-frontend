"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ListBulletIcon,
  Squares2X2Icon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { ShirtHangerIcon } from "@/components/icons/ShirtHangerIcon"
import { ProductoVariantDeleteDialog } from "@/components/producto-nuevo/modals/ProductoVariantDeleteDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MediaItem, VariantEditableField, VariantRow } from "@/lib/types/producto-create"
import {
  formatearRangoOferta,
  obtenerEstadoVigenciaOferta,
  type EstadoVigenciaOferta,
} from "@/lib/oferta-utils"
import { cn } from "@/lib/utils"

interface ProductoVariantMatrixCardProps {
  hasSelectedColors: boolean
  hasSelectedTallas: boolean
  mediaByColor: Record<number, MediaItem[]>
  variantRows: VariantRow[]
  isAutoSkuEnabled: boolean
  onAutoSkuToggle: (enabled: boolean) => void
  onVariantFieldChange: (
    key: string,
    field: VariantEditableField,
    value: string
  ) => void
  onApplyVariantFieldToAll: (
    field: "precio" | "precioMayor" | "stock",
    value: string
  ) => void
  deletingVariantKeys: string[]
  onRemoveVariant: (key: string) => Promise<boolean> | boolean
}

interface CurrencyInputProps {
  value: string
  onChange: (nextValue: string) => void
  className?: string
  disabled?: boolean
}

type VariantMatrixViewMode = "cards" | "table"

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
  imageUrl,
}: {
  variant: VariantRow
  imageUrl: string | null
}) {
  const colorHex = normalizeHexColor(variant.color.codigo)
  const tallaColor = resolveContrastTextColor(colorHex)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md border bg-muted/20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Prenda ${variant.color.nombre} talla ${variant.talla.nombre}`}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <>
            <ShirtHangerIcon
              className="h-full w-full drop-shadow-sm"
              style={{ color: colorHex }}
              title={`Prenda ${variant.color.nombre} talla ${variant.talla.nombre}`}
            />
            <span
              className="pointer-events-none absolute left-1/2 top-[61%] -translate-x-1/2 -translate-y-1/2 text-[13px] font-black leading-none tracking-tight"
              style={{ color: tallaColor }}
            >
              {variant.talla.nombre}
            </span>
          </>
        )}

        {imageUrl ? (
          <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {variant.talla.nombre}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{variant.color.nombre}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-black/15"
            style={{ backgroundColor: colorHex }}
          />
          Talla {variant.talla.nombre}
        </p>
      </div>
    </div>
  )
}

function CurrencyInput({ value, onChange, className, disabled }: CurrencyInputProps) {
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
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
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

export function ProductoVariantMatrixCard({
  hasSelectedColors,
  hasSelectedTallas,
  mediaByColor,
  variantRows,
  isAutoSkuEnabled,
  onAutoSkuToggle,
  onVariantFieldChange,
  onApplyVariantFieldToAll,
  deletingVariantKeys,
  onRemoveVariant,
}: ProductoVariantMatrixCardProps) {
  const hasAttributeSelection = hasSelectedColors && hasSelectedTallas
  const disableBulkOptions = !hasAttributeSelection || variantRows.length === 0
  const [deleteTargetKey, setDeleteTargetKey] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<VariantMatrixViewMode>("cards")

  const deleteTarget = useMemo(
    () =>
      deleteTargetKey
        ? variantRows.find((variant) => variant.key === deleteTargetKey) ?? null
        : null,
    [deleteTargetKey, variantRows]
  )

  const isDeletingTarget =
    !!deleteTarget?.key && deletingVariantKeys.includes(deleteTarget.key)

  const handleOpenDeleteDialog = (variant: VariantRow) => {
    setDeleteTargetKey(variant.key)
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
    <Card className="gap-0">
      <CardHeader className="border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Squares2X2Icon className="h-5 w-5 text-blue-600" />
            Matriz de Variantes
          </CardTitle>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {variantRows.length} combinaciones
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div
          className="mb-4 grid gap-3 rounded-lg border border-dashed bg-muted/20 p-3 md:grid-cols-3"
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
                onApplyVariantFieldToAll("precio", event.target.value)
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
                onApplyVariantFieldToAll("precioMayor", event.target.value)
              }
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aplicar Stock a Todas
            </p>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Ej. 20"
              disabled={disableBulkOptions}
              onChange={(event) =>
                onApplyVariantFieldToAll("stock", event.target.value)
              }
            />
          </div>
        </div>

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
                  ? "No hay variantes activas. Ajusta colores o tallas para volver a generarlas."
                  : "Selecciona al menos un color y una talla para generar automaticamente la matriz de variantes."}
              </p>
            </div>
          </div>
        ) : (
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as VariantMatrixViewMode)}
            className="space-y-0"
          >
            <TabsContent value="cards">
              <div className="grid gap-3 md:grid-cols-2">
                {variantRows.map((variant) => {
                  const isDeletingVariant = deletingVariantKeys.includes(variant.key)
                  const variantImageUrl =
                    mediaByColor[variant.color.idColor]?.[0]?.previewUrl ?? null
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
                      className="rounded-xl border bg-background p-4 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <VariantCombinationPreview
                          variant={variant}
                          imageUrl={variantImageUrl}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={!hasAttributeSelection || isDeletingVariant}
                          onClick={() => handleOpenDeleteDialog(variant)}
                          aria-label={`Eliminar variante ${variant.color.nombre}/${variant.talla.nombre}`}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {isDeletingVariant ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              SKU *
                            </p>
                            <Input
                              type="text"
                              value={variant.sku}
                              placeholder={`${variant.color.nombre}-${variant.talla.nombre}`}
                              onChange={(event) =>
                                onVariantFieldChange(variant.key, "sku", event.target.value)
                              }
                              disabled={isDeletingVariant || isAutoSkuEnabled}
                            />
                            {isAutoSkuEnabled ? (
                              <p className="text-[11px] text-muted-foreground">
                                Generado automaticamente
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Stock
                            </p>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.stock}
                              onChange={(event) =>
                                onVariantFieldChange(variant.key, "stock", event.target.value)
                              }
                              disabled={isDeletingVariant}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Precio Regular
                            </p>
                            <CurrencyInput
                              value={variant.precio}
                              onChange={(nextValue) =>
                                onVariantFieldChange(variant.key, "precio", nextValue)
                              }
                              disabled={isDeletingVariant}
                            />
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Precio Mayor
                            </p>
                            <CurrencyInput
                              value={variant.precioMayor}
                              onChange={(nextValue) =>
                                onVariantFieldChange(variant.key, "precioMayor", nextValue)
                              }
                              disabled={isDeletingVariant}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Opcional
                            </p>
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
                    </article>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="table">
              <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="min-w-[1080px] w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Variante
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Precio Mayor
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.map((variant) => {
                      const isDeletingVariant = deletingVariantKeys.includes(variant.key)
                      const variantImageUrl =
                        mediaByColor[variant.color.idColor]?.[0]?.previewUrl ?? null

                      return (
                        <tr key={variant.key} className="border-b align-top last:border-b-0">
                          <td className="px-4 py-4">
                            <div className="min-w-[220px]">
                              <VariantCombinationPreview
                                variant={variant}
                                imageUrl={variantImageUrl}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-[220px] space-y-1">
                              <Input
                                type="text"
                                value={variant.sku}
                                placeholder={`${variant.color.nombre}-${variant.talla.nombre}`}
                                onChange={(event) =>
                                  onVariantFieldChange(variant.key, "sku", event.target.value)
                                }
                                disabled={isDeletingVariant || isAutoSkuEnabled}
                              />
                              {isAutoSkuEnabled ? (
                                <p className="text-[11px] text-muted-foreground">
                                  Generado automaticamente
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-[120px]">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={variant.stock}
                                onChange={(event) =>
                                  onVariantFieldChange(variant.key, "stock", event.target.value)
                                }
                                disabled={isDeletingVariant}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-[150px]">
                              <CurrencyInput
                                value={variant.precio}
                                onChange={(nextValue) =>
                                  onVariantFieldChange(variant.key, "precio", nextValue)
                                }
                                disabled={isDeletingVariant}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-[150px] space-y-1">
                              <CurrencyInput
                                value={variant.precioMayor}
                                onChange={(nextValue) =>
                                  onVariantFieldChange(variant.key, "precioMayor", nextValue)
                                }
                                disabled={isDeletingVariant}
                              />
                              <p className="text-[11px] text-muted-foreground">Opcional</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={!hasAttributeSelection || isDeletingVariant}
                              onClick={() => handleOpenDeleteDialog(variant)}
                              aria-label={`Eliminar variante ${variant.color.nombre}/${variant.talla.nombre}`}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              {isDeletingVariant ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </Button>
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
