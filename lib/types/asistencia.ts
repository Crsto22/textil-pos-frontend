export type EstadoRegistro = "ACTIVO" | "INACTIVO"

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  first: boolean
  last: boolean
}

export interface Trabajador {
  idTrabajador: number
  codigoZkteco: string
  dni: string
  nombres: string
  apellidos: string
  estado: EstadoRegistro
  idSucursal: number | null
  sucursal: string | null
  idTurno: number | null
  turno: string | null
  idCargo: number | null
  cargo: string | null
  cargoEstado: EstadoRegistro | null
  rotativo: boolean
  idUsuario: number | null
  usuarioNombre: string | null
  usuarioCorreo: string | null
  usuarioRol: string | null
  usuarioEstado: EstadoRegistro | null
  fechaCreacion: string
}

export interface TrabajadorRequest {
  codigoZkteco: string
  dni: string
  nombres: string
  apellidos: string
  idSucursal: number | null
  idTurno: number | null
  idCargo: number | null
  rotativo: boolean
  estado?: EstadoRegistro
  idUsuario: number | null
}

export interface CargoTrabajador {
  idCargo: number
  nombre: string
  estado: EstadoRegistro
  fechaCreacion: string
}

export interface CargoRequest {
  nombre: string
}

export interface DispositivoAsistencia {
  idDispositivo: number
  numeroSerie: string
  nombre: string
  estado: EstadoRegistro
  idSucursal: number
  sucursal: string
  ultimaConexion: string | null
  fechaCreacion: string
}

export interface DispositivoRequest {
  numeroSerie: string
  nombre: string
  idSucursal: number
  estado?: EstadoRegistro
}

export interface MarcacionAsistencia {
  idMarcacion: number
  idDispositivo: number | null
  dispositivo: string
  idSucursal: number
  sucursal: string
  idTrabajador: number | null
  trabajador: string | null
  codigoZkteco: string
  fechaHora: string
  tipoMarcacion: string | null
  tipoVerificacion: string | null
  recibidoAt: string
  origen: "BIOMETRICO" | "MANUAL"
  tipoEvento: "ENTRADA" | "SALIDA" | null
  estadoCalculo: "VALIDA" | "DUPLICADA" | "ANULADA" | "REQUIERE_REVISION"
  motivoRegistro: string | null
  usuarioRegistro: string | null
  anuladaAt: string | null
  motivoAnulacion: string | null
  usuarioAnula: string | null
}

export interface ResumenAsistencia {
  idTrabajador: number
  codigoZkteco: string
  trabajador: string
  idSucursal: number | null
  sucursal: string | null
  idTurno: number | null
  turno: string | null
  fecha: string
  horaProgramadaEntrada: string | null
  horaProgramadaSalida: string | null
  primeraMarcacion: string | null
  ultimaMarcacion: string | null
  estado: string
  minutosTardanza: number
  minutosTrabajados: number
  segundosTrabajados: number
  cantidadMarcaciones: number
  salidaAnticipada: boolean
  minutosSalidaAnticipada: number
  rotativo: boolean
  sucursalesMarcacion: SucursalMarcacionAsistencia[]
  sesiones: SesionAsistencia[]
}

export interface SucursalMarcacionAsistencia {
  idSucursal: number
  sucursal: string
}

export interface SesionAsistencia {
  idSucursal: number
  sucursal: string
  entrada: string
  salida: string | null
  dispositivoEntrada: string
  dispositivoSalida: string | null
  idSucursalSalida: number | null
  sucursalSalida: string | null
  minutosTrabajados: number
  segundosTrabajados: number
  completa: boolean
}

export interface ResumenSemanalAsistencia {
  idTrabajador: number
  codigoZkteco: string
  trabajador: string
  idSucursal: number | null
  sucursal: string | null
  idTurno: number | null
  turno: string | null
  rotativo: boolean
  dias: ResumenAsistencia[]
}

export interface AnalisisAsistencia {
  desde: string
  hasta: string
  indicadores: {
    trabajadoresEvaluados: number
    diasAsistidos: number
    faltas: number
    tardanzas: number
    salidasAnticipadas: number
    registrosIncompletos: number
    minutosTrabajados: number
    segundosTrabajados: number
    porcentajeAsistencia: number
  }
  distribucion: Array<{ estado: string; cantidad: number }>
  evolucion: Array<{
    fecha: string
    asistencias: number
    tardanzas: number
    faltas: number
    registrosIncompletos: number
  }>
  horasPorSucursal: Array<{ idSucursal: number; sucursal: string; minutosTrabajados: number; segundosTrabajados: number }>
  trabajadores: PageResponse<AnalisisTrabajador>
}

export interface AnalisisTrabajador {
  idTrabajador: number
  codigoZkteco: string
  trabajador: string
  sucursal: string | null
  faltas: number
  tardanzas: number
  salidasAnticipadas: number
  registrosIncompletos: number
  minutosTrabajados: number
  segundosTrabajados: number
  totalIncidencias: number
}
