"use client"

import { useCallback, useState } from "react"

import { ClienteDetailPanel } from "@/components/clientes/ClienteDetailPanel"
import { ClienteMobileDetailDialog } from "@/components/clientes/ClienteMobileDetailDialog"
import { ClientesHeader } from "@/components/clientes/ClientesHeader"
import { ClientesPagination } from "@/components/clientes/ClientesPagination"
import { ClientesSearch } from "@/components/clientes/ClientesSearch"
import { ClientesTable } from "@/components/clientes/ClientesTable"
import { ClienteCreateDialog } from "@/components/clientes/modals/ClienteCreateDialog"
import { ClienteEditDialog } from "@/components/clientes/modals/ClienteEditDialog"
import { ClienteDeleteDialog } from "@/components/clientes/modals/ClienteDeleteDialog"
import { useClientes } from "@/lib/hooks/useClientes"
import type { Cliente } from "@/lib/types/cliente"

export default function ClientesPage() {
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [mobileDetail, setMobileDetail] = useState(false)

    const [showCreate, setShowCreate] = useState(false)
    const [editTarget, setEditTarget] = useState<Cliente | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)

    const {
        displayedClientes,
        displayedLoading,
        displayedTotalElements,
        displayedTotalPages,
        displayedPage,
        search,
        setSearch,
        setDisplayedPage,
        createCliente,
        updateCliente,
        deleteCliente,
    } = useClientes()

    const handleSelectCliente = useCallback((cliente: Cliente) => {
        setSelectedCliente((previous) => {
            const isAlreadySelected = previous?.idCliente === cliente.idCliente

            if (!isAlreadySelected && window.innerWidth < 1280) {
                setMobileDetail(true)
            }

            return isAlreadySelected ? null : cliente
        })
    }, [])

    const handleMobileOpenChange = useCallback((open: boolean) => {
        setMobileDetail(open)
        if (!open) {
            setSelectedCliente(null)
        }
    }, [])

    const handleCloseSelectedCliente = useCallback(() => {
        setSelectedCliente(null)
    }, [])

    const handleOpenCreate = useCallback(() => {
        setShowCreate(true)
    }, [])

    const handleEditCliente = useCallback((cliente: Cliente) => {
        setEditTarget(cliente)
    }, [])

    const handleDeleteCliente = useCallback((cliente: Cliente) => {
        setDeleteTarget(cliente)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex gap-6">
                <div className="min-w-0 flex-1">
                    <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="w-full lg:max-w-md">
                                <ClientesSearch search={search} onSearchChange={setSearch} />
                            </div>
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
                onUpdate={updateCliente}
            />

            <ClienteDeleteDialog
                open={deleteTarget !== null}
                target={deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null)
                }}
                onDelete={deleteCliente}
            />

            <ClienteMobileDetailDialog
                open={mobileDetail}
                selectedCliente={selectedCliente}
                onOpenChange={handleMobileOpenChange}
            />
        </div>
    )
}
