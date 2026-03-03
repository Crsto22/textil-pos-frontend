import { formatFechaHora, formatMonto } from "@/components/ventas/historial/historial.utils"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { Empresa } from "@/lib/types/empresa"
import type { VentaDetalleResponse } from "@/lib/types/venta"

interface DownloadVentaTicketPdfParams {
  detalle: VentaDetalleResponse
  company: Empresa | null
}

interface DrawContextOptions {
  detalle: VentaDetalleResponse
  company: Empresa | null
  logoImage: HTMLImageElement | null
}

const A4_PX_WIDTH = 1240
const A4_PX_HEIGHT = 1754
const A4_PT_WIDTH = 595.28
const A4_PT_HEIGHT = 841.89

function toSafeText(value: string | null | undefined, fallback = "-"): string {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function buildPdfFileName(detalle: VentaDetalleResponse): string {
  const serie = toSafeText(detalle.serie, "DOC")
  const correlativo = Number.isFinite(detalle.correlativo) ? detalle.correlativo : 0
  return `venta-${serie}-${String(correlativo).padStart(6, "0")}.pdf`
}

function downloadFile(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string
) {
  ctx.save()
  ctx.font = font
  ctx.textAlign = "center"
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawRightText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string
) {
  ctx.save()
  ctx.font = font
  ctx.textAlign = "right"
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawLeftText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string
) {
  ctx.save()
  ctx.font = font
  ctx.textAlign = "left"
  ctx.fillText(text, x, y)
  ctx.restore()
}

async function loadLogoFromUrl(logoUrl?: string): Promise<HTMLImageElement | null> {
  const safeUrl = logoUrl?.trim()
  if (!safeUrl) return null

  const toImage = async (blob: Blob): Promise<HTMLImageElement | null> => {
    if (blob.size === 0) return null

    const objectUrl = URL.createObjectURL(blob)
    const image = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = objectUrl
    })
    URL.revokeObjectURL(objectUrl)
    return image
  }

  try {
    const response = await fetch(safeUrl, {
      cache: "no-store",
      credentials: "include",
    })
    if (!response.ok) return null

    const blob = await response.blob()
    const image = await toImage(blob)
    if (image) return image
  } catch {
    // fallback con proxy interno (evita bloqueo CORS)
  }

  try {
    const proxyUrl = `/api/empresa/logo-proxy?src=${encodeURIComponent(safeUrl)}`
    const response = await authFetch(proxyUrl, { cache: "no-store" })
    if (!response.ok) return null

    const blob = await response.blob()
    return toImage(blob)
  } catch {
    return null
  }
}

function drawDocumentoLayout(ctx: CanvasRenderingContext2D, options: DrawContextOptions): void {
  const { detalle, company, logoImage } = options
  const companyName = toSafeText(company?.nombre, "POS Textil")
  const companyRuc = toSafeText(company?.ruc, "-")
  const clientName = toSafeText(detalle.nombreCliente, "Cliente generico")
  const empresaMail = toSafeText(company?.correo, "-")
  const fecha = formatFechaHora(detalle.fecha)
  const numero = `${toSafeText(detalle.tipoComprobante)} ${toSafeText(
    detalle.serie
  )}-${String(Number.isFinite(detalle.correlativo) ? detalle.correlativo : 0).padStart(6, "0")}`

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, A4_PX_WIDTH, A4_PX_HEIGHT)
  ctx.fillStyle = "#111111"
  ctx.strokeStyle = "#111111"
  ctx.lineWidth = 1.5

  const margin = 110
  const contentWidth = A4_PX_WIDTH - margin * 2
  const centerX = A4_PX_WIDTH / 2
  let y = 96

  if (logoImage) {
    const size = 86
    const logoX = centerX - size / 2
    const logoY = y
    ctx.strokeStyle = "#d1d5db"
    ctx.strokeRect(logoX, logoY, size, size)
    ctx.drawImage(logoImage, logoX + 3, logoY + 3, size - 6, size - 6)
    ctx.strokeStyle = "#111111"
    y += size + 44
  }

  drawCenteredText(ctx, companyName, centerX, y, "bold 34px Arial")
  y += 34
  drawCenteredText(ctx, `RUC: ${companyRuc}`, centerX, y, "20px Arial")
  y += 42

  drawCenteredText(ctx, numero, centerX, y, "bold 20px Arial")
  y += 30
  drawCenteredText(ctx, `Fecha: ${fecha}`, centerX, y, "18px Arial")
  y += 48

  const infoTop = y
  const infoHeight = 210
  const separatorX = margin + contentWidth / 2

  drawLeftText(ctx, "DATOS DEL CLIENTE", margin + 8, infoTop + 28, "bold 19px Arial")
  drawLeftText(ctx, clientName, margin + 8, infoTop + 64, "17px Arial")
  drawLeftText(ctx, `Sucursal: ${toSafeText(detalle.nombreSucursal)}`, margin + 8, infoTop + 94, "16px Arial")
  drawLeftText(ctx, `Vendedor: ${toSafeText(detalle.nombreUsuario)}`, margin + 8, infoTop + 124, "16px Arial")
  drawLeftText(ctx, `Estado: ${toSafeText(detalle.estado)}`, margin + 8, infoTop + 154, "16px Arial")

  drawLeftText(ctx, "DATOS DE LA EMPRESA", separatorX + 20, infoTop + 28, "bold 19px Arial")
  drawLeftText(ctx, companyName, separatorX + 20, infoTop + 64, "17px Arial")
  drawLeftText(ctx, `RUC: ${companyRuc}`, separatorX + 20, infoTop + 94, "16px Arial")
  drawLeftText(ctx, empresaMail, separatorX + 20, infoTop + 124, "16px Arial")

  ctx.beginPath()
  ctx.moveTo(separatorX, infoTop + 6)
  ctx.lineTo(separatorX, infoTop + infoHeight - 6)
  ctx.stroke()

  y = infoTop + infoHeight + 36

  const tableX = margin
  const tableWidth = contentWidth
  const colDetalle = 0.56
  const colCantidad = 0.13
  const colPrecio = 0.15
  const colTotal = 0.16
  const tableHeaderHeight = 42
  const rowHeight = 38

  const detalleWidth = tableWidth * colDetalle
  const cantidadWidth = tableWidth * colCantidad
  const precioWidth = tableWidth * colPrecio
  const totalWidth = tableWidth * colTotal

  const xDetalle = tableX
  const xCantidad = xDetalle + detalleWidth
  const xPrecio = xCantidad + cantidadWidth
  const xTotal = xPrecio + precioWidth
  const tableRight = xTotal + totalWidth

  ctx.strokeRect(tableX, y, tableWidth, tableHeaderHeight)
  ctx.beginPath()
  ctx.moveTo(xCantidad, y)
  ctx.lineTo(xCantidad, y + tableHeaderHeight)
  ctx.moveTo(xPrecio, y)
  ctx.lineTo(xPrecio, y + tableHeaderHeight)
  ctx.moveTo(xTotal, y)
  ctx.lineTo(xTotal, y + tableHeaderHeight)
  ctx.stroke()

  drawLeftText(ctx, "Detalle", xDetalle + 12, y + 27, "bold 17px Arial")
  drawCenteredText(ctx, "Cantidad", xCantidad + cantidadWidth / 2, y + 27, "bold 17px Arial")
  drawCenteredText(ctx, "Precio", xPrecio + precioWidth / 2, y + 27, "bold 17px Arial")
  drawCenteredText(ctx, "Total", xTotal + totalWidth / 2, y + 27, "bold 17px Arial")

  y += tableHeaderHeight + 2

  const maxRows = Math.max(1, Math.floor((A4_PX_HEIGHT - y - 350) / rowHeight))
  const visibleItems = detalle.detalles.slice(0, maxRows)

  visibleItems.forEach((item) => {
    const name = `${item.nombreProducto} (${toSafeText(item.color)} / ${toSafeText(item.talla)})`
    drawLeftText(ctx, name, xDetalle + 8, y + 24, "16px Arial")
    drawRightText(ctx, String(item.cantidad), xCantidad + cantidadWidth - 12, y + 24, "16px Arial")
    drawRightText(ctx, formatMonto(item.precioUnitario), xPrecio + precioWidth - 12, y + 24, "16px Arial")
    drawRightText(ctx, formatMonto(item.subtotal), tableRight - 12, y + 24, "16px Arial")

    ctx.strokeStyle = "#d1d5db"
    ctx.beginPath()
    ctx.moveTo(tableX, y + rowHeight - 4)
    ctx.lineTo(tableRight, y + rowHeight - 4)
    ctx.stroke()
    ctx.strokeStyle = "#111111"

    y += rowHeight
  })

  if (detalle.detalles.length > visibleItems.length) {
    const omitted = detalle.detalles.length - visibleItems.length
    drawLeftText(ctx, `... ${omitted} item(s) mas`, xDetalle + 8, y + 24, "italic 15px Arial")
    y += rowHeight
  }

  const totalsY = Math.min(y + 24, A4_PX_HEIGHT - 260)
  const totalsWidth = 380
  const totalsX = tableRight - totalsWidth
  const totalsRowH = 42

  ctx.beginPath()
  ctx.moveTo(tableX, totalsY - 18)
  ctx.lineTo(tableRight, totalsY - 18)
  ctx.stroke()

  const totalsRows = [
    { label: "Subtotal", value: formatMonto(detalle.subtotal) },
    { label: "Descuento", value: formatMonto(detalle.descuentoTotal) },
    { label: `IGV (${detalle.igvPorcentaje.toFixed(2)}%)`, value: formatMonto(detalle.igv) },
  ]

  totalsRows.forEach((row, index) => {
    const rowY = totalsY + index * totalsRowH
    drawLeftText(ctx, row.label, totalsX + 12, rowY + 27, "16px Arial")
    drawRightText(ctx, row.value, totalsX + totalsWidth - 12, rowY + 27, "16px Arial")
  })

  const totalBoxY = totalsY + totalsRows.length * totalsRowH + 8
  ctx.strokeRect(totalsX, totalBoxY, totalsWidth, 46)
  drawLeftText(ctx, "TOTAL", totalsX + 12, totalBoxY + 30, "bold 18px Arial")
  drawRightText(ctx, formatMonto(detalle.total), totalsX + totalsWidth - 12, totalBoxY + 30, "bold 18px Arial")
}

function canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar imagen para PDF"))
          return
        }
        const buffer = await blob.arrayBuffer()
        resolve(new Uint8Array(buffer))
      },
      "image/jpeg",
      0.95
    )
  })
}

function asciiBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function buildPdfBlobFromJpeg(jpegBytes: Uint8Array, imageWidth: number, imageHeight: number): Blob {
  const parts: Uint8Array[] = []
  const objectOffsets: number[] = [0, 0, 0, 0, 0, 0]
  let offset = 0

  const push = (bytes: Uint8Array) => {
    parts.push(bytes)
    offset += bytes.length
  }

  const pushAscii = (text: string) => push(asciiBytes(text))

  pushAscii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")

  objectOffsets[1] = offset
  pushAscii("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

  objectOffsets[2] = offset
  pushAscii("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

  objectOffsets[3] = offset
  pushAscii(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PT_WIDTH} ${A4_PT_HEIGHT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  )

  objectOffsets[4] = offset
  pushAscii(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  )
  push(jpegBytes)
  pushAscii("\nendstream\nendobj\n")

  const stream = `q\n${A4_PT_WIDTH} 0 0 ${A4_PT_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`
  const streamLength = asciiBytes(stream).length

  objectOffsets[5] = offset
  pushAscii(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}endstream\nendobj\n`)

  const xrefOffset = offset
  pushAscii("xref\n0 6\n0000000000 65535 f \n")
  for (let index = 1; index <= 5; index += 1) {
    pushAscii(`${String(objectOffsets[index]).padStart(10, "0")} 00000 n \n`)
  }
  pushAscii(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  return new Blob(parts, { type: "application/pdf" })
}

async function buildVentaPdfBlob(params: DownloadVentaTicketPdfParams): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = A4_PX_WIDTH
  canvas.height = A4_PX_HEIGHT

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("No se pudo crear el contexto de render")
  }

  const logoImage = await loadLogoFromUrl(params.company?.logoUrl)
  drawDocumentoLayout(context, {
    detalle: params.detalle,
    company: params.company,
    logoImage,
  })

  const jpegBytes = await canvasToJpegBytes(canvas)
  return buildPdfBlobFromJpeg(jpegBytes, canvas.width, canvas.height)
}

export async function downloadVentaTicketPdf(
  params: DownloadVentaTicketPdfParams
): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const pdfBlob = await buildVentaPdfBlob(params)
    downloadFile(buildPdfFileName(params.detalle), pdfBlob)
    return true
  } catch {
    return false
  }
}
