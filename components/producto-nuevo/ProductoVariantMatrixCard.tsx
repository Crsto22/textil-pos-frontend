"use client"

import Image from "next/image"
import { Squares2X2Icon, TrashIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { VariantRow, VariantValues } from "@/lib/types/producto-create"

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
  onRemoveVariant: (key: string) => void
}

export function ProductoVariantMatrixCard({
  hasSelectedColors,
  hasSelectedTallas,
  variantRows,
  onVariantFieldChange,
  onApplyVariantFieldToAll,
  onRemoveVariant,
}: ProductoVariantMatrixCardProps) {
  const hasAttributeSelection = hasSelectedColors && hasSelectedTallas
  const disableBulkOptions = !hasAttributeSelection || variantRows.length === 0

  return (
    <Card className="gap-0">
      <CardHeader className="border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Squares2X2Icon className="h-5 w-5 text-blue-600" />
            Matriz de Variantes
          </CardTitle>
          <span className="rounded-md bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {variantRows.length} combinaciones
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-4 grid gap-3 rounded-lg border border-dashed bg-muted/20 p-3 md:grid-cols-2">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Combinacion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Precio ($)
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
                {variantRows.map((variant) => (
                  <tr key={variant.key} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{variant.color.nombre}</span>
                      <span className="px-2 text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{variant.talla.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="max-w-[150px]"
                        value={variant.precio}
                        onChange={(event) =>
                          onVariantFieldChange(variant.key, "precio", event.target.value)
                        }
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
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={!hasAttributeSelection}
                        onClick={() => onRemoveVariant(variant.key)}
                        aria-label={`Eliminar variante ${variant.color.nombre}/${variant.talla.nombre}`}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
