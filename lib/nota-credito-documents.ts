import { authFetch } from "@/lib/auth/auth-fetch"
import { setDocumentPreviewLoadingState } from "@/lib/document-preview-loader"

export type NotaCreditoDocumentKind =
  | "pdf"
  | "xml"
  | "cdr-xml"
  | "cdr-zip"
  | "baja-xml"
  | "baja-cdr"

interface NotaCreditoDocumentSource {
  idNotaCredito: number
}

interface NotaCreditoDocumentConfig {
  endpoint: string
  fallbackFileName: string
  successMessage: string
  errorLabel: string
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

export function getNotaCreditoDownloadConfig(
  kind: NotaCreditoDocumentKind,
  notaCredito: NotaCreditoDocumentSource
): NotaCreditoDocumentConfig {
  if (kind === "xml") {
    return {
      endpoint: `/api/nota-credito/${notaCredito.idNotaCredito}/sunat/xml`,
      fallbackFileName: `nota_credito_${notaCredito.idNotaCredito}.xml`,
      successMessage: "XML descargado correctamente.",
      errorLabel: "XML",
    }
  }

  if (kind === "cdr-xml") {
    return {
      endpoint: `/api/nota-credito/${notaCredito.idNotaCredito}/sunat/cdr?formato=xml`,
      fallbackFileName: `cdr_nota_credito_${notaCredito.idNotaCredito}.xml`,
      successMessage: "CDR XML abierto correctamente.",
      errorLabel: "CDR XML",
    }
  }

  if (kind === "cdr-zip") {
    return {
      endpoint: `/api/nota-credito/${notaCredito.idNotaCredito}/sunat/cdr?formato=zip`,
      fallbackFileName: `cdr_nota_credito_${notaCredito.idNotaCredito}.zip`,
      successMessage: "CDR ZIP descargado correctamente.",
      errorLabel: "CDR ZIP",
    }
  }

  if (kind === "baja-xml") {
    return {
      endpoint: `/api/nota-credito/${notaCredito.idNotaCredito}/sunat/baja/xml`,
      fallbackFileName: `baja_nota_credito_${notaCredito.idNotaCredito}.xml`,
      successMessage: "XML de baja descargado correctamente.",
      errorLabel: "XML de baja",
    }
  }

  if (kind === "baja-cdr") {
    return {
      endpoint: `/api/nota-credito/${notaCredito.idNotaCredito}/sunat/baja/cdr?formato=zip`,
      fallbackFileName: `cdr_baja_nota_credito_${notaCredito.idNotaCredito}.zip`,
      successMessage: "CDR de baja descargado correctamente.",
      errorLabel: "CDR de baja",
    }
  }

  return {
    endpoint: `/api/nota-credito/${notaCredito.idNotaCredito}/comprobante/pdf`,
    fallbackFileName: `nota_credito_${notaCredito.idNotaCredito}.pdf`,
    successMessage: "PDF descargado correctamente.",
    errorLabel: "PDF",
  }
}

async function fetchNotaCreditoDocument(config: NotaCreditoDocumentConfig) {
  try {
    const response = await authFetch(config.endpoint, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Error ${response.status} al descargar ${config.errorLabel}`

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

export async function downloadNotaCreditoDocument(config: NotaCreditoDocumentConfig) {
  const result = await fetchNotaCreditoDocument(config)

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

export async function openNotaCreditoDocument(
  config: NotaCreditoDocumentConfig,
  targetWindow?: Window | null
) {
  const previewWindow =
    targetWindow ?? (typeof window !== "undefined" ? window.open("", "_blank") : null)

  setDocumentPreviewLoadingState(previewWindow, "Cargando documento...")

  const result = await fetchNotaCreditoDocument(config)

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

  return { ok: true as const, message: "Documento abierto correctamente." }
}
