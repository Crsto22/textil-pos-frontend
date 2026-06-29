"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import Image from "next/image"
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MAX_FILE_SIZE_BYTES,
  type MediaItem,
} from "@/lib/types/producto-create"

interface ProductoSizeGuideDialogProps {
  open: boolean
  media: MediaItem | null
  onOpenChange: (open: boolean) => void
  onSave: (nextMedia: MediaItem | null) => void
}

function isValidImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

function revokeDraftMedia(media: MediaItem | null, committedMedia: MediaItem | null) {
  if (media?.file && media.previewUrl !== committedMedia?.previewUrl) {
    URL.revokeObjectURL(media.previewUrl)
  }
}

function areMediaItemsEqual(previous: MediaItem | null, next: MediaItem | null) {
  return previous?.id === next?.id
}

export function ProductoSizeGuideDialog({
  open,
  media,
  onOpenChange,
  onSave,
}: ProductoSizeGuideDialogProps) {
  const [draftMedia, setDraftMedia] = useState<MediaItem | null>(media)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const draftMediaRef = useRef<MediaItem | null>(draftMedia)
  const committedMediaRef = useRef<MediaItem | null>(media)

  useEffect(() => {
    draftMediaRef.current = draftMedia
  }, [draftMedia])

  useEffect(() => {
    committedMediaRef.current = media
  }, [media])

  useEffect(() => {
    return () => {
      revokeDraftMedia(draftMediaRef.current, committedMediaRef.current)
    }
  }, [])

  const hasDraftChanges = !areMediaItemsEqual(media, draftMedia)

  const handleOpenPicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleSelectFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      if (!file) return

      if (!isValidImageFile(file)) {
        toast.error("Solo se permiten archivos de imagen")
        event.target.value = ""
        return
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error("La imagen debe pesar como maximo 10MB")
        event.target.value = ""
        return
      }

      setDraftMedia((previous) => {
        revokeDraftMedia(previous, media)
        return {
          id: `guia-tallas-${crypto.randomUUID()}`,
          file,
          fileName: file.name,
          previewUrl: URL.createObjectURL(file),
        }
      })
      event.target.value = ""
    },
    [media]
  )

  const handleRemove = useCallback(() => {
    setDraftMedia((previous) => {
      revokeDraftMedia(previous, media)
      return null
    })
  }, [media])

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        revokeDraftMedia(draftMediaRef.current, committedMediaRef.current)
        setDraftMedia(media)
      }
      onOpenChange(nextOpen)
    },
    [media, onOpenChange]
  )

  const handleSave = useCallback(() => {
    committedMediaRef.current = draftMedia
    onSave(draftMedia)
    onOpenChange(false)
    toast.success("Guia de tallas actualizada")
  }, [draftMedia, onOpenChange, onSave])

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="z-[90] flex max-h-[calc(100dvh-2rem)] w-[min(760px,calc(100vw-2rem))] max-w-none flex-col gap-4 overflow-hidden rounded-2xl p-4 sm:p-5">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>Guia de tallas</DialogTitle>
          <DialogDescription>
            Sube una imagen unica para mostrar la tabla o referencia de tallas del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border bg-muted/20 sm:min-h-[420px]">
            {draftMedia ? (
              <Image
                src={draftMedia.previewUrl}
                alt={`Guia de tallas ${draftMedia.fileName}`}
                fill
                unoptimized
                className="object-contain p-3"
              />
            ) : (
              <button
                type="button"
                onClick={handleOpenPicker}
                className="flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-3 text-muted-foreground transition-colors hover:text-blue-600 sm:min-h-[420px]"
              >
                <PhotoIcon className="h-14 w-14" />
                <span className="text-sm font-semibold">Subir guia de tallas</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {draftMedia?.fileName ?? "Sin imagen seleccionada"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {draftMedia ? (
                <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Quitar
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={handleOpenPicker}>
                {draftMedia ? "Reemplazar" : "Seleccionar imagen"}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectFile}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!hasDraftChanges}>
            Guardar guia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
