export function isDireccionObligatoriaParaCliente(
    tipoDocumento: string,
    nroDocumento: string
) {
    return tipoDocumento === "RUC" && !nroDocumento.trim().startsWith("10")
}
