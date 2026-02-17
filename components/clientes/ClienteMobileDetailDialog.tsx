import { memo } from "react"
import {
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
    UserIcon,
} from "@heroicons/react/24/outline"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Cliente } from "@/lib/types/cliente"
import {
    estadoBadge,
    formatFechaHora,
    getAvatarColor,
    getInitials,
    tipoDocumentoBadge,
} from "@/components/clientes/clientes.utils"

/* ── Inline WhatsApp icon ────────────────────────────────── */
function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
}

function getWhatsAppUrl(telefono: string): string {
    const cleaned = telefono.replace(/\D/g, "")
    const number = cleaned.startsWith("51") ? cleaned : `51${cleaned}`
    return `https://wa.me/${number}`
}

function getMailtoUrl(correo: string): string {
    return `mailto:${correo}`
}

interface ClienteMobileDetailDialogProps {
    open: boolean
    selectedCliente: Cliente | null
    onOpenChange: (open: boolean) => void
}

function ClienteMobileDetailDialogComponent({
    open,
    selectedCliente,
    onOpenChange,
}: ClienteMobileDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm xl:hidden">
                {selectedCliente &&
                    (() => {
                        const color = getAvatarColor(selectedCliente.idCliente)
                        const initials = getInitials(selectedCliente.nombres)
                        const tipoDoc =
                            tipoDocumentoBadge[selectedCliente.tipoDocumento] ?? {
                                label: selectedCliente.tipoDocumento,
                                cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                            }
                        const estado =
                            estadoBadge[selectedCliente.estado] ?? {
                                label: selectedCliente.estado,
                                dot: "bg-gray-400",
                                cls: "text-gray-600",
                            }

                        return (
                            <>
                                {/* ── Header: Avatar + Nombre + Badge ── */}
                                <div className="flex flex-col items-center pb-4 pt-2">
                                    <div
                                        className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${color.bg} ${color.text}`}
                                    >
                                        {initials}
                                    </div>
                                    <h3 className="mt-3 text-center text-lg font-semibold">
                                        {selectedCliente.nombres}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        {selectedCliente.tipoDocumento !== "SIN_DOC" ? (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoDoc.cls}`}
                                            >
                                                {tipoDoc.label}: {selectedCliente.nroDocumento}
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoDoc.cls}`}
                                            >
                                                {tipoDoc.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* ── Botones WhatsApp y Correo ── */}
                                    <div className="mt-4 grid w-full grid-cols-2 gap-3">
                                        <a
                                            href={getWhatsAppUrl(selectedCliente.telefono)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            <WhatsAppIcon className="h-4 w-4 text-green-500" />
                                            WhatsApp
                                        </a>
                                        <a
                                            href={getMailtoUrl(selectedCliente.correo)}
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            <EnvelopeIcon className="h-4 w-4 text-blue-500" />
                                            Correo
                                        </a>
                                    </div>
                                </div>

                                {/* ── Información de contacto ── */}
                                <div className="border-t pt-5">
                                    <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Información de Contacto
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Teléfono
                                                </p>
                                                <p className="text-sm font-medium">{selectedCliente.telefono}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Correo
                                                </p>
                                                <p className="break-all text-sm font-medium">
                                                    {selectedCliente.correo}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Dirección
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {selectedCliente.direccion || "Sin dirección"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <BuildingStorefrontIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Sucursal
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {selectedCliente.nombreSucursal || "Sin sucursal"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Info de registro ── */}
                                <div className="border-t pt-5">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Creado por
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {selectedCliente.nombreUsuarioCreacion || "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Fecha de Registro
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {formatFechaHora(selectedCliente.fechaCreacion)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )
                    })()}
            </DialogContent>
        </Dialog>
    )
}

export const ClienteMobileDetailDialog = memo(ClienteMobileDetailDialogComponent)
