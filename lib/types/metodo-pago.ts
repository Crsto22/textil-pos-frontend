export interface MetodoPagoCuentaActiva {
  idMetodoPagoCuenta: number
  numeroCuenta: string
}

export interface MetodoPagoActivo {
  idMetodoPago: number
  nombre: string
  cuentas?: MetodoPagoCuentaActiva[]
}
