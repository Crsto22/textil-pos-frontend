"use client"

import Image from "next/image"
import { PhotoIcon, PlusIcon, SwatchIcon } from "@heroicons/react/24/outline"

import type { Color } from "@/lib/types/color"
import type { Talla } from "@/lib/types/talla"
import { cn } from "@/lib/utils"

interface ProductoLabelPreviewProps {
  productName: string
  selectedColors: Color[]
  selectedTallas: Talla[]
  activeColorId: number | null
  previewImageUrl: string | null
  onOpenImages: () => void
  onOpenColors: () => void
  onOpenTallas: () => void
  onActiveColorChange: (idColor: number) => void
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

export function ProductoLabelPreview({
  productName,
  selectedColors,
  selectedTallas,
  activeColorId,
  previewImageUrl,
  onOpenImages,
  onOpenColors,
  onOpenTallas,
  onActiveColorChange,
}: ProductoLabelPreviewProps) {
  const displayName = productName.trim() || "PRODUCT NAME"

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onOpenImages}
        className="group block w-full rounded-[26px] border-0 bg-transparent p-0 text-left"
      >
        <div className="overflow-hidden rounded-[26px] bg-muted/40 shadow-sm dark:bg-muted/15">
          <div className="relative m-4 h-[220px] overflow-hidden rounded-[24px] bg-white/35 ring-1 ring-sky-400/60 dark:bg-slate-950/35 dark:ring-sky-500/40">
            {previewImageUrl ? (
              <Image
                src={previewImageUrl}
                alt={`Preview de ${displayName}`}
                fill
                unoptimized
                className="object-contain p-3"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <PhotoIcon className="h-14 w-14" />
                <span className="text-[15px] font-semibold uppercase tracking-[0.08em]">
                  {displayName}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-700 px-4 py-3 text-center text-[11px] font-semibold text-white transition-colors group-hover:bg-slate-800 dark:bg-slate-800 dark:group-hover:bg-slate-700">
            Haz clic para subir imagen
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenColors}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
        >
          <SwatchIcon className="h-4 w-4" />
          <span>Colores</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {selectedColors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenTallas}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Tallas</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {selectedTallas.length}
          </span>
        </button>
      </div>

      {selectedColors.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selectedColors.map((color) => {
            const isActive = color.idColor === activeColorId
            return (
              <button
                key={color.idColor}
                type="button"
                onClick={() => onActiveColorChange(color.idColor)}
                title={color.nombre}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105",
                  isActive
                    ? "bg-background ring-2 ring-slate-300 dark:ring-slate-700"
                    : "bg-background shadow-sm"
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: normalizeHexColor(color.codigo) }}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>
      )}

      {selectedTallas.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selectedTallas.map((talla) => (
            <span
              key={talla.idTalla}
              className="inline-flex min-w-11 items-center justify-center rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
            >
              {talla.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
