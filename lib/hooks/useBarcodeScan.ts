import { useCallback, useRef, useState } from "react"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { VarianteEscanearResponse } from "@/lib/types/variante"

interface UseBarcodeScanOptions {
  idSucursal: number | null
  onSuccess: (variante: VarianteEscanearResponse) => void
  onError: (message: string) => void
}

export function useBarcodeScan({ idSucursal, onSuccess, onError }: UseBarcodeScanOptions) {
  const [scanning, setScanning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const scan = useCallback(
    async (codigoBarras: string) => {
      const trimmed = codigoBarras.trim()
      if (!trimmed) {
        onError("Ingrese un codigo de barras.")
        return
      }

      if (idSucursal === null) {
        onError("Seleccione una sucursal antes de escanear.")
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setScanning(true)

      try {
        const params = new URLSearchParams()
        params.set("codigoBarras", trimmed)
        params.set("idSucursal", String(idSucursal))

        const response = await authFetch(`/api/variante/escanear?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          const message =
            (body && typeof body === "object" && "message" in body && typeof body.message === "string"
              ? body.message
              : null) ?? "Error al escanear el codigo de barras."
          onError(message)
          return
        }

        const data: VarianteEscanearResponse = await response.json()
        onSuccess(data)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return
        onError("Error de conexion al escanear el codigo de barras.")
      } finally {
        setScanning(false)
      }
    },
    [idSucursal, onSuccess, onError]
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setScanning(false)
  }, [])

  return { scan, scanning, cancel }
}
