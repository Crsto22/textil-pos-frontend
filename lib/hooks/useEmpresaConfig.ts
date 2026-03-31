"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import { useCompany } from "@/lib/company/company-context"
import { normalizeEmpresa, normalizeEmpresaList } from "@/lib/empresa"
import type { Empresa, EmpresaUpdateRequest } from "@/lib/types/empresa"

export interface EmpresaFormErrors {
    nombre?: string
    nombreComercial?: string
    ruc?: string
    razonSocial?: string
    correo?: string
    telefono?: string
}

const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const isValidRuc = (value: string) => /^\d{11}$/.test(value.trim())
const isValidPhone = (value: string) => /^\d{7,15}$/.test(value.trim())

export { isValidEmail, isValidRuc, isValidPhone }

export function useEmpresaConfig() {
    const { isLoading: isAuthLoading } = useAuth()
    const { setCompany: setGlobalCompany } = useCompany()

    const [empresa, setEmpresa] = useState<Empresa | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [formErrors, setFormErrors] = useState<EmpresaFormErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)

    const abortRef = useRef<AbortController | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [nombre, setNombre] = useState("")
    const [nombreComercial, setNombreComercial] = useState("")
    const [ruc, setRuc] = useState("")
    const [razonSocial, setRazonSocial] = useState("")
    const [correo, setCorreo] = useState("")
    const [telefono, setTelefono] = useState("")
    const [generaFacturacionElectronica, setGeneraFacturacionElectronica] =
        useState(false)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const syncForm = useCallback((currentEmpresa: Empresa) => {
        setNombre(currentEmpresa.nombre)
        setNombreComercial(currentEmpresa.nombreComercial)
        setRuc(currentEmpresa.ruc)
        setRazonSocial(currentEmpresa.razonSocial)
        setCorreo(currentEmpresa.correo)
        setTelefono(currentEmpresa.telefono)
        setGeneraFacturacionElectronica(
            currentEmpresa.generaFacturacionElectronica
        )
        setLogoPreview(currentEmpresa.logoUrl ?? null)
    }, [])

    const hasChanges =
        empresa !== null &&
        (nombre !== empresa.nombre ||
            nombreComercial !== empresa.nombreComercial ||
            ruc !== empresa.ruc ||
            razonSocial !== empresa.razonSocial ||
            correo !== empresa.correo ||
            telefono !== empresa.telefono ||
            generaFacturacionElectronica !==
                empresa.generaFacturacionElectronica)

    const fetchEmpresa = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await authFetch("/api/empresa/listar", {
                    signal,
                })
                const data = await response.json().catch(() => null)
                if (signal?.aborted) return

                if (!response.ok) {
                    throw new Error(
                        data?.message ??
                            "Error al obtener datos de la empresa"
                    )
                }

                const currentEmpresa = normalizeEmpresaList(data)[0] ?? null
                setEmpresa(currentEmpresa)
                setGlobalCompany(currentEmpresa)
                if (currentEmpresa) {
                    syncForm(currentEmpresa)
                }
            } catch (requestError) {
                if (
                    requestError instanceof DOMException &&
                    requestError.name === "AbortError"
                ) {
                    return
                }

                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Error inesperado"
                )
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false)
                }
            }
        },
        [setGlobalCompany, syncForm]
    )

    useEffect(() => {
        if (isAuthLoading) return

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        void fetchEmpresa(controller.signal)

        return () => controller.abort()
    }, [fetchEmpresa, isAuthLoading])

    const validate = useCallback(() => {
        const errors: EmpresaFormErrors = {}

        if (!nombre.trim()) errors.nombre = "El nombre es requerido"
        if (!nombreComercial.trim()) {
            errors.nombreComercial = "El nombre comercial es requerido"
        }
        if (!ruc.trim()) errors.ruc = "El RUC es requerido"
        else if (!isValidRuc(ruc)) {
            errors.ruc = "El RUC debe tener exactamente 11 digitos"
        }
        if (!razonSocial.trim()) {
            errors.razonSocial = "La razon social es requerida"
        }
        if (!correo.trim()) errors.correo = "El correo es requerido"
        else if (!isValidEmail(correo)) {
            errors.correo = "Ingresa un correo valido"
        }
        if (!telefono.trim()) errors.telefono = "El telefono es requerido"
        else if (!isValidPhone(telefono)) {
            errors.telefono = "El telefono debe tener entre 7 y 15 digitos"
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }, [nombre, nombreComercial, ruc, razonSocial, correo, telefono])

    const resetForm = useCallback(() => {
        if (empresa) syncForm(empresa)
        setFormErrors({})
    }, [empresa, syncForm])

    const handleSave = useCallback(async () => {
        if (!empresa || !validate()) return

        setIsSaving(true)
        try {
            const payload: EmpresaUpdateRequest = {
                nombre: nombre.trim(),
                nombreComercial: nombreComercial.trim(),
                ruc: ruc.trim(),
                razonSocial: razonSocial.trim(),
                correo: correo.trim(),
                telefono: telefono.trim(),
                generaFacturacionElectronica,
            }

            const response = await authFetch(
                `/api/empresa/actualizar/${empresa.idEmpresa}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            )
            const data = await response.json().catch(() => null)

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    toast.error("No tienes permisos para actualizar")
                    return
                }

                toast.error(
                    data?.message ?? "Error al actualizar la empresa"
                )
                return
            }

            const normalizedResponse = normalizeEmpresa(data)
            const updatedEmpresa: Empresa = normalizedResponse
                ? {
                      ...normalizedResponse,
                      logoUrl:
                          normalizedResponse.logoUrl?.trim() ||
                          empresa.logoUrl?.trim() ||
                          undefined,
                  }
                : {
                      ...empresa,
                      ...payload,
                  }

            setEmpresa(updatedEmpresa)
            setGlobalCompany(updatedEmpresa)
            syncForm(updatedEmpresa)
            toast.success("Cambios guardados correctamente")
        } catch {
            toast.error("Error al actualizar la empresa")
        } finally {
            setIsSaving(false)
        }
    }, [
        empresa,
        validate,
        nombre,
        nombreComercial,
        ruc,
        razonSocial,
        correo,
        telefono,
        generaFacturacionElectronica,
        setGlobalCompany,
        syncForm,
    ])

    const handleUpload = useCallback(
        async (file: File) => {
            if (!empresa) return

            if (!file.type.startsWith("image/")) {
                toast.error("Solo se permiten imagenes PNG, JPG o WEBP")
                return
            }

            if (file.size > 2 * 1024 * 1024) {
                toast.error("El archivo no puede superar los 2 MB")
                return
            }

            const objectUrl = URL.createObjectURL(file)
            setLogoPreview(objectUrl)
            setIsUploadingLogo(true)

            try {
                const formData = new FormData()
                formData.append("file", file)

                const response = await authFetch(
                    `/api/empresa/logo/${empresa.idEmpresa}`,
                    {
                        method: "PUT",
                        body: formData,
                    }
                )
                const data = await response.json().catch(() => null)

                if (!response.ok) {
                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {
                        toast.error("No tienes permisos para subir el logo")
                    } else {
                        toast.error(
                            data?.message ?? "Error al subir el logo"
                        )
                    }
                    setLogoPreview(empresa.logoUrl ?? null)
                    return
                }

                const normalizedResponse = normalizeEmpresa(data)
                const updatedEmpresa =
                    normalizedResponse ??
                    ({
                        ...empresa,
                        logoUrl:
                            typeof data?.logoUrl === "string" &&
                            data.logoUrl.trim()
                                ? data.logoUrl.trim()
                                : empresa.logoUrl,
                    } as Empresa)

                setEmpresa(updatedEmpresa)
                setGlobalCompany(updatedEmpresa)
                setLogoPreview(updatedEmpresa.logoUrl ?? null)
                toast.success("Logo actualizado correctamente")
            } catch {
                toast.error("Error de conexion al subir el logo")
                setLogoPreview(empresa.logoUrl ?? null)
            } finally {
                setIsUploadingLogo(false)
                URL.revokeObjectURL(objectUrl)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
            }
        },
        [empresa, setGlobalCompany]
    )

    const clearFieldError = useCallback((field: keyof EmpresaFormErrors) => {
        setFormErrors((current) => ({ ...current, [field]: undefined }))
    }, [])

    return {
        empresa,
        isLoading,
        isAuthLoading,
        error,
        isSaving,
        isUploadingLogo,
        logoPreview,
        hasChanges,
        formErrors,
        fileInputRef,

        nombre,
        setNombre,
        nombreComercial,
        setNombreComercial,
        ruc,
        setRuc,
        razonSocial,
        setRazonSocial,
        correo,
        setCorreo,
        telefono,
        setTelefono,
        generaFacturacionElectronica,
        setGeneraFacturacionElectronica,

        fetchEmpresa,
        resetForm,
        handleSave,
        handleUpload,
        clearFieldError,
    }
}
