import { useEffect, useMemo, useState } from "react"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import {
    emptyClienteUpdate,
    getTipoDocumentoOption,
    isTipoDocumento,
    TIPO_DOCUMENTO_OPTIONS,
    type Cliente,
    type ClienteUpdateRequest,
} from "@/lib/types/cliente"

interface ClienteEditDialogProps {
    open: boolean
    cliente: Cliente | null
    onOpenChange: (open: boolean) => void
    onUpdate: (id: number, payload: ClienteUpdateRequest) => Promise<boolean>
}

export function ClienteEditDialog({
    open,
    cliente,
    onOpenChange,
    onUpdate,
}: ClienteEditDialogProps) {
    const { user } = useAuth()

    const userHasSucursal =
        typeof user?.idSucursal === "number" && user.idSucursal > 0

    const [form, setForm] = useState<ClienteUpdateRequest>(emptyClienteUpdate)
    const [isUpdating, setIsUpdating] = useState(false)

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
                        label:
                            cliente?.nombreSucursal || `Sucursal #${form.idSucursal}`,
                    },
                    ...sucursalOptions,
                ]
                : sucursalOptions,
        [form.idSucursal, hasValidSucursal, sucursalOptions, cliente?.nombreSucursal]
    )

    /* ── Hidratar formulario al abrir ──────────────────────── */

    useEffect(() => {
        if (!open || !cliente) return

        setForm({
            tipoDocumento: cliente.tipoDocumento,
            nroDocumento: cliente.nroDocumento ?? "",
            nombres: cliente.nombres,
            telefono: cliente.telefono,
            correo: cliente.correo,
            direccion: cliente.direccion,
            estado: cliente.estado,
            idSucursal: userHasSucursal ? user!.idSucursal : cliente.idSucursal,
        })
        setSearchSucursal("")
    }, [open, setSearchSucursal, cliente, userHasSucursal, user])

    const isNroDocValid = useMemo(() => {
        if (isSinDoc) return true
        const len = form.nroDocumento.trim().length
        return len >= nroDocMinLength && len <= nroDocMaxLength
    }, [form.nroDocumento, isSinDoc, nroDocMaxLength, nroDocMinLength])

    const isEditValid = useMemo(
        () =>
            form.nombres.trim() !== "" &&
            form.telefono.length === 9 &&
            form.correo.trim() !== "" &&
            isNroDocValid,
        [form, isNroDocValid]
    )

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
            setForm(emptyClienteUpdate)
            setSearchSucursal("")
        }
    }

    const handleUpdate = async () => {
        if (!cliente || !isEditValid) return

        const payload: ClienteUpdateRequest = {
            ...form,
            nroDocumento: isSinDoc ? "" : form.nroDocumento,
            idSucursal: hasValidSucursal ? form.idSucursal : null,
        }

        setIsUpdating(true)
        try {
            const success = await onUpdate(cliente.idCliente, payload)
            if (success) {
                handleOpenChange(false)
            }
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-120">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del cliente seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Nombre completo */}
                    <div className="grid gap-2">
                        <Label htmlFor="ce-nombres">Nombre completo</Label>
                        <Input
                            id="ce-nombres"
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
                            <Label htmlFor="ce-tipo-doc">Tipo Doc.</Label>
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
                                <SelectTrigger className="w-full" id="ce-tipo-doc">
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
                            <Label htmlFor="ce-nro-doc">Nro. Documento</Label>
                            <Input
                                id="ce-nro-doc"
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
                            <Label htmlFor="ce-telefono">Teléfono</Label>
                            <Input
                                id="ce-telefono"
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
                            <Label htmlFor="ce-correo">Correo</Label>
                            <Input
                                id="ce-correo"
                                type="email"
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
                        <Label htmlFor="ce-direccion">Dirección</Label>
                        <Textarea
                            id="ce-direccion"
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

                    {/* Estado y Sucursal */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ce-estado">Estado</Label>
                            <div className="flex h-9 items-center justify-between rounded-md border px-3">
                                <span
                                    className={`text-sm font-medium ${form.estado === "ACTIVO"
                                            ? "text-emerald-600"
                                            : "text-slate-500"
                                        }`}
                                >
                                    {form.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                                </span>
                                <Switch
                                    id="ce-estado"
                                    checked={form.estado === "ACTIVO"}
                                    onCheckedChange={(checked) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            estado: checked ? "ACTIVO" : "INACTIVO",
                                        }))
                                    }
                                    aria-label="Cambiar estado del cliente"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ce-sucursal">Sucursal</Label>
                            {userHasSucursal ? (
                                <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3">
                                    <span className="truncate text-sm font-medium">
                                        {user?.nombreSucursal || `Sucursal #${user?.idSucursal}`}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Combobox
                                        id="ce-sucursal"
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
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={handleUpdate}
                        disabled={!isEditValid || isUpdating}
                    >
                        {isUpdating ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
