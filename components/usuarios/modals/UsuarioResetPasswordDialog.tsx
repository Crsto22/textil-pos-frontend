import { useMemo, useState } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Usuario, UsuarioResetPasswordRequest } from "@/lib/types/usuario"

interface ResetPasswordErrors {
  passwordNueva?: string
  confirmarPassword?: string
}

interface UsuarioResetPasswordDialogProps {
  open: boolean
  target: Usuario | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (id: number, payload: UsuarioResetPasswordRequest) => Promise<boolean>
}

const initialForm: UsuarioResetPasswordRequest = {
  passwordNueva: "",
  confirmarPassword: "",
}

function validateResetPassword(
  form: UsuarioResetPasswordRequest
): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {}

  if (!form.passwordNueva) {
    errors.passwordNueva = "Ingrese nueva contrasena"
  } else if (form.passwordNueva.length < 8) {
    errors.passwordNueva = "La nueva contrasena debe tener al menos 8 caracteres"
  }

  if (!form.confirmarPassword) {
    errors.confirmarPassword = "Confirme la nueva contrasena"
  }

  if (
    form.passwordNueva &&
    form.confirmarPassword &&
    form.passwordNueva !== form.confirmarPassword
  ) {
    errors.confirmarPassword = "La confirmacion de contrasena no coincide"
  }

  return errors
}

export function UsuarioResetPasswordDialog({
  open,
  target,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: UsuarioResetPasswordDialogProps) {
  const [form, setForm] = useState<UsuarioResetPasswordRequest>(initialForm)
  const [errors, setErrors] = useState<ResetPasswordErrors>({})

  const isDisabled = useMemo(() => isSubmitting || !target, [isSubmitting, target])

  const resetState = () => {
    setForm(initialForm)
    setErrors({})
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

  const handleFieldChange = (
    field: keyof UsuarioResetPasswordRequest,
    value: string
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  const handleSubmit = async () => {
    if (!target) return

    const validationErrors = validateResetPassword(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    const success = await onSubmit(target.idUsuario, form)
    if (success) {
      onOpenChange(false)
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-120" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>Resetear contrasena</DialogTitle>
          <DialogDescription>
            {target
              ? `Define una nueva contrasena para ${target.nombre} ${target.apellido}.`
              : "Define una nueva contrasena para el usuario seleccionado."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rp-password-nueva">Nueva contrasena</Label>
            <Input
              id="rp-password-nueva"
              type="password"
              value={form.passwordNueva}
              onChange={(event) =>
                handleFieldChange("passwordNueva", event.target.value)
              }
              autoComplete="new-password"
            />
            {errors.passwordNueva && (
              <p className="text-xs text-red-500">{errors.passwordNueva}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rp-password-confirmar">Confirmar nueva contrasena</Label>
            <Input
              id="rp-password-confirmar"
              type="password"
              value={form.confirmarPassword}
              onChange={(event) =>
                handleFieldChange("confirmarPassword", event.target.value)
              }
              autoComplete="new-password"
            />
            {errors.confirmarPassword && (
              <p className="text-xs text-red-500">{errors.confirmarPassword}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isDisabled}>
            {isSubmitting ? "Reseteando..." : "Resetear contrasena"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
