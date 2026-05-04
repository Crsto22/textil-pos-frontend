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
import type { Turno } from "@/lib/types/turno"

interface TurnoDeleteDialogProps {
  open: boolean
  target: Turno | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => Promise<boolean>
}

export function TurnoDeleteDialog({
  open,
  target,
  onOpenChange,
  onDelete,
}: TurnoDeleteDialogProps) {
  const handleDelete = async () => {
    if (!target) return
    const success = await onDelete(target.idTurno)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Eliminar Turno</DialogTitle>
          <DialogDescription>
            {target
              ? `Se eliminara logicamente el turno "${target.nombre}".`
              : "Confirma la eliminacion del turno seleccionado."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={!target}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
