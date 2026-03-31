"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"

function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null

  const encodedFilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedFilenameMatch?.[1]) {
    try {
      return decodeURIComponent(encodedFilenameMatch[1])
    } catch {
      return encodedFilenameMatch[1]
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return filenameMatch?.[1] ?? null
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { message?: unknown } | null

  if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }

  if (response.status === 401 || response.status === 403) {
    return "No autenticado o sin permisos"
  }

  return "No se pudo exportar el reporte de productos en Excel"
}

function buildFallbackFilename() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "")
  return `productos_disponibles_${datePart}.xlsx`
}

export function useVarianteReporteExcel() {
  const [isExporting, setIsExporting] = useState(false)

  const exportReporteExcel = useCallback(async (): Promise<boolean> => {
    setIsExporting(true)
    try {
      const response = await authFetch("/api/variante/reporte/excel", {
        method: "GET",
      })

      if (!response.ok) {
        const message = await getErrorMessage(response)
        toast.error(message)
        return false
      }

      const fileBlob = await response.blob()
      if (fileBlob.size === 0) {
        toast.error("El archivo Excel llego vacio")
        return false
      }

      const filename =
        extractFilename(response.headers.get("content-disposition")) ?? buildFallbackFilename()

      triggerDownload(filename, fileBlob)
      toast.success("Reporte Excel descargado")
      return true
    } catch {
      toast.error("Error de red al exportar el reporte")
      return false
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    isExporting,
    exportReporteExcel,
  }
}
