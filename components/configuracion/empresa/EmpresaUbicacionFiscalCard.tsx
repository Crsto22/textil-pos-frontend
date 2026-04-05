import { memo } from "react"
import {
    AlertCircle,
    Building,
    CheckCircle2,
    MapPin,
    MapPinned,
} from "lucide-react"

import { EmpresaUbigeoFields } from "@/components/configuracion/empresa/EmpresaUbigeoFields"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    isValidSunatCode,
    type EmpresaFormErrors,
} from "@/lib/hooks/useEmpresaConfig"
import type { EmpresaLocationFields } from "@/lib/types/empresa"

interface EmpresaUbicacionFiscalCardProps {
    enabled: boolean
    direccion: string
    codigoEstablecimientoSunat: string
    locationFields: EmpresaLocationFields
    formErrors: EmpresaFormErrors
    onDireccionChange: (value: string) => void
    onCodigoEstablecimientoSunatChange: (value: string) => void
    onLocationChange: (location: EmpresaLocationFields) => void
    onClearError: (field: keyof EmpresaFormErrors) => void
}

function FieldWrapper({
    label,
    icon: Icon,
    valid,
    error,
    children,
}: {
    label: string
    icon: React.ElementType
    valid?: boolean
    error?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </Label>
                {valid && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Valido
                    </span>
                )}
            </div>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    )
}

function EmpresaUbicacionFiscalCardComponent({
    enabled,
    direccion,
    codigoEstablecimientoSunat,
    locationFields,
    formErrors,
    onDireccionChange,
    onCodigoEstablecimientoSunatChange,
    onLocationChange,
    onClearError,
}: EmpresaUbicacionFiscalCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                        <MapPinned className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <CardTitle className="text-sm">
                            Direccion Fiscal y SUNAT
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Direccion, ubigeo y codigo de establecimiento
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                <FieldWrapper
                    label="Direccion fiscal"
                    icon={MapPin}
                    valid={!!direccion.trim() && !formErrors.direccion}
                    error={formErrors.direccion}
                >
                    <Textarea
                        value={direccion}
                        onChange={(event) => {
                            onDireccionChange(event.target.value)
                            if (formErrors.direccion) onClearError("direccion")
                        }}
                        placeholder="Ej: Av. los Postes Este 123"
                        aria-invalid={!!formErrors.direccion}
                        className="min-h-[84px] resize-none"
                    />
                </FieldWrapper>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_220px]">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPinned className="h-3.5 w-3.5" />
                            Ubigeo de Peru
                        </Label>
                        <EmpresaUbigeoFields
                            enabled={enabled}
                            form={locationFields}
                            idPrefix="empresa"
                            onChange={onLocationChange}
                        />
                        {formErrors.ubigeo && (
                            <p className="flex items-center gap-1 text-[11px] text-destructive">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {formErrors.ubigeo}
                            </p>
                        )}
                    </div>

                    <FieldWrapper
                        label="Codigo SUNAT"
                        icon={Building}
                        valid={isValidSunatCode(codigoEstablecimientoSunat)}
                        error={formErrors.codigoEstablecimientoSunat}
                    >
                        <Input
                            value={codigoEstablecimientoSunat}
                            onChange={(event) => {
                                const nextValue = event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 4)
                                onCodigoEstablecimientoSunatChange(nextValue)
                                if (formErrors.codigoEstablecimientoSunat) {
                                    onClearError(
                                        "codigoEstablecimientoSunat"
                                    )
                                }
                            }}
                            placeholder="0000"
                            maxLength={4}
                            aria-invalid={
                                !!formErrors.codigoEstablecimientoSunat
                            }
                        />
                    </FieldWrapper>
                </div>
            </CardContent>
        </Card>
    )
}

export const EmpresaUbicacionFiscalCard = memo(
    EmpresaUbicacionFiscalCardComponent
)
