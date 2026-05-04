"use client"

import { useCallback, useState } from "react"

import { ClienteDetailPanel } from "@/components/clientes/ClienteDetailPanel"
import { ClienteMobileDetailDialog } from "@/components/clientes/ClienteMobileDetailDialog"
import { ClientesFilters } from "@/components/clientes/ClientesFilters"
import { ClientesHeader } from "@/components/clientes/ClientesHeader"
import { ClientesPagination } from "@/components/clientes/ClientesPagination"
import { ClientesSearch } from "@/components/clientes/ClientesSearch"
import { ClientesTable } from "@/components/clientes/ClientesTable"
import { ClienteCreateDialog } from "@/components/clientes/modals/ClienteCreateDialog"
import { ClienteEditDialog } from "@/components/clientes/modals/ClienteEditDialog"
import { ClienteDeleteDialog } from "@/components/clientes/modals/ClienteDeleteDialog"
import { useClienteDetalle } from "@/lib/hooks/useClienteDetalle"
import { useClientes } from "@/lib/hooks/useClientes"
import type { Cliente, ClienteUpdateRequest } from "@/lib/types/cliente"

export default function ClientesPage() {
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [mobileDetail, setMobileDetail] = useState(false)

    const [showCreate, setShowCreate] = useState(false)
    const [editTarget, setEditTarget] = useState<Cliente | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)

    const {
        detalle,
        loading: loadingDetalle,
        error: errorDetalle,
        openClienteDetalle,
        retryClienteDetalle,
        closeClienteDetalle,
    } = useClienteDetalle()

    const {
        displayedClientes,
        displayedLoading,
        displayedTotalElements,
        displayedTotalPages,
        displayedPage,
        search,
        setSearch,
        tipoDocumentoFilter,
        setTipoDocumentoFilter,
        setDisplayedPage,
        createCliente,
        updateCliente: updateClienteRequest,
        deleteCliente: deleteClienteRequest,
    } = useClientes()

    const handleSelectCliente = useCallback(
        (cliente: Cliente) => {
            const isAlreadySelected = selectedCliente?.idCliente === cliente.idCliente

            if (isAlreadySelected) {
                setSelectedCliente(null)
                closeClienteDetalle()
                return
            }

            setSelectedCliente(cliente)
            void openClienteDetalle(cliente.idCliente)

            if (window.innerWidth < 1280) {
                setMobileDetail(true)
            }
        },
        [closeClienteDetalle, openClienteDetalle, selectedCliente?.idCliente]
    )

    const handleMobileOpenChange = useCallback(
        (open: boolean) => {
            setMobileDetail(open)
            if (!open) {
                setSelectedCliente(null)
                closeClienteDetalle()
            }
        },
        [closeClienteDetalle]
    )

    const handleCloseSelectedCliente = useCallback(() => {
        setSelectedCliente(null)
        closeClienteDetalle()
    }, [closeClienteDetalle])

    const handleOpenCreate = useCallback(() => {
        setShowCreate(true)
    }, [])

    const handleEditCliente = useCallback((cliente: Cliente) => {
        setEditTarget(cliente)
    }, [])

    const handleDeleteCliente = useCallback((cliente: Cliente) => {
        setDeleteTarget(cliente)
    }, [])

    const handleUpdateCliente = useCallback(
        async (id: number, payload: ClienteUpdateRequest) => {
            const success = await updateClienteRequest(id, payload)

            if (success) {
                setSelectedCliente((previous) =>
                    previous?.idCliente === id
                        ? {
                              ...previous,
                              ...payload,
                          }
                        : previous
                )

                if (selectedCliente?.idCliente === id) {
                    void openClienteDetalle(id)
                }
            }

            return success
        },
        [openClienteDetalle, selectedCliente?.idCliente, updateClienteRequest]
    )

    const handleDelete = useCallback(
        async (id: number) => {
            const success = await deleteClienteRequest(id)

            if (success && selectedCliente?.idCliente === id) {
                setSelectedCliente(null)
                closeClienteDetalle()
            }

            return success
        },
        [closeClienteDetalle, deleteClienteRequest, selectedCliente?.idCliente]
    )

    const selectedClienteDetalle =
        detalle?.idCliente === selectedCliente?.idCliente ? detalle : null

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-4 xl:gap-6">
                <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-col gap-3 sm:mb-6 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="w-full lg:max-w-md">
                                <ClientesSearch search={search} onSearchChange={setSearch} />
                            </div>
                            <ClientesFilters
                                tipoDocumentoFilter={tipoDocumentoFilter}
                                onTipoDocumentoFilterChange={setTipoDocumentoFilter}
                            />
                        </div>
                        <ClientesHeader onOpenCreate={handleOpenCreate} />
                    </div>

                    <ClientesTable
                        clientes={displayedClientes}
                        loading={displayedLoading}
                        selectedClienteId={selectedCliente?.idCliente ?? null}
                        onSelectCliente={handleSelectCliente}
                        onEditCliente={handleEditCliente}
                        onDeleteCliente={handleDeleteCliente}
                    />

                    <ClientesPagination
                        totalElements={displayedTotalElements}
                        totalPages={displayedTotalPages}
                        page={displayedPage}
                        onPageChange={setDisplayedPage}
                    />
                </div>

                <ClienteDetailPanel
                    selectedCliente={selectedCliente}
                    detalleCliente={selectedClienteDetalle}
                    loadingDetalle={loadingDetalle}
                    errorDetalle={errorDetalle}
                    onRetryDetalle={() => {
                        void retryClienteDetalle()
                    }}
                    onClose={handleCloseSelectedCliente}
                />
            </div>

            <ClienteCreateDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onCreate={createCliente}
            />

            <ClienteEditDialog
                open={editTarget !== null}
                cliente={editTarget}
                onOpenChange={(open) => {
                    if (!open) setEditTarget(null)
                }}
                onUpdate={handleUpdateCliente}
            />

            <ClienteDeleteDialog
                open={deleteTarget !== null}
                target={deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null)
                }}
                onDelete={handleDelete}
            />

            <ClienteMobileDetailDialog
                open={mobileDetail}
                selectedCliente={selectedCliente}
                detalleCliente={selectedClienteDetalle}
                loadingDetalle={loadingDetalle}
                errorDetalle={errorDetalle}
                onRetryDetalle={() => {
                    void retryClienteDetalle()
                }}
                onOpenChange={handleMobileOpenChange}
            />
        </div>
    )
}
