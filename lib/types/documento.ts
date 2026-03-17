export interface DocumentoDniResponse {
    success?: boolean
    dni: string
    nombres: string
    apellidoPaterno: string
    apellidoMaterno: string
    codVerifica?: number | null
    codVerificaLetra?: string | null
}

export interface DocumentoRucResponse {
    ruc: string
    razonSocial: string
    nombreComercial?: string | null
    telefonos?: string[] | null
    tipo?: string | null
    estado?: string | null
    condicion?: string | null
    direccion?: string | null
    departamento?: string | null
    provincia?: string | null
    distrito?: string | null
    ubigeo?: string | null
    capital?: string | null
    correo?: string | null
    email?: string | null
}
