export interface MetodoPagoCuentaActiva {
  idMetodoPagoCuenta: number
  numeroCuenta: string
}

export interface MetodoPagoActivo {
  idMetodoPago: number
  nombre: string
  cuentas?: MetodoPagoCuentaActiva[]
}

export interface SucursalMetodoPagoConfig extends MetodoPagoActivo {
  activo: boolean
  requiereCodigoOperacion: boolean
  requiereFechaPago: boolean
  requiereHoraPago: boolean
}
