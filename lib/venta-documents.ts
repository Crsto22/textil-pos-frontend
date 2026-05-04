import { authFetch } from "@/lib/auth/auth-fetch"
import { setDocumentPreviewLoadingState } from "@/lib/document-preview-loader"

export type VentaDocumentKind = "comprobante" | "ticket" | "xml" | "cdr-xml" | "cdr-zip" | "baja-xml" | "baja-cdr"

interface VentaDocumentSource {
  idVenta: number
  sunatXmlNombre?: string | null
  sunatCdrNombre?: string | null
}

interface VentaDocumentConfig {
  endpoint: string
  fallbackFileName: string
  successMessage: string
  errorLabel: string
  loadingMessage: string
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

export function getVentaDocumentConfig(
  kind: VentaDocumentKind,
  venta: VentaDocumentSource
): VentaDocumentConfig {
  if (kind === "xml") {
    return {
      endpoint: `/api/venta/${venta.idVenta}/sunat/xml`,
      fallbackFileName: venta.sunatXmlNombre || `venta_${venta.idVenta}.xml`,
      successMessage: "XML descargado correctamente.",
      errorLabel: "XML",
      loadingMessage: "Cargando XML...",
      disposition: "download",
      openMode: "tab",
    }
  }

  if (kind === "cdr-xml") {
    return {
      endpoint: `/api/venta/${venta.idVenta}/sunat/cdr?formato=xml`,
      fallbackFileName: `cdr_venta_${venta.idVenta}.xml`,
      successMessage: "CDR XML abierto correctamente.",
      errorLabel: "CDR XML",
      loadingMessage: "Cargando CDR XML...",
      disposition: "download",
      openMode: "tab",
    }
  }

  if (kind === "cdr-zip") {
    return {
      endpoint: `/api/venta/${venta.idVenta}/sunat/cdr?formato=zip`,
      fallbackFileName: venta.sunatCdrNombre || `cdr_venta_${venta.idVenta}.zip`,
      successMessage: "CDR ZIP descargado correctamente.",
      errorLabel: "CDR ZIP",
      loadingMessage: "Descargando CDR ZIP...",
      disposition: "download",
      openMode: "tab",
    }
  }

  if (kind === "baja-xml") {
    return {
      endpoint: `/api/venta/${venta.idVenta}/sunat/baja/xml`,
      fallbackFileName: `baja_venta_${venta.idVenta}.xml`,
      successMessage: "XML de baja descargado correctamente.",
      errorLabel: "XML de baja",
      loadingMessage: "Descargando XML de baja...",
      disposition: "download",
      openMode: "tab",
    }
  }

  if (kind === "baja-cdr") {
    return {
      endpoint: `/api/venta/${venta.idVenta}/sunat/baja/cdr?formato=zip`,
      fallbackFileName: `cdr_baja_venta_${venta.idVenta}.zip`,
      successMessage: "CDR de baja descargado correctamente.",
      errorLabel: "CDR de baja",
      loadingMessage: "Descargando CDR de baja...",
      disposition: "download",
      openMode: "tab",
    }
  }

  if (kind === "ticket") {
    return {
      endpoint: `/api/venta/${venta.idVenta}/comprobante/ticket`,
      fallbackFileName: `ticket_venta_${venta.idVenta}.pdf`,
      successMessage: "Ticket abierto correctamente.",
      errorLabel: "ticket",
      loadingMessage: "Cargando ticket...",
      disposition: "inline",
      openMode: "popup",
    }
  }

  return {
    endpoint: `/api/venta/${venta.idVenta}/comprobante/pdf`,
    fallbackFileName: `comprobante_venta_${venta.idVenta}.pdf`,
    successMessage: "Comprobante abierto correctamente.",
    errorLabel: "comprobante",
    loadingMessage: "Cargando comprobante...",
    disposition: "inline",
    openMode: "tab",
  }
}

export const getVentaDownloadConfig = getVentaDocumentConfig

async function fetchVentaDocument(config: VentaDocumentConfig) {
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

export async function downloadVentaDocument(config: VentaDocumentConfig) {
  const result = await fetchVentaDocument(config)

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

export async function openVentaDocument(config: VentaDocumentConfig) {
  const popupFeatures =
    config.openMode === "popup" ? "width=960,height=720,left=120,top=80" : undefined
  const previewWindow =
    typeof window !== "undefined" ? window.open("", "_blank", popupFeatures) : null

  setDocumentPreviewLoadingState(previewWindow, config.loadingMessage)

  const result = await fetchVentaDocument(config)

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
