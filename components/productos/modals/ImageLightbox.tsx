"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { VisuallyHidden } from "radix-ui"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageLightboxProps {
  images: string[]
  currentIndex: number | null
  onClose: () => void
  onIndexChange: (index: number | null) => void
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const isOpen = currentIndex !== null && images.length > 0
  const safeIndex = currentIndex === null ? 0 : Math.min(Math.max(currentIndex, 0), images.length - 1)
  const currentImage = images[safeIndex]
  const hasMultipleImages = images.length > 1

  const handlePrevious = () => {
    if (!hasMultipleImages) return
    onIndexChange(safeIndex === 0 ? images.length - 1 : safeIndex - 1)
  }

  const handleNext = () => {
    if (!hasMultipleImages) return
    onIndexChange(safeIndex === images.length - 1 ? 0 : safeIndex + 1)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center border-0 bg-black/60 p-4 shadow-none sm:max-w-none"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Vista previa de imagen</DialogTitle>
        </VisuallyHidden.Root>

        {currentImage && (
          <div className="relative flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-md transition hover:bg-white"
              aria-label="Cerrar vista previa de imagen"
            >
              <X className="h-5 w-5" />
            </button>

            {hasMultipleImages && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handlePrevious()
                }}
                className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-md transition hover:bg-white"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {hasMultipleImages && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleNext()
                }}
                className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-md transition hover:bg-white"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-full w-full cursor-default items-center justify-center bg-transparent p-0"
              aria-label="Cerrar vista previa de imagen"
            >
              <img
                src={currentImage}
                alt="Vista previa de imagen"
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] max-w-[90vw] cursor-default rounded-xl object-contain shadow-2xl"
              />
            </button>

            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-sm font-medium text-white">
              {safeIndex + 1}/{images.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
