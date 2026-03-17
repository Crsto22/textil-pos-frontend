import type {
    ClienteCreateRequest,
    ClienteUpdateRequest,
} from "@/lib/types/cliente"
import type {
    DocumentoDniResponse,
    DocumentoRucResponse,
} from "@/lib/types/documento"

type ClienteAutofillTarget = Pick<
    ClienteCreateRequest,
    "nombres" | "telefono" | "correo" | "direccion"
> &
    Pick<
        ClienteUpdateRequest,
        "nombres" | "telefono" | "correo" | "direccion"
    >

export interface ClienteDocumentoAutofillFields {
    nombres?: string
    telefono?: string
    correo?: string
    direccion?: string
}

function normalizeText(value: unknown) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

function normalizeEmail(value: unknown) {
    const email = normalizeText(value).toLowerCase()
    return email.includes("@") ? email : ""
}

function normalizePhone(value: unknown) {
    const digits = String(value ?? "").replace(/\D/g, "")
    return digits.length === 9 ? digits : ""
}

function resolveRucTelefono(payload: DocumentoRucResponse) {
    if (!Array.isArray(payload.telefonos)) return ""

    for (const telefono of payload.telefonos) {
        const normalized = normalizePhone(telefono)
        if (normalized) return normalized
    }

    return ""
}

function resolveRucCorreo(payload: DocumentoRucResponse) {
    const documentRecord = payload as unknown as Record<string, unknown>
    const candidates = [
        payload.correo,
        payload.email,
        documentRecord.email1,
        documentRecord.email2,
        documentRecord.correo1,
        documentRecord.correo2,
    ]

    for (const candidate of candidates) {
        const normalized = normalizeEmail(candidate)
        if (normalized) return normalized
    }

    return ""
}

export function getClienteAutofillFromDni(
    payload: DocumentoDniResponse
): ClienteDocumentoAutofillFields {
    const nombreCompleto = [
        normalizeText(payload.nombres),
        normalizeText(payload.apellidoPaterno),
        normalizeText(payload.apellidoMaterno),
    ]
        .filter(Boolean)
        .join(" ")

    return nombreCompleto ? { nombres: nombreCompleto } : {}
}

export function getClienteAutofillFromRuc(
    payload: DocumentoRucResponse
): ClienteDocumentoAutofillFields {
    const nombres = normalizeText(payload.razonSocial)
    const direccion = normalizeText(payload.direccion)
    const telefono = resolveRucTelefono(payload)
    const correo = resolveRucCorreo(payload)

    return {
        ...(nombres ? { nombres } : {}),
        ...(direccion ? { direccion } : {}),
        ...(telefono ? { telefono } : {}),
        ...(correo ? { correo } : {}),
    }
}

export function applyClienteDocumentoAutofill<T extends ClienteAutofillTarget>(
    current: T,
    autofill: ClienteDocumentoAutofillFields
): T {
    return {
        ...current,
        nombres: autofill.nombres || current.nombres,
        telefono: autofill.telefono || current.telefono,
        correo: autofill.correo || current.correo,
        direccion: autofill.direccion || current.direccion,
    }
}
