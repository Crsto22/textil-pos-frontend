"use client"

import { type ChangeEvent } from "react"

import { MediaUploadSlot } from "@/components/producto-nuevo/media/MediaUploadSlot"
import type { Color } from "@/lib/types/color"
import type { MediaItem } from "@/lib/types/producto-create"
import { MAX_MEDIA_PER_COLOR } from "@/lib/types/producto-create"
import { cn } from "@/lib/utils"

interface MediaColorSectionProps {
  color: Color
  media: MediaItem[]
  focused: boolean
  onRegisterFileInput: (idColor: number, input: HTMLInputElement | null) => void
  onOpenMediaPicker: (idColor: number) => void
  onPreviewMedia: (media: MediaItem) => void
  onFocus: (idColor: number) => void
  onAddMedia: (idColor: number, event: ChangeEvent<HTMLInputElement>) => void
  onRemoveMedia: (idColor: number, mediaId: string) => void
}

function normalizeHexColor(code: string): string {
  const trimmed = code.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

export function MediaColorSection({
  color,
  media,
  focused,
  onRegisterFileInput,
  onOpenMediaPicker,
  onPreviewMedia,
  onFocus,
  onAddMedia,
  onRemoveMedia,
}: MediaColorSectionProps) {
  const colorHex = normalizeHexColor(color.codigo)
  const emptySlotsCount = Math.max(0, MAX_MEDIA_PER_COLOR - media.length)

  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-4 transition-colors",
        focused
          ? "border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/10"
          : "border-border"
      )}
      onClick={() => onFocus(color.idColor)}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-full border border-black/10"
            style={{ backgroundColor: colorHex }}
            aria-hidden
          />
          <span className="font-semibold text-foreground">{color.nombre}</span>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
          {media.length} / {MAX_MEDIA_PER_COLOR}
        </span>
      </div>

      <input
        ref={(input) => {
          onRegisterFileInput(color.idColor, input)
        }}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => onAddMedia(color.idColor, event)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {media.map((item) => (
          <MediaUploadSlot
            key={item.id}
            media={item}
            onSelect={() => onPreviewMedia(item)}
            onRemove={() => onRemoveMedia(color.idColor, item.id)}
          />
        ))}

        {Array.from({ length: emptySlotsCount }).map((_, index) => (
          <MediaUploadSlot
            key={`${color.idColor}-empty-${index}`}
            onSelect={() => onOpenMediaPicker(color.idColor)}
            disabled={media.length >= MAX_MEDIA_PER_COLOR}
          />
        ))}
      </div>
    </section>
  )
}
