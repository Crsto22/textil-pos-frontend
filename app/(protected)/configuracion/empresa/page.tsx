"use client"

import { useCallback } from "react"
import { Building2, ShieldCheck } from "lucide-react"

import { EmpresaActionBar } from "@/components/configuracion/empresa/EmpresaActionBar"
import { EmpresaDatosFiscalesCard } from "@/components/configuracion/empresa/EmpresaDatosFiscalesCard"
import { EmpresaEmptyState } from "@/components/configuracion/empresa/EmpresaEmptyState"
import { EmpresaErrorAlert } from "@/components/configuracion/empresa/EmpresaErrorAlert"
import { EmpresaIdentidadCard } from "@/components/configuracion/empresa/EmpresaIdentidadCard"
import { EmpresaLogoCard } from "@/components/configuracion/empresa/EmpresaLogoCard"
import { EmpresaSkeleton } from "@/components/configuracion/empresa/EmpresaSkeleton"
import { EmpresaUbicacionFiscalCard } from "@/components/configuracion/empresa/EmpresaUbicacionFiscalCard"
import { SunatConnectionTab } from "@/components/configuracion/empresa/SunatConnectionTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmpresaConfig } from "@/lib/hooks/useEmpresaConfig"

export default function ConfigEmpresaPage() {
    const {
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
        direccion,
        setDireccion,
        ubigeo,
        departamento,
        provincia,
        distrito,
        codigoEstablecimientoSunat,
        setCodigoEstablecimientoSunat,
        generaFacturacionElectronica,
        setGeneraFacturacionElectronica,

        fetchEmpresa,
        resetForm,
        handleLocationChange,
        handleSave,
        handleUpload,
        clearFieldError,
    } = useEmpresaConfig()

    const handleFacturacionToggle = useCallback(() => {
        setGeneraFacturacionElectronica((current) => !current)
    }, [setGeneraFacturacionElectronica])

    const handleRetry = useCallback(() => {
        void fetchEmpresa()
    }, [fetchEmpresa])

    return (
        <div className="w-full max-w-[1600px] space-y-6 px-2 pt-2">
            <p className="text-sm text-muted-foreground">
                Gestiona la informacion oficial de tu empresa y la conexion
                SUNAT. Los cambios se reflejan en comprobantes, tickets y
                facturacion electronica.
            </p>

            <Tabs defaultValue="empresa" className="space-y-6">
                <TabsList className="w-full max-w-md">
                    <TabsTrigger value="empresa" className="flex-1 gap-1.5">
                        <Building2 className="h-4 w-4" />
                        Empresa
                    </TabsTrigger>
                    <TabsTrigger value="sunat" className="flex-1 gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        Conexion SUNAT
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="empresa" className="space-y-6">
                    {error && (
                        <EmpresaErrorAlert
                            message={error}
                            onRetry={handleRetry}
                        />
                    )}

                    {isLoading && <EmpresaSkeleton />}

                    {!isLoading && !error && empresa && (
                        <>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
                                <div className="space-y-6">
                                    <EmpresaLogoCard
                                        logoPreview={logoPreview}
                                        isUploading={isUploadingLogo}
                                        fileInputRef={fileInputRef}
                                        onUpload={handleUpload}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <EmpresaIdentidadCard
                                        nombre={nombre}
                                        nombreComercial={nombreComercial}
                                        razonSocial={razonSocial}
                                        generaFacturacionElectronica={
                                            generaFacturacionElectronica
                                        }
                                        fechaCreacion={empresa.fechaCreacion}
                                        formErrors={formErrors}
                                        onNombreChange={setNombre}
                                        onNombreComercialChange={
                                            setNombreComercial
                                        }
                                        onRazonSocialChange={setRazonSocial}
                                        onFacturacionToggle={
                                            handleFacturacionToggle
                                        }
                                        onClearError={clearFieldError}
                                    />

                                    <EmpresaDatosFiscalesCard
                                        ruc={ruc}
                                        correo={correo}
                                        telefono={telefono}
                                        formErrors={formErrors}
                                        onRucChange={setRuc}
                                        onCorreoChange={setCorreo}
                                        onTelefonoChange={setTelefono}
                                        onClearError={clearFieldError}
                                    />

                                    <EmpresaUbicacionFiscalCard
                                        enabled={!isLoading}
                                        direccion={direccion}
                                        codigoEstablecimientoSunat={
                                            codigoEstablecimientoSunat
                                        }
                                        locationFields={{
                                            ubigeo,
                                            departamento,
                                            provincia,
                                            distrito,
                                        }}
                                        formErrors={formErrors}
                                        onDireccionChange={setDireccion}
                                        onCodigoEstablecimientoSunatChange={
                                            setCodigoEstablecimientoSunat
                                        }
                                        onLocationChange={handleLocationChange}
                                        onClearError={clearFieldError}
                                    />
                                </div>
                            </div>

                            <EmpresaActionBar
                                hasChanges={hasChanges}
                                isSaving={isSaving}
                                onSave={handleSave}
                                onReset={resetForm}
                            />
                        </>
                    )}

                    {!isLoading && !error && !empresa && (
                        <EmpresaEmptyState onRetry={handleRetry} />
                    )}
                </TabsContent>

                <TabsContent value="sunat" className="space-y-6">
                    <SunatConnectionTab enabled={!isAuthLoading} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
