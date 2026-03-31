import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDocumentoLookup } from "@/lib/hooks/useDocumentoLookup"
import {
    emptyClienteCreate,
    getTipoDocumentoOption,
    isTipoDocumento,
    TIPO_DOCUMENTO_OPTIONS,
    type Cliente,
    type ClienteCreatePrefill,
    type ClienteCreateRequest,
    type TipoDocumento,
} from "@/lib/types/cliente"
import {
    applyClienteDocumentoAutofill,
    getClienteAutofillFromDni,
    getClienteAutofillFromRuc,
} from "@/lib/utils/cliente-documento"

interface ClienteCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (payload: ClienteCreateRequest) => Promise<Cliente | null>
    prefill?: ClienteCreatePrefill | null
    onCreated?: (cliente: Cliente) => void
}

function buildInitialForm(prefill?: ClienteCreatePrefill | null): ClienteCreateRequest {
    return {
        ...emptyClienteCreate,
        tipoDocumento: prefill?.tipoDocumento ?? emptyClienteCreate.tipoDocumento,
        nroDocumento: prefill?.nroDocumento?.trim() ?? "",
        nombres: prefill?.nombres ?? "",
        telefono: prefill?.telefono ?? "",
        correo: prefill?.correo ?? "",
        direccion: prefill?.direccion ?? "",
    }
}

function resolveAutoLookupKey(prefill?: ClienteCreatePrefill | null) {
    if (!prefill?.autoLookup) return ""

    const tipoDocumento = prefill.tipoDocumento
    const nroDocumento = prefill.nroDocumento?.trim() ?? ""
    if ((tipoDocumento !== "DNI" && tipoDocumento !== "RUC") || !nroDocumento) {
        return ""
    }

    const option = getTipoDocumentoOption(tipoDocumento)
    if (!option) return ""
    if (nroDocumento.length < option.minLength || nroDocumento.length > option.maxLength) {
        return ""
    }

    return `${tipoDocumento}:${nroDocumento}`
}

function getAutofillFromLookupResult(
    tipoDocumento: "DNI" | "RUC",
    payload: unknown
) {
    return tipoDocumento === "DNI"
        ? getClienteAutofillFromDni(payload as Parameters<typeof getClienteAutofillFromDni>[0])
        : getClienteAutofillFromRuc(payload as Parameters<typeof getClienteAutofillFromRuc>[0])
}

export function ClienteCreateDialog({
    open,
    onOpenChange,
    onCreate,
    prefill,
    onCreated,
}: ClienteCreateDialogProps) {
    const initialForm = useMemo(
        () => buildInitialForm(prefill),
        [prefill]
    )

    const [form, setForm] = useState<ClienteCreateRequest>(initialForm)
    const [isSaving, setIsSaving] = useState(false)
    const autoLookupRef = useRef("")

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

    const isCreateValid = useMemo(
        () =>
            form.nombres.trim() !== "" &&
            form.telefono.length === 9 &&
            hasRequiredDireccion &&
            isNroDocValid,
        [form, hasRequiredDireccion, isNroDocValid]
    )

    const autoLookupKey = useMemo(() => resolveAutoLookupKey(prefill), [prefill])

    useEffect(() => {
        if (!open) {
            autoLookupRef.current = ""
            return
        }

        clearDocumentLookupError()
        setForm(initialForm)
    }, [clearDocumentLookupError, initialForm, open])

    useEffect(() => {
        if (!open || !autoLookupKey) return
        if (autoLookupRef.current === autoLookupKey) return

        autoLookupRef.current = autoLookupKey

        const [tipoDocumento, nroDocumento] = autoLookupKey.split(":") as [
            TipoDocumento,
            string,
        ]

        const runAutoLookup = async () => {
            const result = await lookupDocumento(tipoDocumento, nroDocumento)
            if (!result.ok) return

            setForm((previous) =>
                applyClienteDocumentoAutofill(
                    previous,
                    getAutofillFromLookupResult(result.tipoDocumento, result.data)
                )
            )
        }

        void runAutoLookup()
    }, [autoLookupKey, lookupDocumento, open])

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            onOpenChange(nextOpen)
            clearDocumentLookupError()

            if (!nextOpen) {
                autoLookupRef.current = ""
                setForm(buildInitialForm(null))
            }
        },
        [clearDocumentLookupError, onOpenChange]
    )

    const applyLookupResult = useCallback(
        (tipoDocumento: "DNI" | "RUC", payload: unknown) => {
            setForm((previous) =>
                applyClienteDocumentoAutofill(
                    previous,
                    getAutofillFromLookupResult(tipoDocumento, payload)
                )
            )
        },
        []
    )

    const handleLookupDocument = useCallback(async () => {
        if (!canLookupDocument) return
        if (!isTipoDocumento(form.tipoDocumento)) return

        const result = await lookupDocumento(
            form.tipoDocumento,
            form.nroDocumento
        )

        if (!result.ok) return

        applyLookupResult(result.tipoDocumento, result.data)
    }, [
        applyLookupResult,
        canLookupDocument,
        form.nroDocumento,
        form.tipoDocumento,
        lookupDocumento,
    ])

    const handleCreate = async () => {
        if (!isCreateValid) return

        const payload: ClienteCreateRequest = {
            ...form,
            nroDocumento: isSinDoc ? "" : form.nroDocumento,
        }

        setIsSaving(true)
        try {
            const createdCliente = await onCreate(payload)
            if (createdCliente) {
                onCreated?.(createdCliente)
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
                    <div className="grid gap-2">
                        <Label htmlFor="cc-nombres">Nombre completo</Label>
                        <Input
                            id="cc-nombres"
                            placeholder="Maria Garcia Lopez"
                            value={form.nombres}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    nombres: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2 grid gap-2">
                            <Label htmlFor="cc-tipo-doc">Tipo Doc.</Label>
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
                            <div className="flex items-start gap-2">
                                <Input
                                    id="cc-nro-doc"
                                    placeholder={isSinDoc ? "-" : "12345678"}
                                    maxLength={nroDocMaxLength}
                                    disabled={isSinDoc}
                                    value={isSinDoc ? "" : form.nroDocumento}
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
                                        className="shrink-0"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cc-telefono">Telefono</Label>
                            <Input
                                id="cc-telefono"
                                placeholder="987654321"
                                maxLength={9}
                                value={form.telefono}
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
                            <Label htmlFor="cc-correo">Correo (Opcional)</Label>
                            <Input
                                id="cc-correo"
                                type="email"
                                placeholder="cliente@email.com (Opcional)"
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

                    <div className="grid gap-2">
                        <Label htmlFor="cc-direccion">
                            {isRuc
                                ? "Direccion (Obligatoria para RUC)"
                                : "Direccion (Opcional)"}
                        </Label>
                        <Textarea
                            id="cc-direccion"
                            placeholder={
                                isRuc
                                    ? "Av. Principal 123, Lima"
                                    : "Av. Principal 123, Lima (Opcional)"
                            }
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
                        {isRuc && form.direccion.trim() === "" && (
                            <p className="text-xs text-red-500">
                                La direccion es obligatoria cuando el tipo de documento es RUC.
                            </p>
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
