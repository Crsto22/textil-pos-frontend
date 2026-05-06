"use client"

import { useState, useCallback, type ComponentType, type FormEvent } from "react"
import {
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    EnvelopeIcon,
    EyeIcon,
    EyeSlashIcon,
    IdentificationIcon,
    LockClosedIcon,
    PhoneIcon,
    ShieldCheckIcon,
    UserIcon,
} from "@heroicons/react/24/outline"

import { CuentaProfileDialog } from "@/components/configuracion/cuenta/CuentaProfileDialog"
import {
    formatFechaCompleta,
    formatMemberSince,
    getReadOnlyValue,
} from "@/components/configuracion/cuenta/cuenta.utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleLabel } from "@/lib/auth/roles"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { AuthUser, ChangePasswordRequest } from "@/lib/auth/types"
import { validateProfilePhoto } from "@/lib/profile-photo"
import { toast } from "sonner"

interface ProfileFieldProps {
    label: string
    value: string
    icon?: ComponentType<{ className?: string }>
}

function ProfileField({ label, value, icon: Icon }: ProfileFieldProps) {
    return (
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-start gap-3">
                {Icon ? (
                    <div className="rounded-2xl bg-muted p-2.5 text-primary">
                        <Icon className="h-4 w-4" />
                    </div>
                ) : null}
                <div className="min-w-0">
                    <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.2em]">
                        {label}
                    </p>
                    <p className="text-foreground mt-2 break-words text-sm font-medium">
                        {value}
                    </p>
                </div>
            </div>
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
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
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
            <Card className="overflow-hidden border-0 p-0 shadow-sm">
                <div 
                    className="relative h-56 bg-cover bg-center sm:h-64"
                    style={{
                        backgroundImage: `url('/img/portada/portada.webp')`
                    }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_72%,black)_0%,color-mix(in_oklab,var(--primary)_48%,transparent)_48%,color-mix(in_oklab,var(--primary)_28%,white)_100%)]" />
                </div>

                <CardContent className="relative px-4 pb-6 pt-0 sm:px-6 lg:px-8">
                    <div className="-mt-20 flex flex-col gap-6">
                        <div className="bg-card/95 rounded-[32px] border border-border p-5 shadow-xl backdrop-blur sm:p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                        <span className="text-primary inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                                            Cuenta activa
                                        </span>
                                        <span className="text-primary inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                                            {getRoleLabel(user?.rol ?? "")}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center gap-4">
                                        <UserAvatar
                                            nombre={user?.nombre}
                                            apellido={user?.apellido}
                                            fotoPerfilUrl={user?.fotoPerfilUrl}
                                            className="h-16 w-16 border border-border shadow-sm sm:h-18 sm:w-18"
                                            fallbackClassName="bg-primary text-primary-foreground"
                                            textClassName="text-lg font-bold"
                                        />
                                        <h1 className="text-foreground max-w-full text-3xl font-black tracking-tight sm:text-4xl">
                                            {getReadOnlyValue(user?.nombre)}{" "}
                                            {getReadOnlyValue(user?.apellido)}
                                        </h1>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className="text-muted-foreground inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                                            <EnvelopeIcon className="h-3.5 w-3.5" />
                                            {getReadOnlyValue(user?.correo)}
                                        </span>
                                        <span className="text-muted-foreground rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                                            {getReadOnlyValue(user?.nombreSucursal)}
                                        </span>
                                        <span className="text-muted-foreground rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                                            Miembro desde {formatMemberSince(user?.fechaCreacion)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                    <Button
                                        type="button"
                                        className="rounded-2xl px-5"
                                        onClick={() => setIsProfileDialogOpen(true)}
                                    >
                                        Cambiar foto de perfil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="perfil" className="gap-4">
                <TabsList className="mx-auto grid w-full max-w-md grid-cols-2 rounded-2xl">
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
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                        <Card>
                            <CardContent className="space-y-5">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        Resumen del perfil
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Datos clave del usuario autenticado en un formato rapido de consultar.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <ProfileField
                                        label="Nombre"
                                        value={getReadOnlyValue(user?.nombre)}
                                        icon={UserIcon}
                                    />
                                    <ProfileField
                                        label="Apellido"
                                        value={getReadOnlyValue(user?.apellido)}
                                        icon={UserIcon}
                                    />
                                    <ProfileField
                                        label="Correo"
                                        value={getReadOnlyValue(user?.correo)}
                                        icon={EnvelopeIcon}
                                    />
                                    <ProfileField
                                        label="DNI"
                                        value={getReadOnlyValue(user?.dni)}
                                        icon={IdentificationIcon}
                                    />
                                    <ProfileField
                                        label="Telefono"
                                        value={getReadOnlyValue(user?.telefono)}
                                        icon={PhoneIcon}
                                    />
                                    <ProfileField
                                        label="Rol"
                                        value={getRoleLabel(user?.rol ?? "")}
                                        icon={ShieldCheckIcon}
                                    />
                                    <ProfileField
                                        label="Fecha de creacion"
                                        value={formatFechaCompleta(user?.fechaCreacion)}
                                        icon={CalendarDaysIcon}
                                    />
                                    <ProfileField
                                        label="Sucursal"
                                        value={getReadOnlyValue(user?.nombreSucursal)}
                                        icon={BuildingStorefrontIcon}
                                    />
                                </div>

                                <div className="rounded-3xl border border-dashed border-border bg-muted/60 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h4 className="text-foreground text-sm font-semibold">
                                                Vista detallada de la cuenta
                                            </h4>
                                            <p className="text-muted-foreground text-sm">
                                                Abre la gestion de foto en drawer movil o modal de escritorio.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-2xl"
                                            onClick={() => setIsProfileDialogOpen(true)}
                                        >
                                            Cambiar foto
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-5">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        Estado de la cuenta
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Informacion operativa y de pertenencia dentro del sistema.
                                    </p>
                                </div>

                                <div className="rounded-[28px] border border-border bg-[linear-gradient(160deg,color-mix(in_oklab,var(--primary)_8%,var(--card)),var(--card))] p-5">
                                    <div className="grid gap-3">
                                        <div className="rounded-2xl border border-border bg-card p-4">
                                            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.18em]">
                                                Rol asignado
                                            </p>
                                            <p className="text-foreground mt-2 text-lg font-semibold">
                                                {getRoleLabel(user?.rol ?? "")}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-border bg-card p-4">
                                            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.18em]">
                                                Sucursal principal
                                            </p>
                                            <p className="text-foreground mt-2 text-lg font-semibold">
                                                {getReadOnlyValue(user?.nombreSucursal)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-border bg-card p-4">
                                            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.18em]">
                                                Fecha de alta
                                            </p>
                                            <p className="text-foreground mt-2 text-lg font-semibold">
                                                {formatMemberSince(user?.fechaCreacion)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                                            <span>Acceso ligado a permisos segun tu rol actual.</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <CalendarDaysIcon className="h-4 w-4 shrink-0" />
                                            <span>
                                                Cuenta creada el {formatFechaCompleta(user?.fechaCreacion)}
                                            </span>
                                        </div>
                                    </div>
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
                                    className="rounded-2xl"
                                >
                                    {isChangingPassword ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <CuentaProfileDialog
                open={isProfileDialogOpen}
                onOpenChange={setIsProfileDialogOpen}
                user={user}
                isUploading={isUploadingProfilePhoto}
                isDeleting={isDeletingProfilePhoto}
                onUpload={handleUploadProfilePhoto}
                onDelete={handleDeleteProfilePhoto}
            />
        </div>
    )
}
