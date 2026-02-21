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
      <DialogContent className="max-h-[90dvh] max-w-4xl p-4 sm:p-6" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar imagen</DialogTitle>
          <DialogDescription>
            Revisa la imagen antes de agregarla. {fileName ?? ""}
          </DialogDescription>
        </DialogHeader>

        {previewUrl ? (
          <div className="relative h-[65dvh] w-full overflow-hidden rounded-lg border bg-muted/20">
            <Image
              src={previewUrl}
              alt={fileName ? `Vista previa de ${fileName}` : "Vista previa de imagen"}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : null}

        <DialogFooter className="sm:justify-end">
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

