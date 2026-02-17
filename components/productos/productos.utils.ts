export function formatFechaCreacion(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}
