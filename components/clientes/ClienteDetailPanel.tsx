import { memo } from "react"
import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"

import { ClienteDetailContent } from "@/components/clientes/ClienteDetailContent"
import type { Cliente, ClienteDetalle } from "@/lib/types/cliente"

interface ClienteDetailPanelProps {
    selectedCliente: Cliente | null
    detalleCliente: ClienteDetalle | null
    loadingDetalle: boolean
    errorDetalle: string | null
    onRetryDetalle: () => void
    onClose: () => void
}

function ClienteDetailPanelComponent({
    selectedCliente,
    detalleCliente,
    loadingDetalle,
    errorDetalle,
    onRetryDetalle,
    onClose,
}: ClienteDetailPanelProps) {
    return (
        <aside className="hidden w-80 shrink-0 xl:block">
            <div className="sticky top-6 overflow-hidden rounded-xl border bg-card">
                {selectedCliente ? (
                    <>
                        <div className="flex justify-end p-3 pb-0">
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <ClienteDetailContent
                            selectedCliente={selectedCliente}
                            detalleCliente={detalleCliente}
                            loading={loadingDetalle}
                            error={errorDetalle}
                            onRetry={onRetryDetalle}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <UserCircleIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-muted-foreground">
                            Ningun cliente seleccionado
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                            Haz clic en un cliente de la tabla para ver sus detalles
                        </p>
                    </div>
                )}
            </div>
        </aside>
    )
}

export const ClienteDetailPanel = memo(ClienteDetailPanelComponent)
