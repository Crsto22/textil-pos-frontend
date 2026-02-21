"use client"

import Image from "next/image"
import { PhotoIcon } from "@heroicons/react/24/outline"

import type { Color } from "@/lib/types/color"
import { cn } from "@/lib/utils"

interface ProductoLabelPreviewProps {
  productName: string
  selectedColors: Color[]
  activeColorId: number | null
  previewImageUrl: string | null
  onOpenImages: () => void
  onActiveColorChange: (idColor: number) => void
}

function normalizeHexColor(code: string): string {
  const trimmed = code.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

export function ProductoLabelPreview({
  productName,
  selectedColors,
  activeColorId,
  previewImageUrl,
  onOpenImages,
  onActiveColorChange,
}: ProductoLabelPreviewProps) {
  const displayName = productName.trim() || "Product name"

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="relative h-40 bg-[#D6D9DE]">
        <div className="absolute left-1/2 top-8 w-[142px] -translate-x-1/2 overflow-hidden rounded-md shadow-sm">
          <div className="relative h-24 w-full bg-[#5A657A]">
            {previewImageUrl ? (
              <Image
                src={previewImageUrl}
                alt={`Preview de ${displayName}`}
                width={142}
                height={96}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <PhotoIcon className="h-10 w-10 text-[#C6CDD9]" />
              </div>
            )}
          </div>

          <div className="bg-[#485469] px-2 py-1.5">
            <p className="truncate text-[16px] font-semibold leading-none text-white">
              {displayName}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-card px-4 py-4">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenImages}
            className="inline-flex items-center gap-2 text-sm font-medium  transition-opacity hover:opacity-80"
          >
            <PhotoIcon className="h-5 w-5" />
            <span>Imagenes</span>
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {selectedColors.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Selecciona colores para ver la vista previa por color.
            </p>
          ) : (
            selectedColors.map((color) => {
              const isActive = color.idColor === activeColorId
              return (
                <button
                  key={color.idColor}
                  type="button"
                  onClick={() => onActiveColorChange(color.idColor)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                    isActive
                      ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: normalizeHexColor(color.codigo) }}
                    aria-hidden
                  />
                  <span>{color.nombre}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
