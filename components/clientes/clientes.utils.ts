const avatarColors = [
    { bg: "bg-blue-500", text: "text-white" },
    { bg: "bg-emerald-500", text: "text-white" },
    { bg: "bg-purple-500", text: "text-white" },
    { bg: "bg-amber-500", text: "text-white" },
    { bg: "bg-rose-500", text: "text-white" },
    { bg: "bg-cyan-500", text: "text-white" },
    { bg: "bg-indigo-500", text: "text-white" },
    { bg: "bg-orange-500", text: "text-white" },
    { bg: "bg-teal-500", text: "text-white" },
    { bg: "bg-pink-500", text: "text-white" },
]

export function getAvatarColor(id: number) {
    return avatarColors[id % avatarColors.length]
}

export function getInitials(nombres: string) {
    const parts = nombres.trim().split(/\s+/)
    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return nombres.charAt(0).toUpperCase()
}

export function formatFecha(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
    } catch {
        return iso
    }
}

export function formatFechaHora(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    } catch {
        return iso
    }
}

export const estadoBadge: Record<string, { label: string; dot: string; cls: string }> = {
    ACTIVO: {
        label: "Activo",
        dot: "bg-emerald-500",
        cls: "text-emerald-700 dark:text-emerald-400",
    },
    INACTIVO: {
        label: "Inactivo",
        dot: "bg-red-500",
        cls: "text-red-700 dark:text-red-400",
    },
}

export const tipoDocumentoBadge: Record<string, { label: string; cls: string }> = {
    SIN_DOC: {
        label: "Sin doc.",
        cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
    },
    DNI: {
        label: "DNI",
        cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    },
    RUC: {
        label: "RUC",
        cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    },
    CE: {
        label: "CE",
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    },
}

