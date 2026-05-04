"use client"

import * as XLSX from "xlsx"
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BuildingStorefrontIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
  CheckCircleIcon,
  SwatchIcon,
  TagIcon,
  ScissorsIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ChangeEvent, DragEvent, useRef, useMemo, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"
import { useCanFilterBySucursal } from "@/lib/hooks/useCanFilterByUsuario"
import { useProductoImport } from "@/lib/hooks/useProductoImport"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { ComboboxOption } from "@/components/ui/combobox"
import {
  PreviewCargaMasivaView,
  type VariantePreview,
  type ProductoPreview,
} from "@/components/productos/PreviewCargaMasivaView"
import { toPickerColor } from "@/components/colores/colores.utils"
import { generateBarcode } from "@/lib/barcode-generator"
import {
  buildAutoSkuByVariantKey,
  getNextSkuSequenceFromPayload,
} from "@/lib/producto-auto-identifiers"
import type { ProductoImportRequest } from "@/lib/types/producto"
import { validarCargaMasiva } from "@/lib/utils/validacion-carga-masiva"

type WizardStep = "upload" | "preview" | "result"

const STEPS: Array<{ key: WizardStep; label: string; icon: typeof ArrowUpTrayIcon }> = [
  { key: "upload", label: "Subir archivo", icon: ArrowUpTrayIcon },
  { key: "preview", label: "Vista previa", icon: EyeIcon },
  { key: "result", label: "Resultado", icon: CheckCircleIcon },
]

// Normaliza el nombre de columna (soporta camelCase y nombres legibles del template)
const EXCEL_COLUMN_MAP: Record<string, keyof (VariantePreview & ProductoPreview & { sucursal: string })> = {
  codigomodelo: "codigoModelo",
  "cód. modelo": "codigoModelo",
  "cod. modelo": "codigoModelo",
  "codigo modelo": "codigoModelo",
  nombreproducto: "nombreProducto",
  "nombre producto": "nombreProducto",
  categorianombre: "categoriaNombre",
  "categoría": "categoriaNombre",
  "categoria": "categoriaNombre",
  descripcion: "descripcion",
  "descripción": "descripcion",
  colornombre: "colorNombre",
  color: "colorNombre",
  tallanombre: "tallaNombre",
  talla: "tallaNombre",
  sku: "sku",
  "sku variante": "sku",
  codigobarras: "codigoBarras",
  "cód. barras": "codigoBarras",
  "cod. barras": "codigoBarras",
  "codigo barras": "codigoBarras",
  precio: "precio",
  "precio venta": "precio",
  preciomayor: "precioMayor",
  "precio mayor": "precioMayor",
  stock: "stock",
  sucursal: "sucursal",
}

function normalizeHexInput(value: string): string | null {
  const trimmed = value.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return null
}

function isLightHex(hex: string): boolean {
  const clean = hex.replace("#", "")
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

function applyAutoIdentifiersToProductos(
  productos: ProductoPreview[],
  options: { autoSku: boolean; autoBarcode: boolean }
): ProductoPreview[] {
  const { autoSku, autoBarcode } = options
  let nextSkuSequence = getNextSkuSequenceFromPayload(productos)

  return productos.map((producto) => {
    const autoSkuByVariantKey = autoSku
      ? buildAutoSkuByVariantKey(
          producto.nombreProducto,
          producto.variantes.map((variante, index) => {
            const key = `${producto.codigoModelo}-${index}`
            return {
              key,
              colorName: variante.colorNombre,
              tallaName: variante.tallaNombre,
              currentSku: variante.sku,
              preserveExisting: variante.sku.trim() !== "",
            }
          }),
          nextSkuSequence
        )
      : {}

    nextSkuSequence += Object.keys(autoSkuByVariantKey).length

    return {
      ...producto,
      variantes: producto.variantes.map((variante, index) => {
        const key = `${producto.codigoModelo}-${index}`
        const nextSku = autoSkuByVariantKey[key]

        return {
          ...variante,
          sku: nextSku ?? variante.sku,
          codigoBarras:
            autoBarcode && variante.codigoBarras.trim() === ""
              ? generateBarcode()
              : variante.codigoBarras,
        }
      }),
    }
  })
}

function buildProductoImportPayload(params: {
  idSucursalDestino: number | null
  nombreSucursalDestino: string | null
  productos: ProductoPreview[]
  missingCategorias: string[]
  missingColores: string[]
  missingTallas: string[]
  savedColorHexes: Record<string, string>
}): ProductoImportRequest {
  const {
    idSucursalDestino,
    nombreSucursalDestino,
    productos,
    missingCategorias,
    missingColores,
    missingTallas,
    savedColorHexes,
  } = params

  return {
    configuracionImportacion: {
      idSucursalDestino,
      nombreSucursalDestino,
    },
    productos: productos.map((producto) => ({
      nombreProducto: producto.nombreProducto,
      categoriaNombre: producto.categoriaNombre,
      descripcion: producto.descripcion,
      variantes: producto.variantes.map((variante) => {
        const colorHex =
          variante.colorHex ?? savedColorHexes[variante.colorNombre.trim().toLowerCase()]

        return {
          colorNombre: variante.colorNombre,
          ...(colorHex ? { colorHex } : {}),
          tallaNombre: variante.tallaNombre,
          sku: variante.sku,
          codigoBarras: variante.codigoBarras,
          precio: variante.precio,
          precioMayor: variante.precioMayor,
          stock: variante.stock,
        }
      }),
    })),
    valoresNuevosDetectados: {
      missingCategorias,
      missingColores,
      missingTallas,
      savedColorHexes,
    },
  }
}

interface ColorHexBulkEditDialogProps {
  open: boolean
  colorNames: string[]
  drafts: Record<string, string>
  mode?: "edit" | "import"
  onDraftChange: (colorName: string, value: string) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onImportWithoutHex?: () => void
  onImportWithHex?: () => void
}

function ColorHexBulkEditDialog({
  open,
  colorNames,
  drafts,
  mode = "edit",
  onDraftChange,
  onOpenChange,
  onSave,
  onImportWithoutHex,
  onImportWithHex,
}: ColorHexBulkEditDialogProps) {
  const missingHexColors = colorNames.filter((colorName) => !normalizeHexInput(drafts[colorName] ?? ""))
  const isImportMode = mode === "import"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isImportMode ? "Aun falta agregar hexadecimales" : "Editar hex de colores nuevos"}
          </DialogTitle>
          <DialogDescription>
            {isImportMode
              ? "Completa los hexadecimales faltantes o importa sin hexadecimal."
              : "Selecciona color y escribe codigo hexadecimal en input HEX."}
          </DialogDescription>
        </DialogHeader>

        {isImportMode && missingHexColors.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
            Faltan hexadecimales para: {missingHexColors.join(", ")}.
          </div>
        )}

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-2 pr-1">
          {colorNames.map((colorName) => {
            const draft = drafts[colorName] ?? ""
            const validHex = normalizeHexInput(draft)

            return (
              <div
                key={colorName}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: validHex ?? "#E2E8F0" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{colorName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Selector visual + valor hexadecimal.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`color-hex-${colorName}`}>Codigo HEX</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id={`color-hex-${colorName}`}
                      value={draft}
                      onChange={(event) =>
                        onDraftChange(colorName, event.target.value.toUpperCase())
                      }
                      placeholder="#001F5B"
                      maxLength={7}
                      className={cn(
                        "font-mono",
                        validHex
                          ? "border-emerald-400 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : draft
                          ? "border-red-300 bg-red-50/70 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                          : ""
                      )}
                    />
                    <input
                      type="color"
                      value={toPickerColor(draft)}
                      onChange={(event) =>
                        onDraftChange(colorName, event.target.value.toUpperCase())
                      }
                      className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                      aria-label={`Selector de color para ${colorName}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {isImportMode ? "Cancelar" : "Cerrar"}
            </Button>
          </DialogClose>
          {isImportMode ? (
            <>
              <Button type="button" variant="outline" onClick={onImportWithoutHex}>
                Importar sin hexadecimal
              </Button>
              <Button
                type="button"
                onClick={onImportWithHex}
                disabled={missingHexColors.length > 0}
              >
                Importar
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onSave}>
              Guardar hex
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

async function parseExcelFile(file: File): Promise<ProductoPreview[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  })

  // Normalizar claves de columna
  const normalizedRows = rawRows.map((row) => {
    const out: Record<string, string> = {}
    for (const [key, val] of Object.entries(row)) {
      const mapped = EXCEL_COLUMN_MAP[key.trim().toLowerCase()]
      if (mapped) out[mapped] = String(val ?? "").trim()
    }
    return out
  })

  // Agrupar por codigoModelo
  const productosMap = new Map<string, ProductoPreview>()
  let lastCodigo = ""

  for (const row of normalizedRows) {
    const codigo = row["codigoModelo"] || lastCodigo
    if (!codigo) continue
    lastCodigo = codigo

    if (!productosMap.has(codigo)) {
      productosMap.set(codigo, {
        codigoModelo: codigo,
        nombreProducto: row["nombreProducto"] || "",
        categoriaNombre: row["categoriaNombre"] || "",
        descripcion: row["descripcion"] || "",
        variantes: [],
      })
    }

    const prod = productosMap.get(codigo)!
    // Si hay campos del producto en esta fila, usarlos
    if (!prod.nombreProducto && row["nombreProducto"]) prod.nombreProducto = row["nombreProducto"]
    if (!prod.categoriaNombre && row["categoriaNombre"]) prod.categoriaNombre = row["categoriaNombre"]
    if (!prod.descripcion && row["descripcion"]) prod.descripcion = row["descripcion"]

    // Agregar variante si tiene al menos color, talla o sku
    if (row["colorNombre"] || row["tallaNombre"] || row["sku"]) {
      prod.variantes.push({
        colorNombre: row["colorNombre"] || "",
        tallaNombre: row["tallaNombre"] || "",
        sku: row["sku"] || "",
        codigoBarras: row["codigoBarras"] || "",
        precio: row["precio"] || "",
        precioMayor: row["precioMayor"] || "",
        stock: row["stock"] || "",
      })
    }
  }

  return Array.from(productosMap.values())
}

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"]
const ACCEPTED_FILES = ACCEPTED_EXTENSIONS.join(",")
const BASE_TEMPLATE_HEADERS = [
  "codigoModelo",
  "nombreProducto",
  "categoriaNombre",
  "descripcion",
  "colorNombre",
  "tallaNombre",
  "sku",
  "codigoBarras",
  "precio",
  "precioMayor",
  "stock",
]

function getTemplateHeadersByRole(rol?: string): string[] {
  const normalizedRole = (rol ?? "").trim().toUpperCase()
  const needsSucursalColumn =
    normalizedRole === "ADMINISTRADOR" ||
    normalizedRole === "VENTAS" ||
    normalizedRole === "ALMACEN" ||
    normalizedRole === "VENTAS_ALMACEN"

  return needsSucursalColumn
    ? [...BASE_TEMPLATE_HEADERS, "sucursal"]
    : BASE_TEMPLATE_HEADERS
}

function isAcceptedFile(file: File): boolean {
  const lowerCaseName = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension)
  )
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
  if (header === "codigoModelo") return 16
  if (header === "sku") return 18
  if (header === "codigoBarras") return 18
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

function getXlsxFilesWithExample(
  headers: string[],
  exampleData: string[][]
): Array<{ path: string; content: string }> {
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

  // Generate data rows
  const dataRows = exampleData
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 2 // Row 1 is header
      const cells = row
        .map((value, colIndex) => {
          const cellRef = `${getColumnLetter(colIndex)}${rowNumber}`
          if (value === "") {
            return `<c r="${cellRef}"/>`
          }
          return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
        })
        .join("")
      return `<row r="${rowNumber}">${cells}</row>`
    })
    .join("")

  const lastColumn = getColumnLetter(Math.max(0, headers.length - 1))
  const lastRow = exampleData.length + 1
  const dimension =
    headers.length > 0 && exampleData.length > 0
      ? `A1:${lastColumn}${lastRow}`
      : "A1"

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
    ${dataRows}
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

export function ProductosCargaMasivaPage() {
  const { user } = useAuth()
  const isAdmin = isAdministratorRole(user?.rol)
  const canFilterBySucursal = useCanFilterBySucursal()
  const isMultiSucursalNonAdmin = !isAdmin && canFilterBySucursal && (user?.sucursalesPermitidas ?? []).length > 1
  const defaultSucursalId = typeof user?.idSucursal === "number" && user.idSucursal > 0 ? user.idSucursal : null
  const { isImporting, importFile } = useProductoImport()
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(
    isMultiSucursalNonAdmin ? defaultSucursalId : null
  )
  const {
    sucursalOptions: adminSucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin, "VENTA")

  const nonAdminSucursalVentaOptions = useMemo<ComboboxOption[]>(
    () =>
      isMultiSucursalNonAdmin
        ? (user?.sucursalesPermitidas ?? [])
            .filter((s) => !s.tipoSucursal || s.tipoSucursal === "VENTA")
            .map((s) => ({ value: String(s.idSucursal), label: s.nombreSucursal }))
        : [],
    [isMultiSucursalNonAdmin, user?.sucursalesPermitidas]
  )

  const sucursalOptions = useMemo<ComboboxOption[]>(
    () => isMultiSucursalNonAdmin ? nonAdminSucursalVentaOptions : adminSucursalOptions,
    [isMultiSucursalNonAdmin, nonAdminSucursalVentaOptions, adminSucursalOptions]
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload")
  const [isParsing, setIsParsing] = useState(false)
  const [previewProductos, setPreviewProductos] = useState<ProductoPreview[]>([])
  const [missingCategorias, setMissingCategorias] = useState<string[]>([])
  const [missingColores, setMissingColores] = useState<string[]>([])
  const [missingTallas, setMissingTallas] = useState<string[]>([])
  const [autoSku, setAutoSku] = useState(true)
  const [autoBarcode, setAutoBarcode] = useState(true)
  const [showColorHexEditor, setShowColorHexEditor] = useState(false)
  const [colorHexEditorMode, setColorHexEditorMode] = useState<"edit" | "import">("edit")
  const [colorHexDrafts, setColorHexDrafts] = useState<Record<string, string>>({})
  const [savedColorHexes, setSavedColorHexes] = useState<Record<string, string>>({})

  // Nombre legible de la sucursal destino (para mostrar en preview)
  const selectedSucursalName = useMemo(() => {
    if (!isAdmin && !isMultiSucursalNonAdmin) return user?.nombreSucursal ?? null
    if (selectedSucursalId === null) return null
    const found = sucursalOptions.find((s) => s.value === String(selectedSucursalId))
    return found?.label ?? `Sucursal #${selectedSucursalId}`
  }, [isAdmin, isMultiSucursalNonAdmin, user?.nombreSucursal, selectedSucursalId, sucursalOptions])

  // Edición inline de variantes (SKU / código de barras)
  const handleVarianteChange = (
    codigoModelo: string,
    colorNombre: string,
    tallaNombre: string,
    field: "sku" | "codigoBarras",
    value: string
  ) => {
    setPreviewProductos((prev) =>
      prev.map((p) =>
        p.codigoModelo !== codigoModelo
          ? p
          : {
              ...p,
              variantes: p.variantes.map((v) =>
                v.colorNombre !== colorNombre || v.tallaNombre !== tallaNombre
                  ? v
                  : { ...v, [field]: value }
              ),
            }
      )
    )
  }

  const buildValidatedColorHexes = (drafts: Record<string, string>) => {
    return Object.entries(drafts).reduce<Record<string, string>>(
      (acc, [nombre, val]) => {
        const hex = normalizeHexInput(val)
        if (hex) acc[nombre.toLowerCase()] = hex
        return acc
      },
      {}
    )
  }

  // Guardar hexadecimales de colores nuevos → actualiza previewProductos
  const handleSaveColorHexes = (options?: { closeModal?: boolean; successToast?: boolean }) => {
    const validated = buildValidatedColorHexes(colorHexDrafts)
    setSavedColorHexes((prev) => ({ ...prev, ...validated }))
    setPreviewProductos((prev) =>
      prev.map((p) => ({
        ...p,
        variantes: p.variantes.map((v) => {
          const hex = validated[v.colorNombre.trim().toLowerCase()]
          return hex ? { ...v, colorHex: hex } : v
        }),
      }))
    )
    if (options?.successToast !== false) {
      toast.success("Hexadecimales actualizados en vista previa")
    }
    if (options?.closeModal !== false) {
      setShowColorHexEditor(false)
    }
    return validated
  }

  const getMissingHexColorNames = (hexMap: Record<string, string>) =>
    missingColores.filter((colorName) => {
      const hex = hexMap[colorName.trim().toLowerCase()]
      return !normalizeHexInput(hex ?? "")
    })

  const openColorHexEditor = (mode: "edit" | "import") => {
    setColorHexDrafts(
      Object.fromEntries(
        missingColores.map((c) => [c, savedColorHexes[c.toLowerCase()] ?? ""])
      )
    )
    setColorHexEditorMode(mode)
    setShowColorHexEditor(true)
  }

  const handleOpenColorHexEditor = () => {
    openColorHexEditor("edit")
  }

  const handleToggleAutoSku = () => {
    setAutoSku((previous) => {
      const next = !previous
      if (next) {
        setPreviewProductos((current) =>
          applyAutoIdentifiersToProductos(current, { autoSku: true, autoBarcode })
        )
      }
      return next
    })
  }

  const handleToggleAutoBarcode = () => {
    setAutoBarcode((previous) => {
      const next = !previous
      if (next) {
        setPreviewProductos((current) =>
          applyAutoIdentifiersToProductos(current, { autoSku, autoBarcode: true })
        )
      }
      return next
    })
  }

  const runImport = async (hexMapOverride?: Record<string, string>) => {
    const effectiveHexMap = hexMapOverride ?? savedColorHexes

    const payload = buildProductoImportPayload({
      idSucursalDestino: selectedSucursalId,
      nombreSucursalDestino: selectedSucursalName,
      productos: previewProductos,
      missingCategorias,
      missingColores,
      missingTallas,
      savedColorHexes: effectiveHexMap,
    })

    const result = await importFile(payload)
    if (result.ok) {
      setShowColorHexEditor(false)
      setCurrentStep("result")
      toast.success(`ImportaciÃ³n completada. Filas procesadas: ${result.data.filasProcesadas}`)
      return
    }

    toast.error(result.message)
  }

  const getCurrentStepIndex = () => STEPS.findIndex((step) => step.key === currentStep)

  // Wizard Progress Bar Component
  const WizardProgressBar = () => {
    const currentIndex = getCurrentStepIndex()
    return (
      <div className="mb-8 px-1">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {STEPS[currentIndex]?.label}
          </p>
          <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
            Paso {currentIndex + 1} de {STEPS.length}
          </span>
        </div>
        <div className="relative flex items-start justify-between">
          <div className="absolute left-5 right-5 top-5 h-0.5 bg-border" />
          <div
            className="absolute left-5 top-5 h-0.5 bg-blue-600 transition-all duration-500 ease-in-out"
            style={{
              width:
                currentIndex === 0
                  ? "0%"
                  : `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 2.5rem)`,
            }}
          />
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            return (
              <div key={step.key} className="relative z-10 flex w-24 flex-col items-center gap-2">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-blue-600 shadow-md shadow-blue-600/25"
                      : isCurrent
                      ? "border-[3px] border-blue-600 bg-blue-600 shadow-md shadow-blue-600/20"
                      : "border-2 border-border bg-card",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  ) : isCurrent ? (
                    <Icon className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <span
                  className={[
                    "text-center text-[11px] font-medium leading-tight",
                    isCompleted || isCurrent ? "text-blue-600" : "text-muted-foreground",
                    isCurrent && "font-semibold",
                  ].filter(Boolean).join(" ")}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Upload Step Content
  const UploadStepContent = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">Subir Archivo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube tu archivo Excel o CSV con los productos a importar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* File upload area */}
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
            "flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-blue-600 bg-blue-600/5"
              : "border-border bg-muted/20 hover:border-blue-400 hover:bg-muted/30",
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

          <ArrowUpTrayIcon className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm font-semibold text-foreground">
            Arrastra tu archivo aquí o haz clic para seleccionar
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Formatos: .xlsx, .xls, .csv (máx. 5,000 filas)
          </p>

          {selectedFile && (
            <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ✓ {selectedFile.name}
            </p>
          )}

          {fileError && (
            <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
              {fileError}
            </p>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Location selector */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-lg bg-muted p-2">
                <TableCellsIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Ubicación destino
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Los precios y stock se asignarán a esta tienda
                </p>
                <div className="mt-3">
                  {isAdmin || isMultiSucursalNonAdmin ? (
                    <>
                      <Combobox
                        id="carga-masiva-sucursal"
                        value={selectedSucursalId !== null ? String(selectedSucursalId) : ""}
                        options={sucursalOptions}
                        searchValue={searchSucursal}
                        onSearchValueChange={setSearchSucursal}
                        onValueChange={(value) =>
                          setSelectedSucursalId(value ? Number(value) : isMultiSucursalNonAdmin ? defaultSucursalId : null)
                        }
                        placeholder={isMultiSucursalNonAdmin ? "Selecciona sucursal" : "Selecciona sucursal"}
                        searchPlaceholder="Buscar sucursal..."
                        emptyMessage="No se encontraron sucursales"
                        loading={loadingSucursales}
                      />
                      {isAdmin && errorSucursales && (
                        <p className="mt-1 text-[11px] text-red-500">{errorSucursales}</p>
                      )}
                      {!isMultiSucursalNonAdmin && !errorSucursales && selectedSucursalId === null && (
                        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                          Selecciona una sucursal para continuar
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3">
                      <span className="truncate text-sm text-muted-foreground">
                        {user?.nombreSucursal || "Sin sucursal asignada"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Template download */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-lg bg-muted p-2">
                <DocumentArrowDownIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Plantilla de ejemplo
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Descarga una plantilla con el formato correcto
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleContinuarDesdeUpload}
          disabled={!selectedFile || isParsing || selectedSucursalId === null}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isParsing ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Continuar
              <ChevronRightIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )

  // Preview Step Content — fuera del card wizard, con alerta de validación
  const PreviewStepContent = () => {
    const totalVariantes = previewProductos.reduce((acc, p) => acc + p.variantes.length, 0)
    const hasMissing =
      missingCategorias.length > 0 || missingColores.length > 0 || missingTallas.length > 0

    return (
      <div className="space-y-5">
        {/* Header con contadores */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Vista Previa</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifica los datos del archivo antes de importar
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Contadores */}
            <div className="rounded-lg border bg-card px-3 py-2 text-center shadow-sm">
              <p className="text-lg font-bold text-foreground">{previewProductos.length}</p>
              <p className="text-[11px] text-muted-foreground">Modelos</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2 text-center shadow-sm">
              <p className="text-lg font-bold text-foreground">{totalVariantes}</p>
              <p className="text-[11px] text-muted-foreground">Variantes</p>
            </div>

            {/* Sucursal destino */}
            {selectedSucursalName && (
              <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 dark:border-blue-700/40 dark:bg-blue-900/10">
                <BuildingStorefrontIcon className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-blue-500 dark:text-blue-400">
                    Destino
                  </p>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {selectedSucursalName}
                  </p>
                </div>
              </div>
            )}

            {/* Toggles auto-generación */}
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
              <button
                type="button"
                    onClick={handleToggleAutoSku}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    autoSku ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 translate-x-1 rounded-full bg-white shadow transition-transform",
                      autoSku && "translate-x-4"
                    )}
                  />
                </span>
                <span className={cn("font-medium", autoSku ? "text-foreground" : "text-muted-foreground")}>
                  SKU auto
                </span>
              </button>
              <div className="h-4 w-px bg-border" />
              <button
                type="button"
                    onClick={handleToggleAutoBarcode}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    autoBarcode ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 translate-x-1 rounded-full bg-white shadow transition-transform",
                      autoBarcode && "translate-x-4"
                    )}
                  />
                </span>
                <span className={cn("font-medium", autoBarcode ? "text-foreground" : "text-muted-foreground")}>
                  Cód. Barras auto
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Valores no registrados en BD — tarjetas por tipo */}
        {hasMissing && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Valores nuevos — se crearán automáticamente al importar
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Categorías */}
              {missingCategorias.length > 0 && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-700/40 dark:bg-violet-900/10">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <TagIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">
                        Categorías nuevas
                      </p>
                      <p className="text-[10px] text-violet-500 dark:text-violet-400">
                        {missingCategorias.length} por crear
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingCategorias.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colores */}
              {missingColores.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-700/40 dark:bg-rose-900/10">
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                        <SwatchIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                          Colores nuevos
                        </p>
                        <p className="text-[10px] text-rose-500 dark:text-rose-400">
                          {missingColores.length} por crear
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenColorHexEditor}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-600/40 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Editar hex
                    </button>
                  </div>

                  {/* Badges: círculo hex si guardado, texto si no */}
                  <div className="flex flex-wrap gap-1.5">
                    {missingColores.map((c) => {
                      const hex = savedColorHexes[c.toLowerCase()]
                      return hex ? (
                        <span
                          key={c}
                          title={c}
                          className={cn(
                            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                            isLightHex(hex)
                              ? "border-rose-300"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      ) : (
                        <span
                          key={c}
                          className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                        >
                          {c}
                        </span>
                      )
                    })}
                  </div>

                  {/* Editor inline de hexadecimales */}
                  {false && showColorHexEditor && (
                    <div className="mt-3 space-y-2 border-t border-rose-200 pt-3 dark:border-rose-700/40">
                      {missingColores.map((c) => {
                        const draft = colorHexDrafts[c] ?? ""
                        const validHex = normalizeHexInput(draft)
                        return (
                          <div key={c} className="flex items-center gap-2.5">
                            <span
                              className="h-5 w-5 shrink-0 rounded-full border border-rose-300"
                              style={{ backgroundColor: validHex ?? "#fda4af" }}
                            />
                            <span className="w-28 truncate text-xs font-medium text-rose-800 dark:text-rose-300">
                              {c}
                            </span>
                            <input
                              type="text"
                              placeholder="#RRGGBB"
                              value={draft}
                              maxLength={7}
                              onChange={(e) =>
                                setColorHexDrafts((prev) => ({ ...prev, [c]: e.target.value }))
                              }
                              className={cn(
                                "h-7 w-28 rounded-md border px-2 font-mono text-xs outline-none transition focus:ring-1",
                                validHex
                                  ? "border-emerald-400 bg-emerald-50/80 text-emerald-800 focus:ring-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-300"
                                  : draft
                                  ? "border-red-300 bg-red-50/80 text-red-700 focus:ring-red-300 dark:bg-red-900/20 dark:text-red-300"
                                  : "border-rose-300 bg-white/80 text-rose-900 focus:ring-rose-400 dark:bg-rose-900/10 dark:text-rose-200"
                              )}
                            />
                            {validHex && (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ✓
                              </span>
                            )}
                          </div>
                        )
                      })}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSaveColorHexes}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tallas */}
              {missingTallas.length > 0 && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-700/40 dark:bg-sky-900/10">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                      <ScissorsIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                        Tallas nuevas
                      </p>
                      <p className="text-[10px] text-sky-500 dark:text-sky-400">
                        {missingTallas.length} por crear
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingTallas.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista con filtros */}
        <PreviewCargaMasivaView
          productos={previewProductos}
          autoSku={autoSku}
          autoBarcode={autoBarcode}
          onVarianteChange={handleVarianteChange}
        />

        {/* Navegación */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setCurrentStep("upload")
              setMissingCategorias([])
              setMissingColores([])
              setMissingTallas([])
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Volver
          </button>
          <button
            type="button"
            onClick={handleImportAndAdvance}
            disabled={isImporting || previewProductos.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                Importar Ahora
                <ArrowUpTrayIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Result Step Content
  const ResultStepContent = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">Resultado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen de la importación realizada
        </p>
      </div>

      <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/5 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/10">
          <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
        </div>
        <h4 className="mt-4 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
          Importación Completada
        </h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Los productos han sido importados exitosamente
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Productos creados", value: "3" },
          { label: "Variantes guardadas", value: "8" },
          { label: "Colores creados", value: "2" },
          { label: "Tallas creadas", value: "6" },
          { label: "Categorías creadas", value: "3" },
          { label: "Errores", value: "0" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setCurrentStep("upload")
            setSelectedFile(null)
            setFileError(null)
            setPreviewProductos([])
            setMissingCategorias([])
            setMissingColores([])
            setMissingTallas([])
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Nueva Importación
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Descargar Reporte
        </button>
      </div>
    </div>
  )

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

  const handleContinuarDesdeUpload = async () => {
    if (!selectedFile) return
    setIsParsing(true)
    try {
      const productos = await parseExcelFile(selectedFile)
      if (productos.length === 0) {
        setFileError("No se encontraron productos válidos en el archivo. Usa la plantilla de ejemplo.")
        return
      }

      // Validar valores contra la BD y enriquecer colores con hex (silencioso si falla red)
      let enrichedProductos = productos
      try {
        const categoriasExcel = [
          ...new Set(productos.map((p) => p.categoriaNombre).filter(Boolean)),
        ]
        const coloresExcel = [
          ...new Set(
            productos.flatMap((p) => p.variantes.map((v) => v.colorNombre)).filter(Boolean)
          ),
        ]
        const tallasExcel = [
          ...new Set(
            productos.flatMap((p) => p.variantes.map((v) => v.tallaNombre)).filter(Boolean)
          ),
        ]
        const validation = await validarCargaMasiva(categoriasExcel, coloresExcel, tallasExcel)
        setMissingCategorias(validation.missingCategorias)
        setMissingColores(validation.missingColores)
        setMissingTallas(validation.missingTallas)

        // Enriquecer cada variante con el hex del color que existe en BD
        enrichedProductos = productos.map((p) => ({
          ...p,
          variantes: p.variantes.map((v) => ({
            ...v,
            colorHex:
              validation.colorHexMap[v.colorNombre.trim().toLowerCase()] ?? undefined,
          })),
        }))
      } catch {
        setMissingCategorias([])
        setMissingColores([])
        setMissingTallas([])
      }

      setPreviewProductos(
        applyAutoIdentifiersToProductos(enrichedProductos, {
          autoSku,
          autoBarcode,
        })
      )
      setCurrentStep("preview")
    } catch {
      setFileError("Error al leer el archivo. Verifica que sea un Excel válido (.xlsx o .xls).")
    } finally {
      setIsParsing(false)
    }
  }

  const handleImportAndAdvance = async () => {
    if (previewProductos.length === 0) {
      toast.error("No hay productos listos para importar")
      return
    }

if (selectedSucursalId === null) {
      toast.error("Selecciona una sucursal destino antes de importar")
      return
    }

    const missingHexColors = getMissingHexColorNames(savedColorHexes)
    if (missingHexColors.length > 0) {
      openColorHexEditor("import")
      return
    }

    const payload = buildProductoImportPayload({
      idSucursalDestino: selectedSucursalId,
      nombreSucursalDestino: selectedSucursalName,
      productos: previewProductos,
      missingCategorias,
      missingColores,
      missingTallas,
      savedColorHexes,
    })

    const result = await importFile(payload)
    if (result.ok) {
      setCurrentStep("result")
      toast.success(`Importación completada. Filas procesadas: ${result.data.filasProcesadas}`)
    } else {
      toast.error(result.message)
    }
  }

  const handleImportWithoutHex = async () => {
    await runImport()
  }

  const handleImportWithHex = async () => {
    const validated = handleSaveColorHexes({ closeModal: false, successToast: false })
    const nextHexMap = { ...savedColorHexes, ...validated }
    const missingHexColors = getMissingHexColorNames(nextHexMap)

    if (missingHexColors.length > 0) {
      toast.error("Aun faltan hexadecimales para importar")
      return
    }

    await runImport(nextHexMap)
  }

  const handleDownloadTemplate = () => {
    // Headers de la plantilla según los datos de ejemplo
    const headers = [
      "Cód. Modelo",
      "Nombre Producto",
      "Categoría",
      "Descripción",
      "Color",
      "Talla",
      "SKU Variante",
      "Cód. Barras",
      "Precio Venta",
      "Precio Mayor",
      "Stock",
    ]

    // Datos de ejemplo
    const exampleData = [
      ["MOD-001", "Polo Slim Fit", "Varones", "Algodón 100% Pima", "ROJO", "S", "PS-001-R-S", "775001001", "45.00", "35.00", "20"],
      ["MOD-001", "", "", "", "ROJO", "M", "PS-001-R-M", "775011002", "45.00", "35.00", "15"],
      ["MOD-001", "", "", "", "AZUL", "S", "PS-001-A-S", "775021003", "45.00", "35.00", "10"],
      ["MOD-001", "", "", "", "AZUL", "M", "PS-001-A-M", "775031004", "45.00", "35.00", "12"],
      ["MOD-002", "Jeans Stretch", "Damas", "Mezclilla Premium", "NEGRO", "28", "JS-002-N-28", "884001001", "85.00", "70.00", "5"],
      ["MOD-002", "", "", "", "NEGRO", "30", "JS-002-N-30", "884001002", "85.00", "70.00", "8"],
      ["MOD-002", "", "", "", "NEGRO", "32", "JS-002-N-32", "884001003", "85.00", "70.00", "10"],
      ["MOD-003", "Casaca Denim", "Juvenil", "Casaca con forro", "AZUL", "L", "CD-003-A-L", "992001001", "120.00", "95.00", ""],
    ]

    const xlsxFiles = getXlsxFilesWithExample(headers, exampleData)
    const blob = buildZipBlob(xlsxFiles)
    downloadFile("plantilla_carga_masiva_productos.xlsx", blob)
  }

  return (
    <div className="space-y-6">
      {/* Wizard Container */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Gestión de Carga Masiva
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Importa productos y variantes en lote siguiendo los pasos
            </p>
          </div>
          <Link
            href="/productos/carga-masiva/historial"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <ClockIcon className="h-4 w-4" />
            Ver Historial
          </Link>
        </div>

        <div className="mt-6">
          <WizardProgressBar />
        </div>

        {currentStep !== "preview" && (
          <div className="mt-6">
            {currentStep === "upload" && <UploadStepContent />}
            {currentStep === "result" && <ResultStepContent />}
          </div>
        )}
      </section>

      {/* Vista previa — fuera del card para mostrar sin contenedor */}
      {currentStep === "preview" && <PreviewStepContent />}

      <ColorHexBulkEditDialog
        open={showColorHexEditor}
        colorNames={missingColores}
        drafts={colorHexDrafts}
        mode={colorHexEditorMode}
        onDraftChange={(colorName, value) =>
          setColorHexDrafts((prev) => ({ ...prev, [colorName]: value }))
        }
        onOpenChange={setShowColorHexEditor}
        onSave={handleSaveColorHexes}
        onImportWithoutHex={handleImportWithoutHex}
        onImportWithHex={handleImportWithHex}
      />
    </div>
  )
}
