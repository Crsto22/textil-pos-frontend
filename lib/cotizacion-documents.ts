import { authFetch } from "@/lib/auth/auth-fetch"

interface CotizacionDocumentConfig {
  endpoint: string
  fallbackFileName: string
  successMessage: string
  errorLabel: string
  disposition: "download" | "inline"
  openMode?: "tab" | "popup"
}

function resolveDownloadFilename(
  contentDisposition: string | null,
  fallbackFilename: string
): string {
  if (typeof contentDisposition === "string" && contentDisposition.trim() !== "") {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1].trim())
    }

    const plainMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i)
    if (plainMatch?.[1]) {
      return plainMatch[1].trim()
    }
  }

  return fallbackFilename
}

export function getCotizacionDocumentConfig(idCotizacion: number): CotizacionDocumentConfig {
  return {
    endpoint: `/api/cotizacion/${idCotizacion}/comprobante/pdf`,
    fallbackFileName: `cotizacion_${idCotizacion}.pdf`,
    successMessage: "Comprobante de cotizacion abierto correctamente.",
    errorLabel: "comprobante de cotizacion",
    disposition: "inline",
    openMode: "tab",
  }
}

export const getCotizacionDownloadConfig = getCotizacionDocumentConfig

async function fetchCotizacionDocument(config: CotizacionDocumentConfig) {
  try {
    const response = await authFetch(config.endpoint, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const actionLabel = config.disposition === "inline" ? "abrir" : "descargar"
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Error ${response.status} al ${actionLabel} ${config.errorLabel}`

      return { ok: false as const, message }
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get("content-disposition")
    const fileName = resolveDownloadFilename(contentDisposition, config.fallbackFileName)

    return { ok: true as const, blob, fileName }
  } catch (requestError) {
    return {
      ok: false as const,
      message:
        requestError instanceof Error
          ? requestError.message
          : `No se pudo obtener ${config.errorLabel}`,
    }
  }
}

export async function downloadCotizacionDocument(config: CotizacionDocumentConfig) {
  const result = await fetchCotizacionDocument(config)

  if (!result.ok) {
    return result
  }

  const downloadUrl = URL.createObjectURL(result.blob)
  const anchor = document.createElement("a")
  anchor.href = downloadUrl
  anchor.download = result.fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(downloadUrl)

  return { ok: true as const, message: config.successMessage }
}

export async function openCotizacionDocument(config: CotizacionDocumentConfig) {
  const popupFeatures =
    config.openMode === "popup" ? "width=960,height=720,left=120,top=80" : undefined
  const previewWindow =
    typeof window !== "undefined" ? window.open("", "_blank", popupFeatures) : null

  if (previewWindow?.document) {
    previewWindow.opener = null
    previewWindow.document.title = "Cargando documento..."
    previewWindow.document.body.innerHTML =
      '<div style="font-family: sans-serif; padding: 24px; color: #475569;">Cargando documento...</div>'
  }

  const result = await fetchCotizacionDocument(config)

  if (!result.ok) {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.close()
    }

    return result
  }

  const previewUrl = URL.createObjectURL(result.blob)

  if (previewWindow && !previewWindow.closed) {
    previewWindow.location.replace(previewUrl)
  } else {
    const anchor = document.createElement("a")
    anchor.href = previewUrl
    anchor.target = "_blank"
    anchor.rel = "noopener noreferrer"
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(previewUrl)
  }, 60_000)

  return { ok: true as const, message: config.successMessage }
}
