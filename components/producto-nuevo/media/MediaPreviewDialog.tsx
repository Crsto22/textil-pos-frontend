"use client"

import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MediaItem } from "@/lib/types/producto-create"

interface MediaPreviewDialogProps {
  media: MediaItem | null
  onOpenChange: (open: boolean) => void
}

export function MediaPreviewDialog({
  media,
  onOpenChange,
}: MediaPreviewDialogProps) {
  const open = media !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[90] flex max-h-[calc(100dvh-2rem)] w-[min(960px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:p-5">
        <DialogHeader className="min-w-0 pr-8 text-left">
          <DialogTitle className="text-base sm:text-lg">Vista previa de imagen</DialogTitle>
          <DialogDescription className="truncate text-xs sm:text-sm">
            {media?.fileName || "Imagen seleccionada"}
          </DialogDescription>
        </DialogHeader>

        {media ? (
          <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-xl border bg-muted/20 sm:min-h-[420px]">
            <Image
              src={media.previewUrl}
              alt={`Vista previa de ${media.fileName}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

