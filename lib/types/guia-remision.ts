import type { SunatEstado } from "@/lib/types/venta"

export type GuiaRemisionEstado =
  | "BORRADOR"
  | "EMITIDA"
  | "ACEPTADA"
  | "RECHAZADA"
  | "ANULADA"
  | (string & {})

export type ModalidadTransporte = "01" | "02"

export type MotivoTraslado =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "13"
  | "14"
  | "17"
  | (string & {})

export const GUIA_REMISION_MOTIVO_FIJO = "04" as const
export const GUIA_REMISION_MOTIVO_FIJO_LABEL =
  "Traslado entre establecimientos de la misma empresa"

export const MOTIVOS_TRASLADO_OPTIONS = [
  {
    codigo: "01",
    label: "Venta",
    shortLabel: "Venta",
  },
  {
    codigo: "02",
    label: "Compra",
    shortLabel: "Compra",
  },
  {
    codigo: "03",
    label: "Venta con entrega a terceros",
    shortLabel: "Entrega a terceros",
  },
  {
    codigo: "04",
    label: GUIA_REMISION_MOTIVO_FIJO_LABEL,
    shortLabel: "Traslado entre establecimientos",
  },
  {
    codigo: "05",
    label: "Consignacion",
    shortLabel: "Consignacion",
  },
  {
    codigo: "06",
    label: "Devolucion",
    shortLabel: "Devolucion",
  },
  {
    codigo: "07",
    label: "Recojo de bienes transformados",
    shortLabel: "Recojo transformados",
  },
  {
    codigo: "13",
    label: "Otros no comprendidos en ningun codigo del catalogo",
    shortLabel: "Otros",
  },
  {
    codigo: "14",
    label: "Venta sujeta a confirmacion del comprador",
    shortLabel: "Venta por confirmar",
  },
  {
    codigo: "17",
    label: "Traslado de bienes para transformacion",
    shortLabel: "Para transformacion",
  },
] as const

export interface GuiaRemisionDocumentoRelacionado {
  tipoDocumento: string
  serie: string
  numero: string
}

export interface GuiaRemisionListItem {
  idGuiaRemision: number
  numeroGuiaRemision: string
  serie: string
  correlativo: number
  fechaEmision: string | null
  fechaInicioTraslado: string
  motivoTraslado: MotivoTraslado
  descripcionMotivo?: string | null
  modalidadTransporte: ModalidadTransporte
  pesoBrutoTotal: number
  unidadPeso: string
  numeroBultos: number | null
  observaciones: string | null
  documentosRelacionados?: GuiaRemisionDocumentoRelacionado[]
  ubigeoPartida: string
  direccionPartida: string
  idSucursalPartida: number | null
  nombreSucursalPartida: string | null
  ubigeoLlegada: string
  direccionLlegada: string
  idSucursalLlegada: number | null
  nombreSucursalLlegada: string | null
  destinatarioNroDoc: string
  destinatarioTipoDoc?: string | null
  destinatarioRazonSocial: string
  estado: GuiaRemisionEstado
  sunatEstado: SunatEstado | null
  sunatCodigo: string | null
  sunatMensaje: string | null
  sunatCdrNombre?: string | null
  idUsuario: number | null
  nombreUsuario: string | null
  idSucursal: number | null
  nombreSucursal: string | null
}

export interface GuiaRemisionPageResponse {
  content: GuiaRemisionListItem[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface GuiaRemisionFilters {
  search: string
  estado: "TODOS" | GuiaRemisionEstado
  sunatEstado: "TODOS" | string
  idSucursal: number | null
}

export interface GuiaRemisionDetalle {
  idGuiaRemisionDetalle: number
  idProductoVariante: number
  descripcion: string
  cantidad: number
  unidadMedida: string
  codigoProducto: string | null
  pesoUnitario: number | null
}

export interface GuiaRemisionConductor {
  idGuiaRemisionConductor: number
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
  esPrincipal: boolean
}

export interface GuiaRemisionTransportista {
  idGuiaRemisionTransportista: number
  transportistaTipoDoc: string
  transportistaNroDoc: string
  transportistaRazonSocial: string
  transportistaRegistroMtc: string | null
}

export interface GuiaRemisionVehiculo {
  idGuiaRemisionVehiculo: number
  placa: string
  esPrincipal: boolean
}

export interface GuiaRemisionDetail {
  idGuiaRemision: number
  numeroGuiaRemision: string
  serie: string
  correlativo: number
  fechaEmision: string | null
  fechaInicioTraslado: string
  motivoTraslado: MotivoTraslado
  descripcionMotivo?: string | null
  modalidadTransporte: ModalidadTransporte
  pesoBrutoTotal: number
  unidadPeso: string
  numeroBultos: number | null
  observaciones: string | null
  documentosRelacionados?: GuiaRemisionDocumentoRelacionado[]
  ubigeoPartida: string
  direccionPartida: string
  idSucursalPartida: number | null
  nombreSucursalPartida: string | null
  ubigeoLlegada: string
  direccionLlegada: string
  idSucursalLlegada: number | null
  nombreSucursalLlegada: string | null
  destinatarioNroDoc: string
  destinatarioTipoDoc?: string | null
  destinatarioRazonSocial: string
  estado: GuiaRemisionEstado
  idUsuario: number | null
  nombreUsuario: string | null
  idSucursal: number | null
  nombreSucursal: string | null
  detalles: GuiaRemisionDetalle[]
  conductores: GuiaRemisionConductor[]
  transportistas: GuiaRemisionTransportista[]
  vehiculos: GuiaRemisionVehiculo[]
  sunatEstado: SunatEstado | null
  sunatCodigo: string | null
  sunatMensaje: string | null
  sunatHash: string | null
  sunatTicket: string | null
  sunatXmlNombre: string | null
  sunatZipNombre: string | null
  sunatCdrNombre: string | null
  sunatEnviadoAt: string | null
  sunatRespondidoAt: string | null
}

export const MOTIVO_TRASLADO_LABELS: Record<string, string> = {
  ...Object.fromEntries(MOTIVOS_TRASLADO_OPTIONS.map((item) => [item.codigo, item.label])),
}

export const MODALIDAD_TRANSPORTE_LABELS: Record<string, string> = {
  "01": "Transporte publico",
  "02": "Transporte privado",
}

export const ESTADO_OPTIONS: GuiaRemisionEstado[] = [
  "BORRADOR",
  "EMITIDA",
  "ACEPTADA",
  "RECHAZADA",
  "ANULADA",
]

export const SUNAT_ESTADO_OPTIONS: string[] = [
  "NO_APLICA",
  "PENDIENTE",
  "ACEPTADO",
  "OBSERVADO",
  "RECHAZADO",
  "ERROR",
]
