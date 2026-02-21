"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"

interface AttributeSelectedChipProps {
  label: string
  colorHex?: string
  onRemove: () => void
}

export function AttributeSelectedChip({
  label,
  colorHex,
  onRemove,
}: AttributeSelectedChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      title={`Quitar ${label}`}
    >
      {colorHex ? (
        <span
          className="h-2.5 w-2.5 rounded-full border border-black/10"
          style={{ backgroundColor: colorHex }}
        />
      ) : null}
      <span>{label}</span>
      <XMarkIcon className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  )
}
