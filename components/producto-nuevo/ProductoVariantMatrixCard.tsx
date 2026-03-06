"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  ListBulletIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { ShirtHangerIcon } from "@/components/icons/ShirtHangerIcon"
import { ProductoVariantDeleteDialog } from "@/components/producto-nuevo/modals/ProductoVariantDeleteDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { VariantRow, VariantValues } from "@/lib/types/producto-create"
import { cn } from "@/lib/utils"

interface ProductoVariantMatrixCardProps {
  hasSelectedColors: boolean
  hasSelectedTallas: boolean
  variantRows: VariantRow[]
  onVariantFieldChange: (
    key: string,
    field: keyof VariantValues,
    value: string
  ) => void
  onApplyVariantFieldToAll: (field: keyof VariantValues, value: string) => void
  onVariantOfferToggle: (key: string, enabled: boolean) => void
  onToggleOfferForAll: (enabled: boolean) => void
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

export function ProductoVariantMatrixCard({
  hasSelectedColors,
  hasSelectedTallas,
  variantRows,
  onVariantFieldChange,
  onApplyVariantFieldToAll,
  onVariantOfferToggle,
  onToggleOfferForAll,
  deletingVariantKeys,
  onRemoveVariant,
}: ProductoVariantMatrixCardProps) {
  const hasAttributeSelection = hasSelectedColors && hasSelectedTallas
  const disableBulkOptions = !hasAttributeSelection || variantRows.length === 0
  const [viewMode, setViewMode] = useState<"cards" | "table">("table")
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
    onVariantOfferToggle(key, value.trim() !== "")
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
            <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-muted/30 p-1">
              <button
                type="button"
                title="Vista tarjetas"
                aria-label="Vista tarjetas"
                aria-pressed={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                  viewMode === "cards"
                    ? "border-border bg-background text-foreground shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                type="button"
                title="Vista tabla"
                aria-label="Vista tabla"
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                  viewMode === "table"
                    ? "border-border bg-background text-foreground shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>

            <span className="rounded-md bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {variantRows.length} combinaciones
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-4 grid gap-3 rounded-lg border border-dashed bg-muted/20 p-3 md:grid-cols-3">
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
              Aplicar Oferta a Todas
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Opcional"
              disabled={disableBulkOptions}
              onChange={(event) => {
                const nextValue = event.target.value
                onToggleOfferForAll(nextValue.trim() !== "")
                onApplyVariantFieldToAll("precioOferta", nextValue)
              }}
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
        ) : viewMode === "table" ? (
          <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1140px] text-sm">
                <thead className="bg-muted/45">
                  <tr className="border-b">
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Combinacion
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      SKU *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Precio Oferta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variantRows.map((variant, index) => {
                    const isDeletingVariant = deletingVariantKeys.includes(variant.key)

                    return (
                      <tr
                        key={variant.key}
                        className="border-b align-top last:border-0 even:bg-muted/[0.08]"
                      >
                        <td className="px-3 py-3 text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <VariantCombinationPreview variant={variant} />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="text"
                            className="max-w-[230px]"
                            value={variant.sku}
                            placeholder={`${variant.color.nombre}-${variant.talla.nombre}`}
                            onChange={(event) =>
                              onVariantFieldChange(variant.key, "sku", event.target.value)
                            }
                            disabled={isDeletingVariant}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <CurrencyInput
                            value={variant.precio}
                            className="max-w-[160px]"
                            onChange={(nextValue) =>
                              onVariantFieldChange(variant.key, "precio", nextValue)
                            }
                            disabled={isDeletingVariant}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <CurrencyInput
                            value={variant.precioOferta}
                            className="max-w-[160px]"
                            onChange={(nextValue) =>
                              handlePrecioOfertaChange(variant.key, nextValue)
                            }
                            disabled={isDeletingVariant}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="max-w-[120px]"
                            value={variant.stock}
                            onChange={(event) =>
                              onVariantFieldChange(variant.key, "stock", event.target.value)
                            }
                            disabled={isDeletingVariant}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
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
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {variantRows.map((variant) => {
              const isDeletingVariant = deletingVariantKeys.includes(variant.key)

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

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Precio Oferta
                        </p>
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">Oferta</span>
                          <Switch
                            checked={variant.ofertaActiva}
                            onCheckedChange={(checked) =>
                              onVariantOfferToggle(variant.key, checked)
                            }
                            disabled={isDeletingVariant}
                          />
                        </div>
                      </div>
                      <CurrencyInput
                        value={variant.precioOferta}
                        disabled={!variant.ofertaActiva || isDeletingVariant}
                        onChange={(nextValue) =>
                          handlePrecioOfertaChange(variant.key, nextValue)
                        }
                      />
                    </div>
                  </div>
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
