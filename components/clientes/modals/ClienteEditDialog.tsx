import { useCallback, useEffect, useMemo, useState } from "react"
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useDocumentoLookup } from "@/lib/hooks/useDocumentoLookup"
import {
    emptyClienteUpdate,
    getTipoDocumentoOption,
    isTipoDocumento,
    TIPO_DOCUMENTO_OPTIONS,
    type Cliente,
    type ClienteUpdateRequest,
} from "@/lib/types/cliente"
import {
    applyClienteDocumentoAutofill,
    getClienteAutofillFromDni,
    getClienteAutofillFromRuc,
} from "@/lib/utils/cliente-documento"

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
    const [form, setForm] = useState<ClienteUpdateRequest>(emptyClienteUpdate)
    const [isUpdating, setIsUpdating] = useState(false)

    const {
        loading: isLookingUpDocument,
        error: documentLookupError,
        clearError: clearDocumentLookupError,
        lookupDocumento,
    } = useDocumentoLookup()

    const tipoDocOption = getTipoDocumentoOption(form.tipoDocumento)
    const isSinDoc = form.tipoDocumento === "SIN_DOC"
    const isRuc = form.tipoDocumento === "RUC"
    const nroDocMaxLength = tipoDocOption?.maxLength ?? 20
    const nroDocMinLength = tipoDocOption?.minLength ?? 0
    const isAlphanumeric = tipoDocOption?.alphanumeric === true

    useEffect(() => {
        if (!open || !cliente) return

        clearDocumentLookupError()
        setForm({
            tipoDocumento: cliente.tipoDocumento,
            nroDocumento: cliente.nroDocumento ?? "",
            nombres: cliente.nombres ?? "",
            telefono: cliente.telefono ?? "",
            correo: cliente.correo ?? "",
            direccion: cliente.direccion ?? "",
            estado: cliente.estado ?? "ACTIVO",
        })
    }, [clearDocumentLookupError, cliente, open])

    const isNroDocValid = useMemo(() => {
        if (isSinDoc) return true
        const length = form.nroDocumento.trim().length
        return length >= nroDocMinLength && length <= nroDocMaxLength
    }, [form.nroDocumento, isSinDoc, nroDocMaxLength, nroDocMinLength])

    const canLookupDocument =
        (form.tipoDocumento === "DNI" || form.tipoDocumento === "RUC") &&
        form.nroDocumento.trim().length > 0 &&
        isNroDocValid

    const hasRequiredDireccion = !isRuc || form.direccion.trim() !== ""

    const isEditValid = useMemo(
        () =>
            form.nombres.trim() !== "" &&
            form.telefono.length === 9 &&
            hasRequiredDireccion &&
            isNroDocValid,
        [form, hasRequiredDireccion, isNroDocValid]
    )

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            onOpenChange(nextOpen)
            clearDocumentLookupError()

            if (!nextOpen) {
                setForm(emptyClienteUpdate)
            }
        },
        [clearDocumentLookupError, onOpenChange]
    )

    const handleLookupDocument = useCallback(async () => {
        if (!canLookupDocument) return
        if (!isTipoDocumento(form.tipoDocumento)) return

        const result = await lookupDocumento(
            form.tipoDocumento,
            form.nroDocumento
        )

        if (!result.ok) return

        setForm((previous) =>
            applyClienteDocumentoAutofill(
                previous,
                result.tipoDocumento === "DNI"
                    ? getClienteAutofillFromDni(result.data)
                    : getClienteAutofillFromRuc(result.data)
            )
        )
    }, [
        canLookupDocument,
        form.nroDocumento,
        form.tipoDocumento,
        lookupDocumento,
    ])

    const handleUpdate = async () => {
        if (!cliente || !isEditValid) return

        const payload: ClienteUpdateRequest = {
            ...form,
            nroDocumento: isSinDoc ? "" : form.nroDocumento,
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
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="bottom"
                className="flex h-[92dvh] flex-col gap-0 p-0"
            >
                <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
                    <SheetTitle className="text-sm">Editar Cliente</SheetTitle>
                    <SheetDescription className="text-xs sm:text-sm">
                        Modifica los datos del cliente seleccionado.
                    </SheetDescription>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ce-nombres">Nombre completo</Label>
                            <Input
                                id="ce-nombres"
                                value={form.nombres ?? ""}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        nombres: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-5">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="ce-tipo-doc">Tipo Doc.</Label>
                                <Select
                                    value={form.tipoDocumento}
                                    onValueChange={(value) =>
                                        setForm((previous) => {
                                            if (!isTipoDocumento(value)) return previous

                                            clearDocumentLookupError()
                                            return {
                                                ...previous,
                                                tipoDocumento: value,
                                                nroDocumento: "",
                                            }
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-11 w-full" id="ce-tipo-doc">
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

                            <div className="grid gap-2 sm:col-span-3">
                                <Label htmlFor="ce-nro-doc">Nro. Documento</Label>
                                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
                                    <Input
                                        id="ce-nro-doc"
                                        placeholder={isSinDoc ? "-" : "12345678"}
                                        maxLength={nroDocMaxLength}
                                        disabled={isSinDoc}
                                        value={isSinDoc ? "" : (form.nroDocumento ?? "")}
                                        onChange={(event) => {
                                            clearDocumentLookupError()

                                            const raw = event.target.value
                                            const sanitized = isAlphanumeric
                                                ? raw
                                                      .replace(/[^a-zA-Z0-9]/g, "")
                                                      .slice(0, nroDocMaxLength)
                                                : raw
                                                      .replace(/\D/g, "")
                                                      .slice(0, nroDocMaxLength)

                                            setForm((previous) => ({
                                                ...previous,
                                                nroDocumento: sanitized,
                                            }))
                                        }}
                                    />
                                    {(form.tipoDocumento === "DNI" ||
                                        form.tipoDocumento === "RUC") && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-11 shrink-0 sm:h-9"
                                            onClick={() => {
                                                void handleLookupDocument()
                                            }}
                                            disabled={!canLookupDocument || isLookingUpDocument}
                                        >
                                            {isLookingUpDocument ? (
                                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <MagnifyingGlassIcon className="h-4 w-4" />
                                            )}
                                            Buscar
                                        </Button>
                                    )}
                                </div>
                                {documentLookupError ? (
                                    <p className="text-xs text-red-500">
                                        {documentLookupError}
                                    </p>
                                ) : (
                                    !isSinDoc &&
                                    form.nroDocumento.length > 0 &&
                                    form.nroDocumento.length < nroDocMinLength && (
                                        <p className="text-xs text-red-500">
                                            {nroDocMinLength === nroDocMaxLength
                                                ? `Debe tener ${nroDocMinLength} ${isAlphanumeric ? "caracteres" : "digitos"} (${form.nroDocumento.length}/${nroDocMaxLength})`
                                                : `Minimo ${nroDocMinLength} ${isAlphanumeric ? "caracteres" : "digitos"} (${form.nroDocumento.length}/${nroDocMaxLength})`}
                                        </p>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="ce-telefono">Telefono</Label>
                                <Input
                                    id="ce-telefono"
                                    maxLength={9}
                                    value={form.telefono ?? ""}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            telefono: event.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 9),
                                        }))
                                    }
                                />
                                {form.telefono.length > 0 && form.telefono.length < 9 && (
                                    <p className="text-xs text-red-500">
                                        Debe tener 9 digitos ({form.telefono.length}/9)
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ce-correo">Correo (Opcional)</Label>
                                <Input
                                    id="ce-correo"
                                    type="email"
                                    value={form.correo ?? ""}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            correo: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ce-direccion">
                                {isRuc
                                    ? "Direccion (Obligatoria para RUC)"
                                    : "Direccion (Opcional)"}
                            </Label>
                            <Textarea
                                id="ce-direccion"
                                placeholder={
                                    isRuc
                                        ? "Av. Principal 123, Lima"
                                        : "Av. Principal 123, Lima (Opcional)"
                                }
                                value={form.direccion ?? ""}
                                rows={2}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        direccion: event.target.value,
                                    }))
                                }
                                className="resize-none"
                            />
                            {isRuc && form.direccion.trim() === "" && (
                                <p className="text-xs text-red-500">
                                    La direccion es obligatoria cuando el tipo de documento es RUC.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ce-estado">Estado</Label>
                            <div className="flex h-11 items-center justify-between rounded-xl border px-3">
                                <span
                                    className={`text-sm font-medium ${
                                        form.estado === "ACTIVO"
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
                    </div>
                </div>

                <SheetFooter className="shrink-0 border-t border-slate-100 px-4 py-4 dark:border-slate-700/60">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" className="h-11">
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button
                        type="button"
                        onClick={handleUpdate}
                        disabled={!isEditValid || isUpdating}
                        className="h-11"
                    >
                        {isUpdating ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
