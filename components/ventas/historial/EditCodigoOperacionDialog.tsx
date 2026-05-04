import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { authFetch } from "@/lib/auth/auth-fetch"

interface UpdatablePago {
  idPago: number
  codigoOperacion?: string | null
}

interface EditCodigoOperacionDialogProps {
  pago: UpdatablePago | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditCodigoOperacionDialog({
  pago,
  open,
  onOpenChange,
  onSuccess,
}: EditCodigoOperacionDialogProps) {
  const [codigoOperacion, setCodigoOperacion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && pago) {
      setCodigoOperacion(pago.codigoOperacion || "")
    } else {
      setCodigoOperacion("")
    }
  }, [open, pago])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pago) return
    
    const trimmedCodigo = codigoOperacion.trim()
    if (!trimmedCodigo) {
      toast.error("El codigo de operacion no puede estar vacio")
      return
    }

    if (trimmedCodigo.length > 100) {
      toast.error("El codigo de operacion no puede exceder los 100 caracteres")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authFetch(`/api/pago/${pago.idPago}/codigo-operacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoOperacion: trimmedCodigo }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Error al actualizar el codigo de operacion")
      }

      toast.success("Codigo de operacion actualizado exitosamente")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[EDIT_CODIGO_OPERACION]", error)
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-auto max-h-[70dvh] flex-col gap-0 p-0">
        <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
          <SheetTitle className="text-sm">Editar Codigo de Operacion</SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            Ingrese el nuevo codigo de operacion para el pago.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
            <label htmlFor="codigoOperacion" className="text-sm font-medium">
              Codigo de Operacion <span className="text-red-500">*</span>
            </label>
            <input
              id="codigoOperacion"
              type="text"
              value={codigoOperacion}
              onChange={(e) => setCodigoOperacion(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
              placeholder="Ej. 78451236"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          </div>
          <SheetFooter className="shrink-0 border-t border-slate-100 px-4 py-4 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !codigoOperacion.trim()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 transition-colors hover:bg-slate-900/90 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
