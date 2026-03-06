"use client"

import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline"
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { useProductoImport } from "@/lib/hooks/useProductoImport"
import { useProductoImportHistory } from "@/lib/hooks/useProductoImportHistory"
import type {
  ProductoImportResponse,
  ProductoImportacionHistorial,
} from "@/lib/types/producto"

type UploadStatus = "COMPLETADO" | "FALLIDO" | "PROCESANDO"

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"]
const ACCEPTED_FILES = ACCEPTED_EXTENSIONS.join(",")
const BASE_TEMPLATE_HEADERS = [
  "sku",
  "nombreProducto",
  "descripcion",
  "categoriaNombre",
  "colorNombre",
  "colorHex",
  "tallaNombre",
  "precio",
  "precioOferta",
  "stock",
]

function getTemplateHeadersByRole(rol?: string): string[] {
  const normalizedRole = (rol ?? "").trim().toUpperCase()
  const needsSucursalColumn =
    normalizedRole === "ADMINISTRADOR" ||
    normalizedRole === "VENTAS" ||
    normalizedRole === "ALMACEN"

  return needsSucursalColumn
    ? [...BASE_TEMPLATE_HEADERS, "sucursal"]
    : BASE_TEMPLATE_HEADERS
}

const STATUS_STYLES: Record<UploadStatus, string> = {
  COMPLETADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  FALLIDO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PROCESANDO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  COMPLETADO: "Completado",
  FALLIDO: "Fallido",
  PROCESANDO: "Procesando",
}

function isAcceptedFile(file: File): boolean {
  const lowerCaseName = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension)
  )
}

function normalizeUploadStatus(estado: string): UploadStatus {
  const value = estado.trim().toUpperCase()
  if (
    value === "EXITOSA" ||
    value === "COMPLETADA" ||
    value === "COMPLETADO"
  ) {
    return "COMPLETADO"
  }
  if (
    value === "PROCESANDO" ||
    value === "EN_PROCESO" ||
    value === "EN PROCESO" ||
    value === "PENDIENTE"
  ) {
    return "PROCESANDO"
  }
  return "FALLIDO"
}

function formatDateLabel(dateIso: string): string {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function formatDateFilterLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
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

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" })
  downloadFile(filename, blob)
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function getColumnLetter(index: number): string {
  let value = index + 1
  let result = ""
  while (value > 0) {
    const remainder = (value - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    value = Math.floor((value - 1) / 26)
  }
  return result
}

function getColumnWidth(header: string): number {
  if (header === "descripcion") return 30
  if (header === "nombreProducto") return 24
  if (header === "categoriaNombre") return 18
  if (header === "sucursal") return 20
  if (header === "colorHex") return 14
  return 16
}

function getXlsxFiles(headers: string[]): Array<{ path: string; content: string }> {
  const columnDefs = headers
    .map(
      (header, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${getColumnWidth(header)}" customWidth="1"/>`
    )
    .join("")

  const headerCells = headers
    .map((header, index) => {
      const cellRef = `${getColumnLetter(index)}1`
      return `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(header)}</t></is></c>`
    })
    .join("")

  const lastColumn = getColumnLetter(Math.max(0, headers.length - 1))
  const dimension = headers.length > 0 ? `A1:${lastColumn}1` : "A1"

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="PlantillaProductos" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF1E293B"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="1">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`

  const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimension}"/>
  <sheetViews>
    <sheetView workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${columnDefs}</cols>
  <sheetData>
    <row r="1" ht="22" customHeight="1">${headerCells}</row>
  </sheetData>
</worksheet>`

  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Plantilla Carga Masiva Productos</dc:title>
  <dc:creator>POS Textil</dc:creator>
  <cp:lastModifiedBy>POS Textil</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-01-01T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-01-01T00:00:00Z</dcterms:modified>
</cp:coreProperties>`

  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Excel</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>PlantillaProductos</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>POS Textil</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0300</AppVersion>
</Properties>`

  return [
    { path: "[Content_Types].xml", content: contentTypesXml },
    { path: "_rels/.rels", content: rootRelsXml },
    { path: "docProps/core.xml", content: coreXml },
    { path: "docProps/app.xml", content: appXml },
    { path: "xl/workbook.xml", content: workbookXml },
    { path: "xl/_rels/workbook.xml.rels", content: workbookRelsXml },
    { path: "xl/styles.xml", content: stylesXml },
    { path: "xl/worksheets/sheet1.xml", content: worksheetXml },
  ]
}

function toDosDateTime(date: Date): { date: number; time: number } {
  const year = Math.max(1980, date.getFullYear())
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = Math.floor(date.getSeconds() / 2)

  const dosTime = (hours << 11) | (minutes << 5) | seconds
  const dosDate = ((year - 1980) << 9) | (month << 5) | day
  return { date: dosDate, time: dosTime }
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function buildZipBlob(files: Array<{ path: string; content: string }>): Blob {
  const encoder = new TextEncoder()
  const now = toDosDateTime(new Date())

  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let localOffset = 0
  let centralSize = 0

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.path)
    const dataBytes = encoder.encode(file.content)
    const fileCrc = crc32(dataBytes)

    const localHeader = new Uint8Array(30)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, now.time, true)
    localView.setUint16(12, now.date, true)
    localView.setUint32(14, fileCrc, true)
    localView.setUint32(18, dataBytes.length, true)
    localView.setUint32(22, dataBytes.length, true)
    localView.setUint16(26, nameBytes.length, true)
    localView.setUint16(28, 0, true)

    localChunks.push(localHeader, nameBytes, dataBytes)

    const centralHeader = new Uint8Array(46)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0, true)
    centralView.setUint16(10, 0, true)
    centralView.setUint16(12, now.time, true)
    centralView.setUint16(14, now.date, true)
    centralView.setUint32(16, fileCrc, true)
    centralView.setUint32(20, dataBytes.length, true)
    centralView.setUint32(24, dataBytes.length, true)
    centralView.setUint16(28, nameBytes.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, localOffset, true)

    centralChunks.push(centralHeader, nameBytes)
    centralSize += centralHeader.length + nameBytes.length
    localOffset += localHeader.length + nameBytes.length + dataBytes.length
  })

  const endRecord = new Uint8Array(22)
  const endView = new DataView(endRecord.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true)
  endView.setUint16(6, 0, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, localOffset, true)
  endView.setUint16(20, 0, true)

  const blobParts: BlobPart[] = [...localChunks, ...centralChunks, endRecord].map(
    toArrayBuffer
  )

  return new Blob(blobParts, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

function getImportMetricItems(result: ProductoImportResponse) {
  const metrics = [
    { label: "Filas procesadas", value: result.filasProcesadas },
    { label: "Productos creados", value: result.productosCreados },
    { label: "Productos actualizados", value: result.productosActualizados },
    { label: "Variantes guardadas", value: result.variantesGuardadas },
    ...(typeof result.categoriasCreadas === "number"
      ? [{ label: "Categorias creadas", value: result.categoriasCreadas }]
      : []),
    { label: "Colores creados", value: result.coloresCreados },
    { label: "Tallas creadas", value: result.tallasCreadas },
  ]

  return metrics
}

export function ProductosCargaMasivaPage() {
  const { user } = useAuth()
  const { isImporting, lastResult, importFile } = useProductoImport()
  const {
    history,
    page,
    totalPages,
    totalElements,
    loading: loadingHistory,
    error: errorHistory,
    setPage,
    refreshHistory,
  } = useProductoImportHistory()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dateFilter, setDateFilter] = useState("ALL")
  const [userFilter, setUserFilter] = useState("ALL")

  const dateOptions = useMemo(() => {
    const uniqueDates = Array.from(
      new Set(
        history
          .map((item) => item.createdAt.slice(0, 10))
          .filter((dateKey) => dateKey !== "")
      )
    )
    return uniqueDates.sort((a, b) => b.localeCompare(a))
  }, [history])

  const userOptions = useMemo(() => {
    const uniqueUsers = Array.from(new Set(history.map((item) => item.nombreUsuario)))
    return uniqueUsers.sort((a, b) => a.localeCompare(b))
  }, [history])

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const dateKey = item.createdAt.slice(0, 10)
      const passesDateFilter = dateFilter === "ALL" || dateFilter === dateKey
      const passesUserFilter =
        userFilter === "ALL" || userFilter === item.nombreUsuario
      return passesDateFilter && passesUserFilter
    })
  }, [dateFilter, history, userFilter])

  const handleFileSelection = (file: File | null) => {
    if (!file) return

    if (!isAcceptedFile(file)) {
      setSelectedFile(null)
      setFileError("Archivo no valido. Solo se permiten .xlsx o .xls")
      return
    }

    setFileError(null)
    setSelectedFile(file)
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    handleFileSelection(file)
    event.target.value = ""
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0] ?? null
    handleFileSelection(file)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async () => {
    if (!selectedFile) {
      setFileError("Seleccione un archivo Excel (.xlsx o .xls)")
      return
    }

    const result = await importFile(selectedFile)

    if (result.ok) {
      setSelectedFile(null)
      setFileError(null)
      toast.success(
        `Importacion completada. Filas procesadas: ${result.data.filasProcesadas}`
      )
      await refreshHistory()
      return
    }

    setFileError(result.message)
    toast.error(result.message)
    await refreshHistory()
  }

  const handleDownloadTemplate = () => {
    const templateHeaders = getTemplateHeadersByRole(user?.rol)
    const xlsxFiles = getXlsxFiles(templateHeaders)
    const blob = buildZipBlob(xlsxFiles)
    downloadFile("plantilla_carga_masiva_productos.xlsx", blob)
  }

  const handleDownloadResult = (item: ProductoImportacionHistorial) => {
    const visualStatus = normalizeUploadStatus(item.estado)
    const summary = [
      `Archivo: ${item.nombreArchivo}`,
      `Usuario: ${item.nombreUsuario}`,
      `Sucursal: ${item.nombreSucursal}`,
      `Fecha: ${formatDateLabel(item.createdAt)}`,
      `Filas procesadas: ${item.filasProcesadas}`,
      `Productos creados: ${item.productosCreados}`,
      `Productos actualizados: ${item.productosActualizados}`,
      `Variantes guardadas: ${item.variantesGuardadas}`,
      `Categorias creadas: ${item.categoriasCreadas}`,
      `Colores creados: ${item.coloresCreados}`,
      `Tallas creadas: ${item.tallasCreadas}`,
      `Duracion (ms): ${item.duracionMs ?? "-"}`,
      `Estado: ${STATUS_LABELS[visualStatus]}`,
      `Mensaje error: ${item.mensajeError ?? "-"}`,
    ].join("\n")

    downloadTextFile(`resultado_${item.nombreArchivo}.txt`, summary)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Gestion de Carga Masiva
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sube un archivo para registrar productos y variantes en lote.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Descargar Plantilla Excel
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              openFilePicker()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            "mt-6 rounded-xl border border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-blue-500/60 bg-blue-50 dark:bg-blue-500/10"
              : "border-border bg-muted/30 hover:border-blue-400",
          ].join(" ")}
          aria-label="Seleccionar archivo de carga masiva"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <ArrowUpTrayIcon className="mx-auto h-9 w-9 text-blue-500" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Arrastra tu archivo aqui o selecciona uno
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Solo archivos .xlsx o .xls
          </p>

          {selectedFile && (
            <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Archivo seleccionado: {selectedFile.name}
            </p>
          )}

          {fileError && (
            <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
              {fileError}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void handleImportFile()
            }}
            disabled={!selectedFile || isImporting}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-4 w-4" />
                Importar archivo
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground">
            Se enviara como <span className="font-mono">multipart/form-data</span>{" "}
            con el campo <span className="font-mono">file</span>.
          </p>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Ultima importacion completada
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {getImportMetricItems(lastResult).map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-emerald-200/70 bg-background p-3 dark:border-emerald-900/40"
                >
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-200/90">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-100">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Historial de Subidas
          </h3>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-10 rounded-lg border bg-background pl-9 pr-8 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Filtrar por Fecha</option>
                {dateOptions.map((dateKey) => (
                  <option key={dateKey} value={dateKey}>
                    {formatDateFilterLabel(dateKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                className="h-10 rounded-lg border bg-background pl-9 pr-8 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Filtrar por Usuario</option>
                {userOptions.map((userName) => (
                  <option key={userName} value={userName}>
                    {userName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Mostrando {filteredHistory.length} registro(s) de {totalElements} en
            esta pagina.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(0, previous - 1))}
              disabled={loadingHistory || page <= 0}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Anterior
            </button>
            <span className="font-medium">
              Pagina {totalPages > 0 ? page + 1 : 0} de {Math.max(totalPages, 0)}
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={loadingHistory || page + 1 >= totalPages}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Archivo</th>
                <th className="px-4 py-3 font-semibold">Registros</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Accion</th>
              </tr>
            </thead>

            <tbody>
              {loadingHistory ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Cargando historial...
                  </td>
                </tr>
              ) : errorHistory ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400"
                  >
                    <p>{errorHistory}</p>
                    <button
                      type="button"
                      onClick={() => {
                        void refreshHistory()
                      }}
                      className="mt-2 rounded-md border border-red-300 px-2 py-1 text-xs transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const visualStatus = normalizeUploadStatus(item.estado)

                  return (
                    <tr
                      key={item.idImportacion}
                      className="border-b text-foreground transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {formatDateLabel(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col">
                          <span>{item.nombreUsuario}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.nombreSucursal}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <DocumentTextIcon className="h-4 w-4" />
                          {item.nombreArchivo}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span>{item.filasProcesadas} filas</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.variantesGuardadas} variantes
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[visualStatus]}`}
                        >
                          {STATUS_LABELS[visualStatus]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadResult(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Descargar detalle de ${item.nombreArchivo}`}
                          title="Descargar detalle"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
