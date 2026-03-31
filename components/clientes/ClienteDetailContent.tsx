import {
    CalendarDaysIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
    ShoppingBagIcon,
    UserIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import {
    formatFechaHora as formatVentaFechaHora,
    formatMonto,
    formatComprobante,
    getEstadoBadgeClass,
} from "@/components/ventas/historial/historial.utils"
import type { Cliente, ClienteDetalle } from "@/lib/types/cliente"
import {
    formatFechaHora,
    getAvatarColor,
    getInitials,
    tipoDocumentoBadge,
} from "@/components/clientes/clientes.utils"

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

interface ClienteDetailContentProps {
    selectedCliente: Cliente | null
    detalleCliente: ClienteDetalle | null
    loading: boolean
    error: string | null
    onRetry: () => void
    compact?: boolean
}

export function ClienteDetailContent({
    selectedCliente,
    detalleCliente,
    loading,
    error,
    onRetry,
    compact = false,
}: ClienteDetailContentProps) {
    const clienteBase = detalleCliente ?? selectedCliente
    if (!clienteBase) return null

    const color = getAvatarColor(clienteBase.idCliente)
    const initials = getInitials(clienteBase.nombres)
    const tipoDoc =
        tipoDocumentoBadge[clienteBase.tipoDocumento] ?? {
            label: clienteBase.tipoDocumento,
            cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
        }

    const sectionClassName = compact ? "border-t pt-5" : "border-t px-6 py-5"
    const headerClassName = compact
        ? "flex flex-col items-center pb-4 pt-2"
        : "flex flex-col items-center px-6 pb-5"

    return (
        <>
            <div className={headerClassName}>
                <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${color.bg} ${color.text}`}
                >
                    {initials}
                </div>
                <h3 className="mt-3 text-center text-lg font-semibold">
                    {clienteBase.nombres}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                    {clienteBase.tipoDocumento !== "SIN_DOC" ? (
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoDoc.cls}`}
                        >
                            {tipoDoc.label}: {clienteBase.nroDocumento}
                        </span>
                    ) : (
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoDoc.cls}`}
                        >
                            {tipoDoc.label}
                        </span>
                    )}
                </div>

                <div className="mt-4 grid w-full grid-cols-2 gap-3">
                    <a
                        href={getWhatsAppUrl(clienteBase.telefono)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        <WhatsAppIcon className="h-4 w-4 text-green-500" />
                        WhatsApp
                    </a>
                    <a
                        href={getMailtoUrl(clienteBase.correo)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        <EnvelopeIcon className="h-4 w-4 text-blue-500" />
                        Correo
                    </a>
                </div>
            </div>

            <div className={sectionClassName}>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Informacion de Contacto
                </p>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Telefono
                            </p>
                            <p className="text-sm font-medium">{clienteBase.telefono}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Correo
                            </p>
                            <p className="break-all text-sm font-medium">
                                {clienteBase.correo}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Direccion
                            </p>
                            <p className="text-sm font-medium">
                                {clienteBase.direccion || "Sin direccion"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={sectionClassName}>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Historial de Compras
                </p>

                {loading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border bg-muted/20 p-3">
                                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                                <div className="mt-3 h-6 w-14 animate-pulse rounded bg-muted" />
                            </div>
                            <div className="rounded-xl border bg-muted/20 p-3">
                                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                                <div className="mt-3 h-6 w-20 animate-pulse rounded bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[0, 1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-xl border bg-muted/20 p-3"
                                >
                                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                                    <div className="mt-2 h-3 w-36 animate-pulse rounded bg-muted" />
                                    <div className="mt-2 h-4 w-20 animate-pulse rounded bg-muted" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                        <p>{error}</p>
                        <Button
                            type="button"
                            variant="link"
                            className="mt-1 h-auto p-0 text-red-700 dark:text-red-300"
                            onClick={onRetry}
                        >
                            Reintentar
                        </Button>
                    </div>
                ) : detalleCliente ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border bg-muted/20 p-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Compras Totales
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {detalleCliente.comprasTotales}
                                </p>
                            </div>
                            <div className="rounded-xl border bg-muted/20 p-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Monto Total
                                </p>
                                <p className="mt-2 text-lg font-semibold text-foreground">
                                    {formatMonto(detalleCliente.montoTotalCompras, "PEN")}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {detalleCliente.ultimasCompras.length === 0 ? (
                                <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                                    No hay compras emitidas registradas para este cliente.
                                </div>
                            ) : (
                                detalleCliente.ultimasCompras.map((compra) => (
                                    <div
                                        key={compra.idVenta}
                                        className="rounded-xl border bg-muted/10 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                    <ShoppingBagIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {compra.tipoComprobante}
                                                    </span>
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatComprobante(compra)}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatVentaFechaHora(compra.fecha)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getEstadoBadgeClass(compra.estado)}`}
                                                >
                                                    {compra.estado}
                                                </span>
                                                <p className="mt-2 text-sm font-semibold text-foreground">
                                                    {formatMonto(compra.total, compra.moneda)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                        Selecciona un cliente para ver su historial de compras.
                    </div>
                )}
            </div>

            <div className={sectionClassName}>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Creado por
                            </p>
                            <p className="text-sm font-medium">
                                {clienteBase.nombreUsuarioCreacion || "-"}
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
                                {formatFechaHora(clienteBase.fechaCreacion)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
