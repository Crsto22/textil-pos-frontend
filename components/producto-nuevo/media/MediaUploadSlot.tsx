"use client"

import { PhotoIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"

import type { MediaItem } from "@/lib/types/producto-create"

interface MediaUploadSlotProps {
  media?: MediaItem
  onSelect: () => void
  onRemove?: () => void
  disabled?: boolean
}

export function MediaUploadSlot({
  media,
  onSelect,
  onRemove,
  disabled = false,
}: MediaUploadSlotProps) {
  if (media) {
    return (
      <div className="group relative h-24 w-full overflow-hidden rounded-xl border bg-muted sm:w-24">
        <button
          type="button"
          onClick={onSelect}
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${media.previewUrl}")` }}
          title={media.fileName}
          aria-label={`Imagen ${media.fileName}`}
        />
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={`Quitar ${media.fileName}`}
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="relative flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-[#D7DCE8] bg-transparent text-[#98A2B3] transition-colors hover:border-blue-400 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-24"
      aria-label="Agregar imagen"
    >
      <PhotoIcon className="h-6 w-6" />
      <PlusIcon className="absolute right-3 top-3 h-4 w-4 rounded-full bg-background" />
    </button>
  )
}
