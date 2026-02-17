import { useMemo, useState } from "react"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import {
    emptyClienteCreate,
    getTipoDocumentoOption,
    isTipoDocumento,
    TIPO_DOCUMENTO_OPTIONS,
    type ClienteCreateRequest,
} from "@/lib/types/cliente"

interface ClienteCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (payload: ClienteCreateRequest) => Promise<boolean>
}

export function ClienteCreateDialog({
    open,
    onOpenChange,
    onCreate,
}: ClienteCreateDialogProps) {
    const { user } = useAuth()

    // Si el usuario autenticado tiene sucursal, se usa automáticamente
    const userHasSucursal =
        typeof user?.idSucursal === "number" && user.idSucursal > 0

    const [form, setForm] = useState<ClienteCreateRequest>(() => ({
        ...emptyClienteCreate,
        idSucursal: userHasSucursal ? user.idSucursal : null,
    }))
    const [isSaving, setIsSaving] = useState(false)

    // Solo cargamos sucursales si el usuario NO tiene una asignada
    const {
        sucursalOptions,
        loadingSucursales,
        errorSucursales,
        searchSucursal,
        setSearchSucursal,
    } = useSucursalOptions(open && !userHasSucursal)

    const hasValidSucursal =
        typeof form.idSucursal === "number" && form.idSucursal > 0

    const tipoDocOption = getTipoDocumentoOption(form.tipoDocumento)
    const isSinDoc = form.tipoDocumento === "SIN_DOC"
    const nroDocMaxLength = tipoDocOption?.maxLength ?? 20
    const nroDocMinLength = tipoDocOption?.minLength ?? 0
    const isAlphanumeric = tipoDocOption?.alphanumeric === true

    const comboboxOptions = useMemo<ComboboxOption[]>(
        () =>
            hasValidSucursal &&
                !sucursalOptions.some((option) => option.value === String(form.idSucursal))
                ? [
                    {
                        value: String(form.idSucursal),
                        label: `Sucursal #${form.idSucursal}`,
                    },
                    ...sucursalOptions,
                ]
                : sucursalOptions,
        [form.idSucursal, hasValidSucursal, sucursalOptions]
    )

    const isNroDocValid = useMemo(() => {
        if (isSinDoc) return true
        const len = form.nroDocumento.trim().length
        return len >= nroDocMinLength && len <= nroDocMaxLength
    }, [form.nroDocumento, isSinDoc, nroDocMaxLength, nroDocMinLength])

    const isCreateValid = useMemo(
        () =>
            hasValidSucursal &&
            form.nombres.trim() !== "" &&
            form.telefono.length === 9 &&
            form.correo.trim() !== "" &&
            isNroDocValid,
        [form, hasValidSucursal, isNroDocValid]
    )

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
            setForm({
                ...emptyClienteCreate,
                idSucursal: userHasSucursal ? user!.idSucursal : null,
            })
            setSearchSucursal("")
        }
    }

    const handleCreate = async () => {
        if (!isCreateValid) return

        const payload: ClienteCreateRequest = {
            ...form,
            nroDocumento: isSinDoc ? "" : form.nroDocumento,
            idSucursal: hasValidSucursal ? form.idSucursal : null,
        }

        setIsSaving(true)
        try {
            const success = await onCreate(payload)
            if (success) {
                handleOpenChange(false)
            }
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-120">
                <DialogHeader>
                    <DialogTitle>Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Completa los datos para registrar un nuevo cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Nombre completo */}
                    <div className="grid gap-2">
                        <Label htmlFor="cc-nombres">Nombre completo</Label>
                        <Input
                            id="cc-nombres"
                            placeholder="María García López"
                            value={form.nombres}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    nombres: event.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Tipo y Número de documento */}
                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2 grid gap-2">
                            <Label htmlFor="cc-tipo-doc">Tipo Doc.</Label>
                            <Select
                                value={form.tipoDocumento}
                                onValueChange={(value) =>
                                    setForm((previous) => {
                                        if (!isTipoDocumento(value)) return previous
                                        return {
                                            ...previous,
                                            tipoDocumento: value,
                                            nroDocumento: "",
                                        }
                                    })
                                }
                            >
                                <SelectTrigger className="w-full" id="cc-tipo-doc">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPO_DOCUMENTO_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 grid gap-2">
                            <Label htmlFor="cc-nro-doc">Nro. Documento</Label>
                            <Input
                                id="cc-nro-doc"
                                placeholder={isSinDoc ? "—" : "12345678"}
                                maxLength={nroDocMaxLength}
                                disabled={isSinDoc}
                                value={isSinDoc ? "" : form.nroDocumento}
                                onChange={(event) => {
                                    const raw = event.target.value
                                    const sanitized = isAlphanumeric
                                        ? raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, nroDocMaxLength)
                                        : raw.replace(/\D/g, "").slice(0, nroDocMaxLength)
                                    setForm((previous) => ({
                                        ...previous,
                                        nroDocumento: sanitized,
                                    }))
                                }}
                            />
                            {!isSinDoc &&
                                form.nroDocumento.length > 0 &&
                                form.nroDocumento.length < nroDocMinLength && (
                                    <p className="text-xs text-red-500">
                                        {nroDocMinLength === nroDocMaxLength
                                            ? `Debe tener ${nroDocMinLength} ${isAlphanumeric ? "caracteres" : "dígitos"} (${form.nroDocumento.length}/${nroDocMaxLength})`
                                            : `Mínimo ${nroDocMinLength} ${isAlphanumeric ? "caracteres" : "dígitos"} (${form.nroDocumento.length}/${nroDocMaxLength})`}
                                    </p>
                                )}
                        </div>
                    </div>

                    {/* Teléfono y Correo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cc-telefono">Teléfono</Label>
                            <Input
                                id="cc-telefono"
                                placeholder="987654321"
                                maxLength={9}
                                value={form.telefono}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        telefono: event.target.value.replace(/\D/g, "").slice(0, 9),
                                    }))
                                }
                            />
                            {form.telefono.length > 0 && form.telefono.length < 9 && (
                                <p className="text-xs text-red-500">
                                    Debe tener 9 dígitos ({form.telefono.length}/9)
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cc-correo">Correo</Label>
                            <Input
                                id="cc-correo"
                                type="email"
                                placeholder="cliente@email.com"
                                value={form.correo}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        correo: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="grid gap-2">
                        <Label htmlFor="cc-direccion">Dirección</Label>
                        <Textarea
                            id="cc-direccion"
                            placeholder="Av. Principal 123, Lima"
                            value={form.direccion}
                            rows={2}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    direccion: event.target.value,
                                }))
                            }
                            className="resize-none"
                        />
                    </div>

                    {/* Sucursal */}
                    <div className="grid gap-2">
                        <Label htmlFor="cc-sucursal">Sucursal</Label>
                        {userHasSucursal ? (
                            <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3">
                                <span className="truncate text-sm font-medium">
                                    {user?.nombreSucursal || `Sucursal #${user?.idSucursal}`}
                                </span>
                            </div>
                        ) : (
                            <>
                                <Combobox
                                    id="cc-sucursal"
                                    value={hasValidSucursal ? String(form.idSucursal) : ""}
                                    options={comboboxOptions}
                                    searchValue={searchSucursal}
                                    onSearchValueChange={setSearchSucursal}
                                    onValueChange={(value) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            idSucursal: Number(value),
                                        }))
                                    }
                                    placeholder="Selecciona sucursal"
                                    searchPlaceholder="Buscar sucursal..."
                                    emptyMessage="No se encontraron sucursales"
                                    loading={loadingSucursales}
                                />
                                {errorSucursales && (
                                    <p className="text-xs text-red-500">{errorSucursales}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={handleCreate}
                        disabled={!isCreateValid || isSaving}
                    >
                        {isSaving ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
