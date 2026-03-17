"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import type {
    Cliente,
    ClienteCreateRequest,
} from "@/lib/types/cliente"

function getErrorMessage(status: number, backendMsg?: string): string {
    if (backendMsg) return backendMsg
    if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
    if (status === 403) return "No tienes permisos"
    if (status === 500) return "Error interno del servidor"
    return "Error inesperado"
}

async function parseJsonSafe(response: Response) {
    return response.json().catch(() => null)
}

function isClienteResponse(value: unknown): value is Cliente {
    return (
        !!value &&
        typeof value === "object" &&
        typeof (value as Cliente).idCliente === "number" &&
        (value as Cliente).idCliente > 0 &&
        typeof (value as Cliente).nombres === "string"
    )
}

interface UseClienteCreateOptions {
    onCreated?: (cliente: Cliente) => Promise<void> | void
    onError?: (message: string) => void
    successMessage?: string | ((cliente: Cliente) => string)
}

export function useClienteCreate(options?: UseClienteCreateOptions) {
    const onCreated = options?.onCreated
    const onError = options?.onError
    const successMessageOption = options?.successMessage

    const createCliente = useCallback(
        async (payload: ClienteCreateRequest): Promise<Cliente | null> => {
            try {
                const response = await authFetch("/api/cliente/insertar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

                const data = await parseJsonSafe(response)

                if (!response.ok) {
                    const message = getErrorMessage(response.status, data?.message)
                    onError?.(message)
                    toast.error(message)
                    return null
                }

                if (!isClienteResponse(data)) {
                    const message = "La respuesta del servidor no contiene el cliente creado."
                    onError?.(message)
                    toast.error(message)
                    return null
                }

                const successMessage =
                    typeof successMessageOption === "function"
                        ? successMessageOption(data)
                        : successMessageOption ?? "Cliente creado exitosamente"

                toast.success(successMessage)
                await onCreated?.(data)
                return data
            } catch (requestError) {
                const message =
                    requestError instanceof Error ? requestError.message : "Error inesperado"
                onError?.(message)
                toast.error(message)
                return null
            }
        },
        [onCreated, onError, successMessageOption]
    )

    return {
        createCliente,
    }
}
