import { cn } from "@/lib/utils"

interface UserAvatarProps {
  nombre?: string | null
  apellido?: string | null
  fotoPerfilUrl?: string | null
  className?: string
  fallbackClassName?: string
  textClassName?: string
  alt?: string
}

function resolveInitials(nombre?: string | null, apellido?: string | null) {
  const initialNombre = nombre?.trim().charAt(0) ?? ""
  const initialApellido = apellido?.trim().charAt(0) ?? ""
  const initials = `${initialNombre}${initialApellido}`.toUpperCase()
  return initials || "U"
}

export function UserAvatar({
  nombre,
  apellido,
  fotoPerfilUrl,
  className,
  fallbackClassName,
  textClassName,
  alt,
}: UserAvatarProps) {
  const normalizedFotoPerfilUrl = fotoPerfilUrl?.trim() || null
  const initials = resolveInitials(nombre, apellido)
  const accessibleLabel =
    alt ??
    (nombre || apellido
      ? `Avatar de ${[nombre, apellido].filter(Boolean).join(" ")}`
      : "Avatar de usuario")

  return (
    <div
      className={cn("relative overflow-hidden rounded-full", className)}
      role="img"
      aria-label={accessibleLabel}
    >
      {normalizedFotoPerfilUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${JSON.stringify(normalizedFotoPerfilUrl)})` }}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold uppercase",
            fallbackClassName
          )}
        >
          <span className={textClassName}>{initials}</span>
        </div>
      )}
    </div>
  )
}
