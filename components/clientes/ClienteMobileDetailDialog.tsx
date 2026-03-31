import { memo } from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ClienteDetailContent } from "@/components/clientes/ClienteDetailContent"
import type { Cliente, ClienteDetalle } from "@/lib/types/cliente"

interface ClienteMobileDetailDialogProps {
    open: boolean
    selectedCliente: Cliente | null
    detalleCliente: ClienteDetalle | null
    loadingDetalle: boolean
    errorDetalle: string | null
    onRetryDetalle: () => void
    onOpenChange: (open: boolean) => void
}

function ClienteMobileDetailDialogComponent({
    open,
    selectedCliente,
    detalleCliente,
    loadingDetalle,
    errorDetalle,
    onRetryDetalle,
    onOpenChange,
}: ClienteMobileDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm xl:hidden">
                {selectedCliente && (
                    <ClienteDetailContent
                        selectedCliente={selectedCliente}
                        detalleCliente={detalleCliente}
                        loading={loadingDetalle}
                        error={errorDetalle}
                        onRetry={onRetryDetalle}
                        compact
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

export const ClienteMobileDetailDialog = memo(ClienteMobileDetailDialogComponent)
