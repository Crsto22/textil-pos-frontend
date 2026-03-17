"use client"

import { useCallback, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { TipoDocumento } from "@/lib/types/cliente"
import type {
    DocumentoDniResponse,
    DocumentoRucResponse,
} from "@/lib/types/documento"

type DocumentoLookupSuccess =
    | {
          ok: true
          tipoDocumento: "DNI"
          data: DocumentoDniResponse
      }
    | {
          ok: true
          tipoDocumento: "RUC"
          data: DocumentoRucResponse
      }

type DocumentoLookupFailure = {
    ok: false
    message: string
}

export type DocumentoLookupResult =
    | DocumentoLookupSuccess
    | DocumentoLookupFailure

async function parseJsonSafe(response: Response) {
    return response.json().catch(() => null)
}

function resolveErrorMessage(payload: unknown, fallback: string) {
    if (payload && typeof payload === "object") {
        const message =
            "message" in payload && typeof payload.message === "string"
                ? payload.message.trim()
                : ""

        if (message) {
            return message
        }
    }

    return fallback
}

export function useDocumentoLookup() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    const lookupDocumento = useCallback(
        async (
            tipoDocumento: TipoDocumento,
            nroDocumento: string
        ): Promise<DocumentoLookupResult> => {
            const normalizedDocument = nroDocumento.trim()

            if (tipoDocumento !== "DNI" && tipoDocumento !== "RUC") {
                const message = "Solo se puede consultar DNI o RUC"
                setError(message)
                return { ok: false, message }
            }

            if (!normalizedDocument) {
                const message =
                    tipoDocumento === "DNI" ? "Ingrese DNI" : "Ingrese RUC"
                setError(message)
                return { ok: false, message }
            }

            setLoading(true)
            setError(null)

            try {
                const response = await authFetch(
                    `/api/documento/${tipoDocumento.toLowerCase()}/${encodeURIComponent(normalizedDocument)}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                )

                const payload = await parseJsonSafe(response)

                if (!response.ok) {
                    const message = resolveErrorMessage(
                        payload,
                        `No se pudo consultar el ${tipoDocumento}`
                    )
                    setError(message)
                    return { ok: false, message }
                }

                if (tipoDocumento === "DNI") {
                    return {
                        ok: true,
                        tipoDocumento,
                        data: payload as DocumentoDniResponse,
                    }
                }

                return {
                    ok: true,
                    tipoDocumento,
                    data: payload as DocumentoRucResponse,
                }
            } catch {
                const message = `No se pudo consultar el ${tipoDocumento}`
                setError(message)
                return { ok: false, message }
            } finally {
                setLoading(false)
            }
        },
        []
    )

    return {
        loading,
        error,
        clearError,
        lookupDocumento,
    }
}
