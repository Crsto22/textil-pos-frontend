"use client"

import { useState, useCallback, useMemo, type FormEvent } from "react"
import {
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    UserIcon,
} from "@heroicons/react/24/outline"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ChangePasswordRequest } from "@/lib/auth/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"

function getInitials(nombre: string, apellido: string) {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

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
        <div className="space-y-1 pb-3 last:border-b-0 dark:border-slate-700">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">
                {label}
            </p>
            <p className="text-sm text-gray-500 ">
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
                    onClick={() => setVisible((v) => !v)}
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
    const { user } = useAuth()

    const [currentPw, setCurrentPw] = useState("")
    const [newPw, setNewPw] = useState("")
    const [confirmPw, setConfirmPw] = useState("")
    const [pwErrors, setPwErrors] = useState<PasswordErrors>({})
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const initials = useMemo(
        () => getInitials(user?.nombre ?? "U", user?.apellido ?? "S"),
        [user?.nombre, user?.apellido]
    )

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
            <div />

            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="w-full shrink-0 lg:w-72">
                    <Card className="overflow-hidden p-0">
                        <div className="relative h-24 bg-gradient-to-br from-blue-600 to-indigo-700">
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-blue-500 text-xl font-bold text-white shadow-md dark:border-gray-800">
                                    {initials}
                                </div>
                            </div>
                        </div>

                        <CardContent className="flex flex-col items-center px-5 pb-6 pt-11">
                            <h3 className="text-base font-semibold text-foreground">
                                {user?.nombre} {user?.apellido}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {getReadOnlyValue(user?.correo)}
                            </p>

                            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
                                <ShieldCheckIcon className="h-3.5 w-3.5" />
                                {getFormattedRole(user?.rol ?? "")}
                            </span>

                            <div className="mt-5 w-full space-y-3">
                                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                    <BuildingStorefrontIcon className="h-4 w-4 shrink-0" />
                                    <span>{getReadOnlyValue(user?.nombreSucursal)}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                    <CalendarDaysIcon className="h-4 w-4 shrink-0" />
                                    <span>Miembro desde {formatMemberSince(user?.fechaCreacion)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="min-w-0 flex-1">
                    <Tabs defaultValue="perfil" className="gap-4">
                        <TabsList className="w-full">
                            <TabsTrigger value="perfil" className="flex-1 gap-1.5">
                                <UserIcon className="h-4 w-4" />
                                Perfil
                            </TabsTrigger>
                            <TabsTrigger value="seguridad" className="flex-1 gap-1.5">
                                <LockClosedIcon className="h-4 w-4" />
                                Seguridad
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="perfil">
                            <Card>
                                <CardContent className="space-y-5">
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">
                                            Informacion personal
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Datos del usuario autenticado en modo solo lectura
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
                        </TabsContent>

                        <TabsContent value="seguridad" className="space-y-5">
                            <Card>
                                <CardContent className="space-y-5">
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">
                                            Cambiar contrasena
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Asegurate de usar una contrasena segura de al menos 8 caracteres
                                        </p>
                                    </div>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                        <PasswordInput
                                            id="pw-actual"
                                            label="Contrasena Actual"
                                            placeholder="********"
                                            value={currentPw}
                                            onChange={(v) => {
                                                setCurrentPw(v)
                                                setPwErrors((prev) => ({ ...prev, current: undefined }))
                                            }}
                                            error={pwErrors.current}
                                        />

                                        <PasswordInput
                                            id="pw-nueva"
                                            label="Nueva Contrasena"
                                            placeholder="Minimo 8 caracteres"
                                            value={newPw}
                                            onChange={(v) => {
                                                setNewPw(v)
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
                                            onChange={(v) => {
                                                setConfirmPw(v)
                                                setPwErrors((prev) => ({ ...prev, confirmar: undefined }))
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
                </div>
            </div>
        </div>
    )
}
