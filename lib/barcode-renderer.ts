/**
 * Encoder y renderizador de código de barras Code 128B.
 * Implementación pura sin dependencias externas.
 */

// Cada símbolo Code 128 se define como 6 anchos alternados (bar, space, bar, space, bar, space)
// que suman 11 módulos por símbolo.
const PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],
]

// Stop: 7 anchos (13 módulos), incluye barra de terminación
const STOP_PATTERN = [2, 3, 3, 1, 1, 1, 2]

const START_B_VALUE = 104

function encodeCode128B(text: string): number[] {
  const values: number[] = [START_B_VALUE]

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    values.push(code >= 32 && code <= 126 ? code - 32 : 0)
  }

  let checksum = values[0]
  for (let i = 1; i < values.length; i++) {
    checksum += i * values[i]
  }
  values.push(checksum % 103)

  return values
}

function valuesToModules(values: number[]): boolean[] {
  const modules: boolean[] = []

  for (const value of values) {
    const pattern = PATTERNS[value]
    for (let w = 0; w < pattern.length; w++) {
      const isBar = w % 2 === 0
      for (let m = 0; m < pattern[w]; m++) {
        modules.push(isBar)
      }
    }
  }

  for (let w = 0; w < STOP_PATTERN.length; w++) {
    const isBar = w % 2 === 0
    for (let m = 0; m < STOP_PATTERN[w]; m++) {
      modules.push(isBar)
    }
  }

  return modules
}

export interface BarcodeRenderOptions {
  barWidth?: number
  height?: number
  margin?: number
  fontSize?: number
}

export interface BarcodeModel {
  text: string
  modules: boolean[]
  barWidth: number
  height: number
  margin: number
  fontSize: number
  textGap: number
  barcodeWidth: number
  totalWidth: number
  totalHeight: number
  textY: number
}

function sanitizeBarcodeText(text: string) {
  return text.trim()
}

function isSupportedCode128BText(text: string) {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 32 || code > 126) {
      return false
    }
  }

  return true
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;")
}

export function buildBarcodeModel(
  text: string,
  options?: BarcodeRenderOptions
): BarcodeModel | null {
  const sanitizedText = sanitizeBarcodeText(text)
  if (!sanitizedText || !isSupportedCode128BText(sanitizedText)) {
    return null
  }

  const barWidth = options?.barWidth ?? 2
  const height = options?.height ?? 80
  const margin = options?.margin ?? 10
  const fontSize = options?.fontSize ?? 14
  const textGap = 10
  const values = encodeCode128B(sanitizedText)
  const modules = valuesToModules(values)
  const barcodeWidth = modules.length * barWidth
  const totalWidth = barcodeWidth + margin * 2
  const textY = margin + height + textGap
  const totalHeight = textY + fontSize + margin

  return {
    text: sanitizedText,
    modules,
    barWidth,
    height,
    margin,
    fontSize,
    textGap,
    barcodeWidth,
    totalWidth,
    totalHeight,
    textY,
  }
}

export function buildBarcodeSvgMarkup(
  text: string,
  options?: BarcodeRenderOptions
): string | null {
  const model = buildBarcodeModel(text, options)
  if (!model) return null

  const bars = model.modules
    .map((isBar, index) => {
      if (!isBar) return ""
      const x = model.margin + index * model.barWidth
      return `<rect x="${x}" y="${model.margin}" width="${model.barWidth}" height="${model.height}" fill="#000000" />`
    })
    .join("")

  const escapedText = escapeSvgText(model.text)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.totalWidth} ${model.totalHeight}" width="${model.totalWidth}" height="${model.totalHeight}" role="img" aria-label="Codigo de barras ${escapedText}">`,
    `<rect width="${model.totalWidth}" height="${model.totalHeight}" fill="#ffffff" />`,
    bars,
    `<text x="${model.totalWidth / 2}" y="${model.textY}" fill="#000000" font-family="monospace" font-size="${model.fontSize}" text-anchor="middle" dominant-baseline="hanging">${escapedText}</text>`,
    "</svg>",
  ].join("")
}

// ---------------------------------------------------------------------------
// EAN-13 encoder & renderer
// ---------------------------------------------------------------------------

const EAN_L_ODD: string[] = [
  "0001101","0011001","0010011","0111101","0100011",
  "0110001","0101111","0111011","0110111","0001011",
]

const EAN_L_EVEN: string[] = [
  "0100111","0110011","0011011","0100001","0011101",
  "0111001","0000101","0010001","0001001","0010111",
]

const EAN_R: string[] = [
  "1110010","1100110","1101100","1000010","1011100",
  "1001110","1010000","1000100","1001000","1110100",
]

// Parity selection for left-side digits based on first digit (L = odd, G = even)
const EAN_PARITY: string[] = [
  "LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG",
  "LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL",
]

function isValidEan13Input(text: string): boolean {
  return /^\d{13}$/.test(text)
}

function encodeEan13Modules(digits: number[]): { modules: boolean[]; guardIndices: Set<number> } {
  const modules: boolean[] = []
  const guardIndices = new Set<number>()

  // Start guard: 101
  const startIdx = modules.length
  modules.push(true, false, true)
  for (let i = startIdx; i < modules.length; i++) guardIndices.add(i)

  // Left 6 digits
  const parity = EAN_PARITY[digits[0]]
  for (let i = 0; i < 6; i++) {
    const pattern = parity[i] === "L" ? EAN_L_ODD[digits[i + 1]] : EAN_L_EVEN[digits[i + 1]]
    for (const ch of pattern) modules.push(ch === "1")
  }

  // Center guard: 01010
  const centerIdx = modules.length
  modules.push(false, true, false, true, false)
  for (let i = centerIdx; i < modules.length; i++) guardIndices.add(i)

  // Right 6 digits
  for (let i = 0; i < 6; i++) {
    const pattern = EAN_R[digits[i + 7]]
    for (const ch of pattern) modules.push(ch === "1")
  }

  // End guard: 101
  const endIdx = modules.length
  modules.push(true, false, true)
  for (let i = endIdx; i < modules.length; i++) guardIndices.add(i)

  return { modules, guardIndices }
}

export interface Ean13RenderOptions {
  barWidth?: number
  barHeight?: number
  guardExtra?: number
  margin?: number
  fontSize?: number
  skuLabel?: string | null
}

export function buildEan13SvgMarkup(
  text: string,
  options?: Ean13RenderOptions
): string | null {
  const sanitized = text.trim()
  if (!isValidEan13Input(sanitized)) return null

  const digits = sanitized.split("").map(Number)
  const { modules, guardIndices } = encodeEan13Modules(digits)

  const barWidth = options?.barWidth ?? 2
  const barHeight = options?.barHeight ?? 80
  const guardExtra = options?.guardExtra ?? 8
  const margin = options?.margin ?? 12
  const fontSize = options?.fontSize ?? 13
  const skuLabel = options?.skuLabel ?? null
  const skuFontSize = 11
  const skuHeight = skuLabel ? skuFontSize + 8 : 0
  const textGap = 4

  const barcodeWidth = modules.length * barWidth
  const firstDigitWidth = fontSize * 0.75
  const totalWidth = firstDigitWidth + barcodeWidth + margin * 2
  const barcodeX = firstDigitWidth + margin
  const barsY = margin + skuHeight

  const textY = barsY + barHeight + guardExtra + textGap
  const totalHeight = textY + fontSize + margin

  // SKU label centered above the bars
  const skuElement = skuLabel
    ? `<text x="${totalWidth / 2}" y="${margin + skuFontSize}" fill="#666" font-family="sans-serif" font-size="${skuFontSize}" font-weight="600" text-anchor="middle" dominant-baseline="auto">${escapeSvgText(skuLabel)}</text>`
    : ""

  const bars = modules
    .map((isBar, index) => {
      if (!isBar) return ""
      const x = barcodeX + index * barWidth
      const h = guardIndices.has(index) ? barHeight + guardExtra : barHeight
      return `<rect x="${x}" y="${barsY}" width="${barWidth}" height="${h}" fill="#000"/>`
    })
    .join("")

  // Text layout: first digit left of bars, left group under left half, right group under right half
  const firstDigit = sanitized[0]
  const leftGroup = sanitized.slice(1, 7)
  const rightGroup = sanitized.slice(7, 13)

  const firstDigitX = margin + firstDigitWidth * 0.4
  const leftTextX = barcodeX + 3 * barWidth + (42 * barWidth) / 2
  const rightTextX = barcodeX + (3 + 42 + 5) * barWidth + (42 * barWidth) / 2

  const textElements = [
    `<text x="${firstDigitX}" y="${textY}" fill="#000" font-family="monospace" font-size="${fontSize}" text-anchor="middle" dominant-baseline="hanging">${firstDigit}</text>`,
    `<text x="${leftTextX}" y="${textY}" fill="#000" font-family="monospace" font-size="${fontSize}" text-anchor="middle" dominant-baseline="hanging">${leftGroup}</text>`,
    `<text x="${rightTextX}" y="${textY}" fill="#000" font-family="monospace" font-size="${fontSize}" text-anchor="middle" dominant-baseline="hanging">${rightGroup}</text>`,
  ].join("")

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="Codigo de barras ${escapeSvgText(sanitized)}">`,
    `<rect width="${totalWidth}" height="${totalHeight}" fill="#fff"/>`,
    skuElement,
    bars,
    textElements,
    "</svg>",
  ].join("")
}

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options?: BarcodeRenderOptions
): boolean {
  const model = buildBarcodeModel(text, options)
  if (!model) return false

  canvas.width = model.totalWidth
  canvas.height = model.totalHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) return false

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, model.totalWidth, model.totalHeight)

  ctx.fillStyle = "#000000"
  for (let i = 0; i < model.modules.length; i++) {
    if (model.modules[i]) {
      ctx.fillRect(
        model.margin + i * model.barWidth,
        model.margin,
        model.barWidth,
        model.height
      )
    }
  }

  ctx.fillStyle = "#000000"
  ctx.font = `${model.fontSize}px monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText(model.text, model.totalWidth / 2, model.textY)

  return true
}
