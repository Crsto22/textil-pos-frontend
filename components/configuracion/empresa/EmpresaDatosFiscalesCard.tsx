import { memo } from "react"
import { AlertCircle, CheckCircle2, Hash, Mail, Phone, ShieldCheck } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    isValidEmail,
    isValidPhone,
    isValidRuc,
    type EmpresaFormErrors,
} from "@/lib/hooks/useEmpresaConfig"

interface EmpresaDatosFiscalesCardProps {
    ruc: string
    correo: string
    telefono: string
    formErrors: EmpresaFormErrors
    onRucChange: (value: string) => void
    onCorreoChange: (value: string) => void
    onTelefonoChange: (value: string) => void
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

function EmpresaDatosFiscalesCardComponent({
    ruc,
    correo,
    telefono,
    formErrors,
    onRucChange,
    onCorreoChange,
    onTelefonoChange,
    onClearError,
}: EmpresaDatosFiscalesCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
                        <ShieldCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <CardTitle className="text-sm">
                            Datos Fiscales y Contacto
                        </CardTitle>
                        <CardDescription className="text-xs">
                            RUC, correo y telefono oficial de la empresa
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <FieldWrapper
                        label="Numero de RUC"
                        icon={Hash}
                        valid={isValidRuc(ruc)}
                        error={formErrors.ruc}
                    >
                        <Input
                            value={ruc}
                            onChange={(event) => {
                                const nextValue = event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 11)
                                onRucChange(nextValue)
                                if (formErrors.ruc) onClearError("ruc")
                            }}
                            placeholder="20123456789"
                            maxLength={11}
                            aria-invalid={!!formErrors.ruc}
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        label="Email oficial"
                        icon={Mail}
                        valid={isValidEmail(correo)}
                        error={formErrors.correo}
                    >
                        <Input
                            type="email"
                            value={correo}
                            onChange={(event) => {
                                onCorreoChange(event.target.value)
                                if (formErrors.correo) onClearError("correo")
                            }}
                            placeholder="empresa@correo.com"
                            aria-invalid={!!formErrors.correo}
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        label="Telefono"
                        icon={Phone}
                        valid={isValidPhone(telefono)}
                        error={formErrors.telefono}
                    >
                        <Input
                            value={telefono}
                            onChange={(event) => {
                                const nextValue = event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 15)
                                onTelefonoChange(nextValue)
                                if (formErrors.telefono)
                                    onClearError("telefono")
                            }}
                            placeholder="987654321"
                            maxLength={15}
                            aria-invalid={!!formErrors.telefono}
                        />
                    </FieldWrapper>
                </div>
            </CardContent>
        </Card>
    )
}

export const EmpresaDatosFiscalesCard = memo(EmpresaDatosFiscalesCardComponent)
