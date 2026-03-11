"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ArrowPathIcon, Squares2X2Icon, TrashIcon } from "@heroicons/react/24/outline"

import { ShirtHangerIcon } from "@/components/icons/ShirtHangerIcon"
import { ProductoVariantDeleteDialog } from "@/components/producto-nuevo/modals/ProductoVariantDeleteDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  formatearRangoOferta,
  obtenerEstadoVigenciaOferta,
  type EstadoVigenciaOferta,
} from "@/lib/oferta-utils"
import type { VariantRow, VariantValues } from "@/lib/types/producto-create"
import { cn } from "@/lib/utils"

interface ProductoVariantMatrixCardProps {
  hasSelectedColors: boolean
  hasSelectedTallas: boolean
  variantRows: VariantRow[]
  offersEnabled: boolean
  onVariantFieldChange: (
    key: string,
    field: keyof VariantValues,
    value: string
  ) => void
  onApplyVariantFieldToAll: (field: keyof VariantValues, value: string) => void
  onOffersEnabledChange: (enabled: boolean) => void
  deletingVariantKeys: string[]
  onRemoveVariant: (key: string) => Promise<boolean> | boolean
}

interface CurrencyInputProps {
  value: string
  onChange: (nextValue: string) => void
  className?: string
  disabled?: boolean
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

function VariantCombinationPreview({ variant }: { variant: VariantRow }) {
  const colorHex = normalizeHexColor(variant.color.codigo)
  const tallaColor = resolveContrastTextColor(colorHex)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-14 shrink-0">
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

function getOfferState(variant: VariantRow): EstadoVigenciaOferta {
  return obtenerEstadoVigenciaOferta({
    precio: parseOptionalNumber(variant.precio),
    precioOferta: parseOptionalNumber(variant.precioOferta),
    ofertaInicio: variant.ofertaInicio,
    ofertaFin: variant.ofertaFin,
  })
}

function getOfferStateCopy(variant: VariantRow): string | null {
  const offerState = getOfferState(variant)

  switch (offerState) {
    case "indefinida":
      return "Oferta indefinida"
    case "activa":
      return `Oferta vigente: ${formatearRangoOferta(variant.ofertaInicio, variant.ofertaFin)}`
    case "programada":
      return `Oferta programada: ${formatearRangoOferta(variant.ofertaInicio, variant.ofertaFin)}`
    case "vencida":
      return `Oferta vencida: ${formatearRangoOferta(variant.ofertaInicio, variant.ofertaFin)}`
    case "invalida":
      return "Revise el rango de fechas de la oferta"
    default:
      return null
  }
}

function getOfferStateClass(offerState: EstadoVigenciaOferta): string {
  switch (offerState) {
    case "activa":
    case "indefinida":
      return "text-emerald-600 dark:text-emerald-400"
    case "programada":
      return "text-amber-600 dark:text-amber-400"
    case "vencida":
    case "invalida":
      return "text-slate-500 dark:text-slate-400"
    default:
      return "text-slate-500 dark:text-slate-400"
  }
}

export function ProductoVariantMatrixCard({
  hasSelectedColors,
  hasSelectedTallas,
  variantRows,
  offersEnabled,
  onVariantFieldChange,
  onApplyVariantFieldToAll,
  onOffersEnabledChange,
  deletingVariantKeys,
  onRemoveVariant,
}: ProductoVariantMatrixCardProps) {
  const hasAttributeSelection = hasSelectedColors && hasSelectedTallas
  const disableBulkOptions = !hasAttributeSelection || variantRows.length === 0
  const [deleteTargetKey, setDeleteTargetKey] = useState<string | null>(null)

  const deleteTarget = useMemo(
    () =>
      deleteTargetKey
        ? variantRows.find((variant) => variant.key === deleteTargetKey) ?? null
        : null,
    [deleteTargetKey, variantRows]
  )

  const isDeletingTarget =
    !!deleteTarget?.key && deletingVariantKeys.includes(deleteTarget.key)

  const handlePrecioOfertaChange = (key: string, value: string) => {
    onVariantFieldChange(key, "precioOferta", value)
  }

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

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {variantRows.length} combinaciones
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div
          className={cn(
            "mb-4 grid gap-3 rounded-lg border border-dashed bg-muted/20 p-3",
            offersEnabled ? "md:grid-cols-4" : "md:grid-cols-3"
          )}
        >
          <div className="rounded-lg border bg-background/80 p-3">
            <div className="flex h-full items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activar Ofertas
                </p>
              </div>
              <Switch
                checked={offersEnabled}
                onCheckedChange={onOffersEnabledChange}
                disabled={disableBulkOptions}
              />
            </div>
          </div>

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
          <div className="grid gap-3 md:grid-cols-2">
            {variantRows.map((variant) => {
              const isDeletingVariant = deletingVariantKeys.includes(variant.key)
              const hasOfferPrice = variant.precioOferta.trim() !== ""
              const offerState = getOfferState(variant)
              const offerStateCopy = getOfferStateCopy(variant)

              return (
                <article
                  key={variant.key}
                  className="rounded-xl border bg-background p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <VariantCombinationPreview variant={variant} />
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

                  <div
                    className={cn(
                      "grid gap-3 sm:grid-cols-2",
                      offersEnabled && "xl:grid-cols-3"
                    )}
                  >
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
                        disabled={isDeletingVariant}
                      />
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

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Precio
                      </p>
                      <CurrencyInput
                        value={variant.precio}
                        onChange={(nextValue) =>
                          onVariantFieldChange(variant.key, "precio", nextValue)
                        }
                        disabled={isDeletingVariant}
                      />
                    </div>

                    {offersEnabled ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Precio Oferta
                          </p>
                          <CurrencyInput
                            value={variant.precioOferta}
                            disabled={isDeletingVariant}
                            onChange={(nextValue) =>
                              handlePrecioOfertaChange(variant.key, nextValue)
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Oferta Inicio
                          </p>
                          <Input
                            type="datetime-local"
                            step="1"
                            value={variant.ofertaInicio}
                            disabled={isDeletingVariant || !hasOfferPrice}
                            onChange={(event) =>
                              onVariantFieldChange(
                                variant.key,
                                "ofertaInicio",
                                event.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Oferta Fin
                          </p>
                          <Input
                            type="datetime-local"
                            step="1"
                            value={variant.ofertaFin}
                            disabled={isDeletingVariant || !hasOfferPrice}
                            onChange={(event) =>
                              onVariantFieldChange(variant.key, "ofertaFin", event.target.value)
                            }
                          />
                        </div>
                      </>
                    ) : null}
                  </div>

                  {offersEnabled && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[11px] text-muted-foreground">
                        Si deja ambas fechas vacias, la oferta queda indefinida.
                      </p>
                      {offerStateCopy && (
                        <p
                          className={`text-[11px] font-semibold ${getOfferStateClass(offerState)}`}
                        >
                          {offerStateCopy}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
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
