"use client"

import {
    ArrowUpTrayIcon,
    PhotoIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"
import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
} from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type { AuthUser } from "@/lib/auth/types"
import {
    PROFILE_PHOTO_ACCEPTED_TYPES,
    PROFILE_PHOTO_MAX_BYTES,
    validateProfilePhoto,
} from "@/lib/profile-photo"

interface CuentaProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: AuthUser | null
    isUploading: boolean
    isDeleting: boolean
    onUpload: (file: File) => Promise<boolean>
    onDelete: () => Promise<boolean>
}

interface SelectedProfilePhoto {
    file: File
    previewUrl: string
}

interface PhotoPickerContentProps {
    user: AuthUser | null
    isUploading: boolean
    isDeleting: boolean
    onUpload: (file: File) => Promise<boolean>
    onDelete: () => Promise<boolean>
    onClose: () => void
}

function PhotoPickerContent({
    user,
    isUploading,
    isDeleting,
    onUpload,
    onDelete,
    onClose,
}: PhotoPickerContentProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [selectedProfilePhoto, setSelectedProfilePhoto] =
        useState<SelectedProfilePhoto | null>(null)

    const clearSelectedProfilePhoto = useCallback(() => {
        setSelectedProfilePhoto((current) => {
            if (current) {
                URL.revokeObjectURL(current.previewUrl)
            }
            return null
        })

        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [])

    useEffect(() => {
        return () => {
            if (selectedProfilePhoto) {
                URL.revokeObjectURL(selectedProfilePhoto.previewUrl)
            }
        }
    }, [selectedProfilePhoto])

    const handleProfilePhotoChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return

            const validationMessage = validateProfilePhoto(file)
            if (validationMessage) {
                toast.error(validationMessage)
                event.target.value = ""
                return
            }

            const previewUrl = URL.createObjectURL(file)
            setSelectedProfilePhoto((current) => {
                if (current) {
                    URL.revokeObjectURL(current.previewUrl)
                }

                return { file, previewUrl }
            })
        },
        []
    )

    const handleSave = useCallback(async () => {
        if (!selectedProfilePhoto) {
            toast.error("Selecciona una imagen")
            return
        }

        const success = await onUpload(selectedProfilePhoto.file)
        if (success) {
            clearSelectedProfilePhoto()
            onClose()
        }
    }, [clearSelectedProfilePhoto, onClose, onUpload, selectedProfilePhoto])

    const handleDeleteCurrentPhoto = useCallback(async () => {
        const success = await onDelete()
        if (success) {
            clearSelectedProfilePhoto()
            onClose()
        }
    }, [clearSelectedProfilePhoto, onClose, onDelete])

    const activePreviewUrl = selectedProfilePhoto?.previewUrl ?? user?.fotoPerfilUrl ?? null
    const hasPendingSelection = Boolean(selectedProfilePhoto)
    const hasStoredProfilePhoto = Boolean(user?.fotoPerfilUrl)

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
                <div className="rounded-[28px] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_72%,black)_0%,color-mix(in_oklab,var(--primary)_48%,transparent)_48%,color-mix(in_oklab,var(--primary)_18%,var(--card))_100%)] p-5 text-primary-foreground shadow-xl">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                        <div className="flex justify-center lg:block">
                            <div className="rounded-[28px] bg-background/10 p-2 shadow-lg ring-1 ring-white/15 backdrop-blur-sm">
                                <UserAvatar
                                    nombre={user?.nombre}
                                    apellido={user?.apellido}
                                    fotoPerfilUrl={activePreviewUrl}
                                    className="h-24 w-24 border border-white/15 shadow-inner sm:h-28 sm:w-28"
                                    fallbackClassName="bg-background text-foreground"
                                    textClassName="text-2xl font-bold"
                                />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 text-center lg:text-left">
                            <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                                Foto de perfil
                            </h3>
                            <p className="mt-2 text-sm text-primary-foreground/85">
                                Sube una imagen para personalizar tu cuenta. Si ya tienes una, tambien puedes eliminarla desde aqui.
                            </p>
                            <div className="mt-4 inline-flex rounded-full border border-white/15 bg-background/10 px-3 py-1 text-xs text-primary-foreground/90">
                                PNG, JPG o WEBP hasta {Math.round(PROFILE_PHOTO_MAX_BYTES / (1024 * 1024))} MB
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-dashed border-border bg-card p-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={PROFILE_PHOTO_ACCEPTED_TYPES.join(",")}
                        className="hidden"
                        onChange={handleProfilePhotoChange}
                    />

                    <div className="flex flex-col items-center text-center">
                        <div className="rounded-2xl bg-muted p-3 text-primary">
                            <ArrowUpTrayIcon className="h-6 w-6" />
                        </div>
                        <p className="text-foreground mt-4 text-lg font-semibold">
                            Explorar archivos
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Selecciona una imagen para actualizar tu perfil.
                        </p>
                        {selectedProfilePhoto && (
                            <p className="text-primary mt-3 max-w-full truncate text-sm font-medium">
                                {selectedProfilePhoto.file.name}
                            </p>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-4 rounded-xl"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isDeleting}
                        >
                            <PhotoIcon className="h-4 w-4" />
                            {selectedProfilePhoto ? "Cambiar imagen" : "Seleccionar imagen"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {hasPendingSelection && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearSelectedProfilePhoto}
                                disabled={isUploading || isDeleting}
                            >
                                Limpiar seleccion
                            </Button>
                        )}
                        {hasStoredProfilePhoto && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDeleteCurrentPhoto}
                                disabled={isUploading || isDeleting}
                            >
                                <TrashIcon className="h-4 w-4" />
                                {isDeleting ? "Eliminando..." : "Eliminar foto actual"}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isUploading || isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={!hasPendingSelection || isUploading || isDeleting}
                            className="rounded-xl"
                        >
                            {isUploading ? "Guardando..." : "Guardar foto"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CuentaProfileDialogComponent({
    open,
    onOpenChange,
    user,
    isUploading,
    isDeleting,
    onUpload,
    onDelete,
}: CuentaProfileDialogProps) {
    const isMobile = useIsMobile(1280)
    const handleClose = useCallback(() => {
        if (isUploading || isDeleting) return
        onOpenChange(false)
    }, [isDeleting, isUploading, onOpenChange])

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="flex h-[88dvh] flex-col gap-0 p-0">
                    <SheetHeader className="shrink-0 border-b border-border px-4 pb-3 pt-4">
                        <SheetTitle className="text-left text-base">Cambiar foto de perfil</SheetTitle>
                        <SheetDescription className="text-left">
                            Sube o elimina tu foto desde una vista adaptada para movil.
                        </SheetDescription>
                    </SheetHeader>

                    <PhotoPickerContent
                        user={user}
                        isUploading={isUploading}
                        isDeleting={isDeleting}
                        onUpload={onUpload}
                        onDelete={onDelete}
                        onClose={handleClose}
                    />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-xl">
                <div className="bg-card overflow-hidden rounded-[32px] border border-border shadow-2xl">
                    <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
                        <DialogTitle className="text-foreground text-xl font-bold">
                            Cambiar foto de perfil
                        </DialogTitle>
                        <DialogDescription>
                            Sube una imagen nueva o elimina la actual si ya tienes una.
                        </DialogDescription>
                    </DialogHeader>

                    <PhotoPickerContent
                        user={user}
                        isUploading={isUploading}
                        isDeleting={isDeleting}
                        onUpload={onUpload}
                        onDelete={onDelete}
                        onClose={handleClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export const CuentaProfileDialog = memo(CuentaProfileDialogComponent)
