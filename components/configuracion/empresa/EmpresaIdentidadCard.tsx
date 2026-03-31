import { memo } from "react"
import {
    AlertCircle,
    BadgeCheck,
    Building2,
    Calendar,
    CheckCircle2,
    FileText,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { EmpresaFormErrors } from "@/lib/hooks/useEmpresaConfig"

interface EmpresaIdentidadCardProps {
    nombre: string
    nombreComercial: string
    razonSocial: string
    generaFacturacionElectronica: boolean
    fechaCreacion: string | undefined
    formErrors: EmpresaFormErrors
    onNombreChange: (value: string) => void
    onNombreComercialChange: (value: string) => void
    onRazonSocialChange: (value: string) => void
    onFacturacionToggle: () => void
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

function EmpresaIdentidadCardComponent({
    nombre,
    nombreComercial,
    razonSocial,
    generaFacturacionElectronica,
    fechaCreacion,
    formErrors,
    onNombreChange,
    onNombreComercialChange,
    onRazonSocialChange,
    onFacturacionToggle,
    onClearError,
}: EmpresaIdentidadCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">
                                Identidad Comercial
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Nombre legal, comercial y estado de facturacion
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Label
                            htmlFor="facturacion-switch"
                            className={`cursor-pointer text-xs font-medium ${
                                generaFacturacionElectronica
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {generaFacturacionElectronica
                                ? "FE activa"
                                : "FE inactiva"}
                        </Label>
                        <Switch
                            id="facturacion-switch"
                            checked={generaFacturacionElectronica}
                            onCheckedChange={onFacturacionToggle}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <FieldWrapper
                        label="Nombre legal"
                        icon={Building2}
                        valid={!!nombre.trim() && !formErrors.nombre}
                        error={formErrors.nombre}
                    >
                        <Input
                            value={nombre}
                            onChange={(event) => {
                                onNombreChange(event.target.value)
                                if (formErrors.nombre) onClearError("nombre")
                            }}
                            placeholder="Ej: Textiles del Peru S.A.C."
                            aria-invalid={!!formErrors.nombre}
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        label="Nombre comercial"
                        icon={BadgeCheck}
                        valid={
                            !!nombreComercial.trim() &&
                            !formErrors.nombreComercial
                        }
                        error={formErrors.nombreComercial}
                    >
                        <Input
                            value={nombreComercial}
                            onChange={(event) => {
                                onNombreComercialChange(event.target.value)
                                if (formErrors.nombreComercial)
                                    onClearError("nombreComercial")
                            }}
                            placeholder="Ej: LP STORE"
                            aria-invalid={!!formErrors.nombreComercial}
                        />
                    </FieldWrapper>
                </div>

                <FieldWrapper
                    label="Razon social juridica"
                    icon={FileText}
                    valid={!!razonSocial.trim() && !formErrors.razonSocial}
                    error={formErrors.razonSocial}
                >
                    <Input
                        value={razonSocial}
                        onChange={(event) => {
                            onRazonSocialChange(event.target.value)
                            if (formErrors.razonSocial)
                                onClearError("razonSocial")
                        }}
                        placeholder="Razon social registrada en SUNAT"
                        aria-invalid={!!formErrors.razonSocial}
                    />
                </FieldWrapper>

                <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Fecha de registro
                    </Label>
                    <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
                        <span className="text-sm text-foreground/70">
                            {fechaCreacion
                                ? new Date(fechaCreacion).toLocaleDateString(
                                      "es-PE",
                                      {
                                          year: "numeric",
                                          month: "long",
                                          day: "2-digit",
                                      }
                                  )
                                : "-"}
                        </span>
                        <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Solo lectura
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const EmpresaIdentidadCard = memo(EmpresaIdentidadCardComponent)
