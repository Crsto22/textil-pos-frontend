"use client"

import { useState, useCallback, type FormEvent } from "react"
import {
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    EnvelopeIcon,
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    UserIcon,
} from "@heroicons/react/24/outline"

import { ProfilePhotoPickerDialog } from "@/components/configuracion/ProfilePhotoPickerDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { AuthUser, ChangePasswordRequest } from "@/lib/auth/types"
import { validateProfilePhoto } from "@/lib/profile-photo"
import { toast } from "sonner"

function getFormattedRole(rol: string) {
    const map: Record<string, string> = {
        ADMINISTRADOR: "Administrador",
        VENTAS: "Ventas",
        ALMACEN: "Almacen",
        VENDEDOR: "Vendedor",
    }
    return map[rol] ?? rol
}

function formatMemberSince(value?: string) {
    if (!value) return "No disponible"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric",
    })
}

function formatFechaCompleta(value?: string) {
    if (!value) return "No disponible"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

function getReadOnlyValue(value?: string | number | null) {
    if (value === null || value === undefined) return "No disponible"
    if (typeof value === "string" && value.trim().length === 0) return "No disponible"
    return String(value)
}

interface ProfileFieldProps {
    label: string
    value: string
}

function ProfileField({ label, value }: ProfileFieldProps) {
    return (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {value}
            </p>
        </div>
    )
}

interface PasswordInputProps {
    id: string
    label: string
    placeholder?: string
    value: string
    onChange: (value: string) => void
    error?: string
}

function PasswordInput({ id, label, placeholder, value, onChange, error }: PasswordInputProps) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="space-y-1.5">
            <Label
                htmlFor={id}
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
            >
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={visible ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                >
                    {visible ? (
                        <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                        <EyeIcon className="h-4 w-4" />
                    )}
                </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

interface PasswordErrors {
    current?: string
    nueva?: string
    confirmar?: string
}

export default function ConfigCuentaPage() {
    const { user, updateUser } = useAuth()

    const [currentPw, setCurrentPw] = useState("")
    const [newPw, setNewPw] = useState("")
    const [confirmPw, setConfirmPw] = useState("")
    const [pwErrors, setPwErrors] = useState<PasswordErrors>({})
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false)
    const [isDeletingProfilePhoto, setIsDeletingProfilePhoto] = useState(false)
    const hasStoredProfilePhoto = Boolean(user?.fotoPerfilUrl)

    const handleUploadProfilePhoto = useCallback(
        async (file: File) => {
            const validationMessage = validateProfilePhoto(file)
            if (validationMessage) {
                toast.error(validationMessage)
                return false
            }

            const body = new FormData()
            body.append("file", file)

            setIsUploadingProfilePhoto(true)
            try {
                const response = await authFetch("/api/auth/foto-perfil", {
                    method: "PUT",
                    body,
                })

                const data = (await response.json().catch(() => null)) as
                    | AuthUser
                    | { message?: string }
                    | null

                if (!response.ok || !data || !("idUsuario" in data)) {
                    toast.error(
                        (data && "message" in data ? data.message : undefined) ??
                            "No se pudo actualizar la foto de perfil"
                    )
                    return false
                }

                updateUser(data)
                toast.success("Foto de perfil actualizada exitosamente")
                return true
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Error inesperado al subir la foto de perfil"
                toast.error(message)
                return false
            } finally {
                setIsUploadingProfilePhoto(false)
            }
        },
        [updateUser]
    )

    const handleDeleteProfilePhoto = useCallback(async () => {
        if (!hasStoredProfilePhoto) {
            toast.error("No hay foto de perfil para eliminar")
            return false
        }

        setIsDeletingProfilePhoto(true)
        try {
            const response = await authFetch("/api/auth/foto-perfil", {
                method: "DELETE",
            })

            const data = (await response.json().catch(() => null)) as
                | AuthUser
                | { message?: string }
                | null

            if (!response.ok || !data || !("idUsuario" in data)) {
                toast.error(
                    (data && "message" in data ? data.message : undefined) ??
                        "No se pudo eliminar la foto de perfil"
                )
                return false
            }

            updateUser(data)
            toast.success("Foto de perfil eliminada exitosamente")
            return true
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Error inesperado al eliminar la foto de perfil"
            toast.error(message)
            return false
        } finally {
            setIsDeletingProfilePhoto(false)
        }
    }, [hasStoredProfilePhoto, updateUser])

    const handlePasswordSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()

            const errors: PasswordErrors = {}
            const current = currentPw.trim()
            const next = newPw.trim()
            const confirmation = confirmPw.trim()

            if (!current) errors.current = "Ingrese su contrasena actual"
            if (!next) {
                errors.nueva = "Ingrese la nueva contrasena"
            } else if (next.length < 8) {
                errors.nueva = "Minimo 8 caracteres"
            }
            if (!confirmation) {
                errors.confirmar = "Confirme la nueva contrasena"
            } else if (next && confirmation && next !== confirmation) {
                errors.confirmar = "Las contrasenas no coinciden"
            }
            if (current && next && current === next) {
                errors.nueva = "La nueva contrasena no puede ser igual a la actual"
            }

            setPwErrors(errors)
            if (Object.keys(errors).length > 0) return

            const payload: ChangePasswordRequest = {
                passwordActual: current,
                passwordNueva: next,
                confirmarPassword: confirmation,
            }

            setIsChangingPassword(true)
            try {
                const response = await authFetch("/api/cuenta/cambiar-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

                const data = (await response.json().catch(() => null)) as
                    | { message?: string }
                    | null

                if (!response.ok) {
                    toast.error(data?.message ?? "No se pudo actualizar la contrasena")
                    return
                }

                toast.success(data?.message ?? "Contrasena actualizada exitosamente")
                setCurrentPw("")
                setNewPw("")
                setConfirmPw("")
                setPwErrors({})
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Error inesperado al cambiar contrasena"
                toast.error(message)
            } finally {
                setIsChangingPassword(false)
            }
        },
        [confirmPw, currentPw, newPw]
    )

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-0 p-0">
                <div 
                    className="relative h-48 bg-cover bg-center sm:h-52"
                    style={{
                        backgroundImage: `url('/img/portada/portada.webp')`
                    }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.24)_100%)]" />
                </div>

                <CardContent className="relative px-4 pb-6 pt-0 sm:px-6 lg:px-8">
                    <div className="-mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-6">
                            <UserAvatar
                                nombre={user?.nombre}
                                apellido={user?.apellido}
                                fotoPerfilUrl={user?.fotoPerfilUrl}
                                className="h-24 w-24 border border-slate-100 shadow-inner sm:h-28 sm:w-28 lg:h-32 lg:w-32"
                                fallbackClassName="bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                                textClassName="text-2xl font-bold"
                            />

                            <div className="min-w-0 mt-20 text-center sm:text-left">
                                <div className="flex flex-col items-center gap-3 sm:items-start lg:flex-row lg:items-center">
                                    <h1 className="max-w-full text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                        {getReadOnlyValue(user?.nombre)}{" "}
                                        {getReadOnlyValue(user?.apellido)}
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                                        {getFormattedRole(user?.rol ?? "")}
                                    </span>
                                </div>

                                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300 sm:justify-start">
                                    <EnvelopeIcon className="h-4 w-4" />
                                    <span className="truncate">
                                        {getReadOnlyValue(user?.correo)}
                                    </span>
                                </p>

                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                                        {getReadOnlyValue(user?.nombreSucursal)}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                                        Miembro desde {formatMemberSince(user?.fechaCreacion)}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                                        {hasStoredProfilePhoto
                                            ? "Foto personalizada activa"
                                            : "Sin foto personalizada"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                            <Button
                                type="button"
                                className="rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700"
                                onClick={() => setIsPhotoDialogOpen(true)}
                            >
                                Gestionar avatar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="perfil" className="gap-4">
                <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="perfil" className="gap-1.5 text-center">
                        <UserIcon className="h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="seguridad" className="gap-1.5 text-center">
                        <LockClosedIcon className="h-4 w-4" />
                        Seguridad
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="perfil">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <Card>
                            <CardContent className="space-y-5">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        Informacion personal
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Datos del usuario autenticado en modo solo lectura.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <ProfileField
                                        label="Nombre"
                                        value={getReadOnlyValue(user?.nombre)}
                                    />
                                    <ProfileField
                                        label="Apellido"
                                        value={getReadOnlyValue(user?.apellido)}
                                    />
                                    <ProfileField
                                        label="Correo"
                                        value={getReadOnlyValue(user?.correo)}
                                    />
                                    <ProfileField
                                        label="DNI"
                                        value={getReadOnlyValue(user?.dni)}
                                    />
                                    <ProfileField
                                        label="Telefono"
                                        value={getReadOnlyValue(user?.telefono)}
                                    />
                                    <ProfileField
                                        label="Foto de perfil"
                                        value={hasStoredProfilePhoto ? "Registrada" : "Sin foto"}
                                    />
                                    <ProfileField
                                        label="Rol"
                                        value={getFormattedRole(user?.rol ?? "")}
                                    />
                                    <ProfileField
                                        label="Fecha de creacion"
                                        value={formatFechaCompleta(user?.fechaCreacion)}
                                    />
                                    <ProfileField
                                        label="Sucursal"
                                        value={getReadOnlyValue(user?.nombreSucursal)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-5">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        Identidad visual
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Elige uno de los avatares del sistema o sube una
                                        imagen propia para tu perfil.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_55%),rgba(248,250,252,0.9)] p-5 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_55%),rgba(15,23,42,0.55)]">
                                    <div className="flex items-center gap-4">
                                        <UserAvatar
                                            nombre={user?.nombre}
                                            apellido={user?.apellido}
                                            fotoPerfilUrl={user?.fotoPerfilUrl}
                                            className="h-16 w-16 border border-white/70 shadow-md"
                                            fallbackClassName="bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                                            textClassName="text-lg font-bold"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-950 dark:text-white">
                                                {hasStoredProfilePhoto
                                                    ? "Avatar personalizado"
                                                    : "Avatar con iniciales"}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                                Formatos permitidos JPG, PNG y WEBP hasta 3MB.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <BuildingStorefrontIcon className="h-4 w-4 shrink-0" />
                                            <span>{getReadOnlyValue(user?.nombreSucursal)}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <CalendarDaysIcon className="h-4 w-4 shrink-0" />
                                            <span>
                                                Perfil creado el{" "}
                                                {formatFechaCompleta(user?.fechaCreacion)}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        className="mt-5 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={() => setIsPhotoDialogOpen(true)}
                                    >
                                        Elegir avatar o subir foto
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="seguridad" className="space-y-5">
                    <Card>
                        <CardContent className="space-y-5">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    Cambiar contrasena
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Asegurate de usar una contrasena segura de al menos 8 caracteres.
                                </p>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <PasswordInput
                                    id="pw-actual"
                                    label="Contrasena Actual"
                                    placeholder="********"
                                    value={currentPw}
                                    onChange={(value) => {
                                        setCurrentPw(value)
                                        setPwErrors((prev) => ({ ...prev, current: undefined }))
                                    }}
                                    error={pwErrors.current}
                                />

                                <PasswordInput
                                    id="pw-nueva"
                                    label="Nueva Contrasena"
                                    placeholder="Minimo 8 caracteres"
                                    value={newPw}
                                    onChange={(value) => {
                                        setNewPw(value)
                                        setPwErrors((prev) => ({
                                            ...prev,
                                            nueva: undefined,
                                            confirmar: undefined,
                                        }))
                                    }}
                                    error={pwErrors.nueva}
                                />

                                <PasswordInput
                                    id="pw-confirmar"
                                    label="Confirmar Contrasena"
                                    placeholder="Repite la contrasena"
                                    value={confirmPw}
                                    onChange={(value) => {
                                        setConfirmPw(value)
                                        setPwErrors((prev) => ({
                                            ...prev,
                                            confirmar: undefined,
                                        }))
                                    }}
                                    error={pwErrors.confirmar}
                                />

                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {isChangingPassword ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ProfilePhotoPickerDialog
                open={isPhotoDialogOpen}
                onOpenChange={setIsPhotoDialogOpen}
                nombre={user?.nombre}
                apellido={user?.apellido}
                fotoPerfilUrl={user?.fotoPerfilUrl}
                isUploading={isUploadingProfilePhoto}
                isDeleting={isDeletingProfilePhoto}
                onUpload={handleUploadProfilePhoto}
                onDelete={handleDeleteProfilePhoto}
            />
        </div>
    )
}
