import { memo } from "react"

import { ClienteDetailContent } from "@/components/clientes/ClienteDetailContent"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="flex h-[85dvh] flex-col gap-0 p-0 xl:hidden"
            >
                <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
                    <SheetTitle className="text-sm">Detalle del cliente</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
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
                </div>
            </SheetContent>
        </Sheet>
    )
}

export const ClienteMobileDetailDialog = memo(ClienteMobileDetailDialogComponent)
