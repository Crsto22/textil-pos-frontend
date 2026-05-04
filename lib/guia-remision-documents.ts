import { authFetch } from "@/lib/auth/auth-fetch"

export type GuiaRemisionDocumentKind = "pdf" | "xml" | "cdr-xml" | "cdr-zip"

interface GuiaRemisionDocumentSource {
  idGuiaRemision: number
}

interface GuiaRemisionDocumentConfig {
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

export function getGuiaRemisionDownloadConfig(
  kind: GuiaRemisionDocumentKind,
  source: GuiaRemisionDocumentSource
): GuiaRemisionDocumentConfig {
  if (kind === "pdf") {
    return {
      endpoint: `/api/guia-remision/${source.idGuiaRemision}/pdf`,
      fallbackFileName: `guia-remision-${source.idGuiaRemision}.pdf`,
      successMessage: "PDF descargado correctamente.",
      errorLabel: "PDF",
    }
  }

  if (kind === "xml") {
    return {
      endpoint: `/api/guia-remision/${source.idGuiaRemision}/sunat/xml`,
      fallbackFileName: `guia_remision_${source.idGuiaRemision}.xml`,
      successMessage: "XML descargado correctamente.",
      errorLabel: "XML",
    }
  }

  if (kind === "cdr-xml") {
    return {
      endpoint: `/api/guia-remision/${source.idGuiaRemision}/sunat/cdr?formato=xml`,
      fallbackFileName: `cdr_guia_remision_${source.idGuiaRemision}.xml`,
      successMessage: "CDR XML abierto correctamente.",
      errorLabel: "CDR XML",
    }
  }

  return {
    endpoint: `/api/guia-remision/${source.idGuiaRemision}/sunat/cdr?formato=zip`,
    fallbackFileName: `cdr_guia_remision_${source.idGuiaRemision}.zip`,
    successMessage: "CDR ZIP descargado correctamente.",
    errorLabel: "CDR ZIP",
  }
}

async function fetchGuiaRemisionDocument(config: GuiaRemisionDocumentConfig) {
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

export async function downloadGuiaRemisionDocument(config: GuiaRemisionDocumentConfig) {
  const result = await fetchGuiaRemisionDocument(config)

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
