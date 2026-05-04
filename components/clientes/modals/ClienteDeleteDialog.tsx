import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import type { Cliente } from "@/lib/types/cliente"

interface ClienteDeleteDialogProps {
    open: boolean
    target: Cliente | null
    onOpenChange: (open: boolean) => void
    onDelete: (id: number) => Promise<boolean>
}

export function ClienteDeleteDialog({
    open,
    target,
    onOpenChange,
    onDelete,
}: ClienteDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleOpenChange = (nextOpen: boolean) => {
        if (isDeleting) return
        onOpenChange(nextOpen)
    }

    const handleDelete = async () => {
        if (!target) return

        setIsDeleting(true)
        try {
            const success = await onDelete(target.idCliente)
            if (success) {
                onOpenChange(false)
            }
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="bottom"
                className="flex h-auto max-h-[60dvh] flex-col gap-0 p-0"
            >
                <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
                    <SheetTitle className="text-sm">Eliminar Cliente</SheetTitle>
                    <SheetDescription className="text-xs sm:text-sm">
                        Estas seguro de eliminar a{" "}
                        <span className="font-semibold text-foreground">
                            {target?.nombres}
                        </span>
                        ? Esta accion desactivara al cliente del sistema.
                    </SheetDescription>
                </SheetHeader>
                <SheetFooter className="shrink-0 px-4 py-4">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isDeleting} className="h-11">
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-11"
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
