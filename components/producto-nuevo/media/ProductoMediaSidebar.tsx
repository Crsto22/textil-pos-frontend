"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { PhotoIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { MediaColorSection } from "@/components/producto-nuevo/media/MediaColorSection"
import { MediaPreviewDialog } from "@/components/producto-nuevo/media/MediaPreviewDialog"
import { MediaSelectionConfirmDialog } from "@/components/producto-nuevo/media/MediaSelectionConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Color } from "@/lib/types/color"
import {
  MAX_FILE_SIZE_BYTES,
  MAX_MEDIA_PER_COLOR,
  type MediaItem,
} from "@/lib/types/producto-create"

interface ProductoMediaSidebarProps {
  open: boolean
  selectedColors: Color[]
  mediaByColor: Record<number, MediaItem[]>
  focusedColorId: number | null
  onOpenChange: (open: boolean) => void
  onFocusedColorChange: (idColor: number) => void
  onSaveMediaByColor: (nextMediaByColor: Record<number, MediaItem[]>) => void
}

interface PendingMediaCandidate extends MediaItem {
  idColor: number
}

function cloneMediaByColor(mediaByColor: Record<number, MediaItem[]>) {
  const clone: Record<number, MediaItem[]> = {}

  Object.entries(mediaByColor).forEach(([idColor, media]) => {
    clone[Number(idColor)] = [...media]
  })

  return clone
}

function collectMediaIds(mediaByColor: Record<number, MediaItem[]>) {
  const ids = new Set<string>()

  Object.values(mediaByColor).forEach((media) => {
    media.forEach((item) => {
      ids.add(item.id)
    })
  })

  return ids
}

function areMediaByColorEqual(
  previous: Record<number, MediaItem[]>,
  next: Record<number, MediaItem[]>
) {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])

  for (const key of keys) {
    const previousMedia = previous[Number(key)] ?? []
    const nextMedia = next[Number(key)] ?? []

    if (previousMedia.length !== nextMedia.length) {
      return false
    }

    for (let index = 0; index < previousMedia.length; index += 1) {
      if (previousMedia[index]?.id !== nextMedia[index]?.id) {
        return false
      }
    }
  }

  return true
}

function getDraftAddedMedia(
  committed: Record<number, MediaItem[]>,
  draft: Record<number, MediaItem[]>
) {
  const committedIds = collectMediaIds(committed)

  return Object.values(draft).flatMap((media) =>
    media.filter((item) => !committedIds.has(item.id))
  )
}

function isValidImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

function revokePendingMediaCandidates(candidates: PendingMediaCandidate[]) {
  candidates.forEach((candidate) => {
    URL.revokeObjectURL(candidate.previewUrl)
  })
}

export function ProductoMediaSidebar({
  open,
  selectedColors,
  mediaByColor,
  focusedColorId,
  onOpenChange,
  onFocusedColorChange,
  onSaveMediaByColor,
}: ProductoMediaSidebarProps) {
  const [draftMediaByColor, setDraftMediaByColor] = useState<Record<number, MediaItem[]>>(
    () => cloneMediaByColor(mediaByColor)
  )
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null)
  const [pendingMediaCandidates, setPendingMediaCandidates] = useState<
    PendingMediaCandidate[]
  >([])
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const pendingMediaCandidatesRef = useRef<PendingMediaCandidate[]>(pendingMediaCandidates)

  useEffect(() => {
    pendingMediaCandidatesRef.current = pendingMediaCandidates
  }, [pendingMediaCandidates])

  useEffect(() => {
    return () => {
      revokePendingMediaCandidates(pendingMediaCandidatesRef.current)
    }
  }, [])

  const selectedColorIdSet = useMemo(
    () => new Set(selectedColors.map((color) => color.idColor)),
    [selectedColors]
  )
  const committedMediaIds = useMemo(() => collectMediaIds(mediaByColor), [mediaByColor])

  const hasDraftChanges = useMemo(
    () => !areMediaByColorEqual(mediaByColor, draftMediaByColor),
    [draftMediaByColor, mediaByColor]
  )

  const handleRegisterFileInput = useCallback(
    (idColor: number, input: HTMLInputElement | null) => {
      fileInputRefs.current[idColor] = input
    },
    []
  )

  const handleOpenMediaPicker = useCallback((idColor: number) => {
    fileInputRefs.current[idColor]?.click()
  }, [])

  const handlePreviewMedia = useCallback((media: MediaItem) => {
    setPreviewMedia(media)
  }, [])

  const handleAddMedia = useCallback(
    (idColor: number, event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : []
      if (files.length === 0) return

      const onlyImages = files.filter(isValidImageFile)
      if (onlyImages.length !== files.length) {
        toast.error("Solo se permiten archivos de imagen")
      }

      const allowedSizeFiles = onlyImages.filter(
        (file) => file.size <= MAX_FILE_SIZE_BYTES
      )
      if (allowedSizeFiles.length !== onlyImages.length) {
        toast.error("Cada imagen debe pesar como maximo 10MB")
      }

      if (allowedSizeFiles.length === 0) {
        event.target.value = ""
        return
      }

      const current = draftMediaByColor[idColor] ?? []
      const remainingSlots = MAX_MEDIA_PER_COLOR - current.length

      if (remainingSlots <= 0) {
        toast.error("Maximo 5 imagenes por color")
        event.target.value = ""
        return
      }

      const nextMedia = allowedSizeFiles.slice(0, remainingSlots).map((file) => ({
        id: crypto.randomUUID(),
        idColor,
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
      }))

      if (allowedSizeFiles.length > remainingSlots) {
        toast.error("Se agregaron solo las imagenes permitidas por el limite")
      }

      setPendingMediaCandidates((existingCandidates) => {
        revokePendingMediaCandidates(existingCandidates)
        return nextMedia
      })

      event.target.value = ""
    },
    [draftMediaByColor]
  )

  const handleAcceptPendingMedia = useCallback(() => {
    const current = pendingMediaCandidates[0]
    if (!current) return

    setPendingMediaCandidates((previous) => previous.slice(1))

    setDraftMediaByColor((currentDraft) => {
      const currentMedia = currentDraft[current.idColor] ?? []
      if (currentMedia.some((item) => item.id === current.id)) return currentDraft

      return {
        ...currentDraft,
        [current.idColor]: [...currentMedia, current],
      }
    })
  }, [pendingMediaCandidates])

  const handleCancelPendingMedia = useCallback(() => {
    const current = pendingMediaCandidates[0]
    if (!current) return

    URL.revokeObjectURL(current.previewUrl)
    setPendingMediaCandidates((previous) => previous.slice(1))
  }, [pendingMediaCandidates])

  const handleRemoveMedia = useCallback(
    (idColor: number, mediaId: string) => {
      setPreviewMedia((current) => (current?.id === mediaId ? null : current))

      setDraftMediaByColor((previous) => {
        const current = previous[idColor] ?? []
        const removedItem = current.find((item) => item.id === mediaId)
        const nextMedia = current.filter((item) => item.id !== mediaId)

        if (!removedItem) {
          return previous
        }

        if (!committedMediaIds.has(removedItem.id)) {
          URL.revokeObjectURL(removedItem.previewUrl)
        }

        return {
          ...previous,
          [idColor]: nextMedia,
        }
      })
    },
    [committedMediaIds]
  )

  const handleDiscardChanges = useCallback(() => {
    const addedMedia = getDraftAddedMedia(mediaByColor, draftMediaByColor)
    addedMedia.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl)
    })
    revokePendingMediaCandidates(pendingMediaCandidatesRef.current)

    setPreviewMedia(null)
    setPendingMediaCandidates([])
    setDraftMediaByColor(cloneMediaByColor(mediaByColor))
  }, [draftMediaByColor, mediaByColor])

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleDiscardChanges()
      }

      onOpenChange(nextOpen)
    },
    [handleDiscardChanges, onOpenChange]
  )

  const handleSaveChanges = useCallback(() => {
    if (pendingMediaCandidates.length > 0) {
      toast.error("Primero acepta o cancela la imagen seleccionada")
      return
    }

    onSaveMediaByColor(cloneMediaByColor(draftMediaByColor))
    setPreviewMedia(null)
    toast.success("Imagenes actualizadas")
    onOpenChange(false)
  }, [draftMediaByColor, onOpenChange, onSaveMediaByColor, pendingMediaCandidates.length])

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="h-dvh w-full max-w-full rounded-none p-0 sm:max-w-[760px]"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="space-y-1 border-b px-6 py-5">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <PhotoIcon className="h-6 w-6 text-blue-600" />
              Multimedia
            </SheetTitle>
            <SheetDescription>
              Sube imagenes por cada color seleccionado (max. 5 por color).
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {selectedColors.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                Escoge colores para este producto y luego agrega las imagenes.
              </div>
            ) : (
              selectedColors.map((color) => {
                const media = selectedColorIdSet.has(color.idColor)
                  ? (draftMediaByColor[color.idColor] ?? [])
                  : []
                return (
                  <MediaColorSection
                    key={color.idColor}
                    color={color}
                    media={media}
                    focused={focusedColorId === color.idColor}
                    onRegisterFileInput={handleRegisterFileInput}
                    onOpenMediaPicker={handleOpenMediaPicker}
                    onPreviewMedia={handlePreviewMedia}
                    onFocus={onFocusedColorChange}
                    onAddMedia={handleAddMedia}
                    onRemoveMedia={handleRemoveMedia}
                  />
                )
              })
            )}
          </div>

          <div className="border-t px-6 py-4">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleSaveChanges}
              disabled={
                selectedColors.length === 0 ||
                !hasDraftChanges ||
                pendingMediaCandidates.length > 0
              }
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </SheetContent>

      <MediaPreviewDialog
        media={previewMedia}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewMedia(null)
          }
        }}
      />

      <MediaSelectionConfirmDialog
        fileName={pendingMediaCandidates[0]?.fileName ?? null}
        previewUrl={pendingMediaCandidates[0]?.previewUrl ?? null}
        onAccept={handleAcceptPendingMedia}
        onCancel={handleCancelPendingMedia}
      />
    </Sheet>
  )
}
