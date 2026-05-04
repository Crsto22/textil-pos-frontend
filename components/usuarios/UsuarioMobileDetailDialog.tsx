import { memo } from "react"

import { UsuarioDetailContent } from "@/components/usuarios/UsuarioDetailContent"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Usuario } from "@/lib/types/usuario"

interface UsuarioMobileDetailDialogProps {
  open: boolean
  selectedUser: Usuario | null
  onOpenChange: (open: boolean) => void
  onResetPassword: (usuario: Usuario) => void
}

function UsuarioMobileDetailDialogComponent({
  open,
  selectedUser,
  onOpenChange,
  onResetPassword,
}: UsuarioMobileDetailDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col gap-0 p-0 xl:hidden"
      >
        <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
          <SheetTitle className="text-sm">Detalle del usuario</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {selectedUser && (
            <UsuarioDetailContent
              selectedUser={selectedUser}
              onResetPassword={onResetPassword}
              compact
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const UsuarioMobileDetailDialog = memo(UsuarioMobileDetailDialogComponent)
