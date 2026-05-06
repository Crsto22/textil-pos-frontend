export function formatMemberSince(value?: string) {
    if (!value) return "No disponible"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric",
    })
}

export function formatFechaCompleta(value?: string) {
    if (!value) return "No disponible"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export function getReadOnlyValue(value?: string | number | null) {
    if (value === null || value === undefined) return "No disponible"
    if (typeof value === "string" && value.trim().length === 0) return "No disponible"
    return String(value)
}
