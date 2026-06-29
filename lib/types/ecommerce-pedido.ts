export interface EcommercePedidoDetalle {
  idProductoVariante: number | null
  nombreProducto: string | null
  colorNombre: string | null
  tallaNombre: string | null
  cantidad: number
  precioUnitario: number
  subtotal: number
  imagenUrl: string | null
}

export interface EcommercePedidoAdmin {
  idEcommercePedido: number
  codigo: string
  estado: string
  fecha: string
  reservaExpiraAt: string
  total: number
  metodoPago: string | null
  comprobanteUrl: string | null
  cliente: {
    dni: string
    nombres: string
    apellidos: string
    correo: string
    telefono: string
    deseaFactura: boolean
    ruc: string | null
  }
  envio: {
    tipo: string
    direccion: string | null
    referencia: string | null
    departamento: string | null
    provincia: string | null
    distrito: string | null
    tarifa: string | null
  }
  idSucursal: number | null
  nombreSucursal: string | null
  idVenta: number | null
  ventaNumero: string | null
  idUsuarioAceptacion: number | null
  usuarioAceptacionNombre: string | null
  aceptadoAt: string | null
  detalles: EcommercePedidoDetalle[]
}

export interface EcommercePedidoPageResponse {
  content: EcommercePedidoAdmin[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
  estadisticas: {
    completados: number
    vencidos: number
    enProgreso: number
    gananciasCompletadas: number
  }
}
