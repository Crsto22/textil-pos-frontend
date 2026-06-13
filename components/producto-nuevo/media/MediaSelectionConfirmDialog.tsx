"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MediaSelectionConfirmDialogProps {
  fileName: string | null
  previewUrl: string | null
  onAccept: () => void
  onCancel: () => void
}

export function MediaSelectionConfirmDialog({
  fileName,
  previewUrl,
  onAccept,
  onCancel,
}: MediaSelectionConfirmDialogProps) {
  const open = Boolean(previewUrl)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        className="z-[90] flex max-h-[calc(100dvh-2rem)] w-[min(960px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:p-5"
        showCloseButton={false}
      >
        <DialogHeader className="min-w-0 text-left">
          <DialogTitle className="text-base sm:text-lg">Confirmar imagen</DialogTitle>
          <DialogDescription className="truncate text-xs sm:text-sm">
            Revisa la imagen antes de agregarla. {fileName ?? ""}
          </DialogDescription>
        </DialogHeader>

        {previewUrl ? (
          <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-xl border bg-muted/20 sm:min-h-[420px]">
            <Image
              src={previewUrl}
              alt={fileName ? `Vista previa de ${fileName}` : "Vista previa de imagen"}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : null}

        <DialogFooter className="shrink-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar foto
          </Button>
          <Button type="button" onClick={onAccept}>
            Aceptar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

