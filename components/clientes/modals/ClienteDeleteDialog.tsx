import { useState } from "react"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-100" showCloseButton={!isDeleting}>
                <DialogHeader>
                    <DialogTitle>Eliminar Cliente</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar a{" "}
                        <span className="font-semibold text-foreground">
                            {target?.nombres}
                        </span>
                        ? Esta acción desactivará al cliente del sistema.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isDeleting}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
