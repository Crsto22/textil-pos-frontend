const SUNAT_COMPROBANTE_TYPES = new Set(["BOLETA", "FACTURA"])
const DEFAULT_CODIGO_TIPO_AFECTACION_IGV = "10"

export interface VentaTaxConfig {
  aplicaIgv: boolean
  igvPorcentaje: number | null
  codigoTipoAfectacionIgv: string | null
}

export function normalizeComprobanteTipo(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

export function appliesIgvForComprobante(tipoComprobante: unknown): boolean {
  return SUNAT_COMPROBANTE_TYPES.has(normalizeComprobanteTipo(tipoComprobante))
}

export function getVentaTaxConfig(
  tipoComprobante: unknown,
  defaultIgvPorcentaje: number
): VentaTaxConfig {
  if (!appliesIgvForComprobante(tipoComprobante)) {
    return {
      aplicaIgv: false,
      igvPorcentaje: null,
      codigoTipoAfectacionIgv: null,
    }
  }

  return {
    aplicaIgv: true,
    igvPorcentaje: Math.max(0, defaultIgvPorcentaje),
    codigoTipoAfectacionIgv: DEFAULT_CODIGO_TIPO_AFECTACION_IGV,
  }
}

export function calculateIncludedIgvAmount(
  totalAmount: number,
  igvPorcentaje: number
): number {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return 0
  if (!Number.isFinite(igvPorcentaje) || igvPorcentaje <= 0) return 0

  const igvAmount = totalAmount - totalAmount / (1 + igvPorcentaje / 100)
  return Number(igvAmount.toFixed(2))
}
