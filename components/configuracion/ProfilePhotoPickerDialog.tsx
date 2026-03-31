"use client"

import {
    ArrowUpTrayIcon,
    PhotoIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"
import {
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
import { UserAvatar } from "@/components/ui/user-avatar"
import {
    PROFILE_PHOTO_ACCEPTED_TYPES,
    PROFILE_PHOTO_MAX_BYTES,
    validateProfilePhoto,
} from "@/lib/profile-photo"

interface SelectedProfilePhoto {
    file: File
    previewUrl: string
}

interface ProfilePhotoPickerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    nombre?: string | null
    apellido?: string | null
    fotoPerfilUrl?: string | null
    isUploading: boolean
    isDeleting: boolean
    onUpload: (file: File) => Promise<boolean>
    onDelete: () => Promise<boolean>
}

export function ProfilePhotoPickerDialog({
    open,
    onOpenChange,
    nombre,
    apellido,
    fotoPerfilUrl,
    isUploading,
    isDeleting,
    onUpload,
    onDelete,
}: ProfilePhotoPickerDialogProps) {
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

    const resetLocalSelection = useCallback(() => {
        clearSelectedProfilePhoto()
    }, [clearSelectedProfilePhoto])

    useEffect(() => {
        return () => {
            if (selectedProfilePhoto) {
                URL.revokeObjectURL(selectedProfilePhoto.previewUrl)
            }
        }
    }, [selectedProfilePhoto])

    const handleDialogOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen && (isUploading || isDeleting)) {
                return
            }

            if (!nextOpen) {
                resetLocalSelection()
            }

            onOpenChange(nextOpen)
        },
        [isDeleting, isUploading, onOpenChange, resetLocalSelection]
    )

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
            handleDialogOpenChange(false)
        }
    }, [handleDialogOpenChange, onUpload, selectedProfilePhoto])

    const handleDeleteCurrentPhoto = useCallback(async () => {
        const success = await onDelete()
        if (success) {
            handleDialogOpenChange(false)
        }
    }, [handleDialogOpenChange, onDelete])

    const activePreviewUrl = selectedProfilePhoto?.previewUrl ?? fotoPerfilUrl ?? null
    const hasPendingSelection = Boolean(selectedProfilePhoto)
    const hasStoredProfilePhoto = Boolean(fotoPerfilUrl)

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-[calc(100vw-1.5rem)] overflow-hidden border border-slate-200 bg-transparent p-0 shadow-2xl sm:max-w-4xl dark:border-slate-800">
                <div className="relative bg-white p-6 dark:bg-slate-950 sm:p-8">
                    <DialogHeader className="pr-10 text-left">
                        <DialogTitle className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                            Personalizacion
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-slate-300">
                            Sube tu foto de perfil.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
                        <div className="lg:w-56 lg:shrink-0">
                            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                    Vista previa
                                </p>
                                <div className="mt-4 flex justify-center">
                                    <div className="rounded-[28px] bg-white p-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
                                        <UserAvatar
                                            nombre={nombre}
                                            apellido={apellido}
                                            fotoPerfilUrl={activePreviewUrl}
                                            className="h-24 w-24 border border-slate-100 shadow-inner"
                                            fallbackClassName="bg-linear-to-br from-indigo-500 to-blue-600 text-white"
                                            textClassName="text-2xl font-bold"
                                        />
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                    {hasPendingSelection
                                        ? "Asi se vera tu perfil al guardar."
                                        : "Tu imagen actual se muestra aqui."}
                                </p>
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-6">
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/75">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={PROFILE_PHOTO_ACCEPTED_TYPES.join(",")}
                                    className="hidden"
                                    onChange={handleProfilePhotoChange}
                                />

                                <div className="flex flex-col items-center text-center">
                                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        <ArrowUpTrayIcon className="h-6 w-6" />
                                    </div>
                                    <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                                        Explorar archivos
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        PNG, JPG o WEBP hasta{" "}
                                        {Math.round(PROFILE_PHOTO_MAX_BYTES / (1024 * 1024))}
                                        MB
                                    </p>
                                    {selectedProfilePhoto && (
                                        <p className="mt-3 truncate text-sm font-medium text-indigo-600">
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
                                        {selectedProfilePhoto
                                            ? "Cambiar imagen"
                                            : "Seleccionar imagen"}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {hasPendingSelection && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={resetLocalSelection}
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
                                            {isDeleting
                                                ? "Eliminando..."
                                                : "Eliminar foto actual"}
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleDialogOpenChange(false)}
                                        disabled={isUploading || isDeleting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={
                                            !hasPendingSelection ||
                                            isUploading ||
                                            isDeleting
                                        }
                                        className="bg-slate-950 text-white hover:bg-slate-800"
                                    >
                                        {isUploading ? "Guardando..." : "Guardar foto"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
