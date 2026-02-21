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
      <DialogContent className="max-h-[90dvh] max-w-4xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Vista previa de imagen</DialogTitle>
          <DialogDescription>
            {media?.fileName || "Imagen seleccionada"}
          </DialogDescription>
        </DialogHeader>

        {media ? (
          <div className="relative h-[65dvh] w-full overflow-hidden rounded-lg border bg-muted/20">
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

