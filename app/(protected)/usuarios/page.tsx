"use client"

import { useCallback, useState } from "react"

import { UsuarioDetailPanel } from "@/components/usuarios/UsuarioDetailPanel"
import { UsuariosFilters } from "@/components/usuarios/UsuariosFilters"
import { UsuarioMobileDetailDialog } from "@/components/usuarios/UsuarioMobileDetailDialog"
import { UsuariosHeader } from "@/components/usuarios/UsuariosHeader"
import { UsuariosPagination } from "@/components/usuarios/UsuariosPagination"
import { UsuariosSearch } from "@/components/usuarios/UsuariosSearch"
import { UsuariosTable } from "@/components/usuarios/UsuariosTable"
import { UsuarioResetPasswordDialog } from "@/components/usuarios/modals/UsuarioResetPasswordDialog"
import { UsuarioCreateDialog } from "@/components/usuarios/modals/UsuarioCreateDialog"
import { UsuarioDeleteDialog } from "@/components/usuarios/modals/UsuarioDeleteDialog"
import { UsuarioEditDialog } from "@/components/usuarios/modals/UsuarioEditDialog"
import { useUsuarios } from "@/lib/hooks/useUsuarios"
import type {
    Usuario,
    UsuarioCreateRequest,
    UsuarioResetPasswordRequest,
    UsuarioUpdateRequest,
} from "@/lib/types/usuario"

export default function UsuariosPage() {
    const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
    const [mobileDetail, setMobileDetail] = useState(false)

    const [showCreate, setShowCreate] = useState(false)
    const [editTarget, setEditTarget] = useState<Usuario | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
    const [resetPasswordTarget, setResetPasswordTarget] = useState<Usuario | null>(null)

    const {
        search,
        setSearch,
        roleFilter,
        setRoleFilter,
        branchFilter,
        setBranchFilter,
        isSearchMode,
        displayedUsers,
        displayedLoading,
        displayedTotalElements,
        displayedTotalPages,
        displayedPage,
        setDisplayedPage,
        createUsuario,
        updateUsuario,
        deleteUsuario,
        resetUsuarioPassword,
        isResettingPassword,
    } = useUsuarios()

    const handleSelectUser = useCallback(
        (usuario: Usuario) => {
            const isAlreadySelected = selectedUser?.idUsuario === usuario.idUsuario

            if (isAlreadySelected) {
                setSelectedUser(null)
                return
            }

            setSelectedUser(usuario)

            if (window.innerWidth < 1280) {
                setMobileDetail(true)
            }
        },
        [selectedUser?.idUsuario]
    )

    const handleMobileOpenChange = useCallback((open: boolean) => {
        setMobileDetail(open)
        if (!open) {
            setSelectedUser(null)
        }
    }, [])

    const handleCloseSelectedUser = useCallback(() => {
        setSelectedUser(null)
    }, [])

    const handleOpenCreate = useCallback(() => {
        setShowCreate(true)
    }, [])

    const handleEditUsuario = useCallback((usuario: Usuario) => {
        setEditTarget(usuario)
    }, [])

    const handleDeleteUsuario = useCallback((usuario: Usuario) => {
        setDeleteTarget(usuario)
    }, [])

    const handleResetPasswordUsuario = useCallback((usuario: Usuario) => {
        setResetPasswordTarget(usuario)
    }, [])

    const handleResetPasswordFromMobile = useCallback((usuario: Usuario) => {
        setMobileDetail(false)
        setResetPasswordTarget(usuario)
    }, [])

    const handleCreate = useCallback(
        async (payload: UsuarioCreateRequest) => createUsuario(payload),
        [createUsuario]
    )

    const handleUpdate = useCallback(
        async (id: number, payload: UsuarioUpdateRequest) => {
            const updatedUser = await updateUsuario(id, payload)

            if (updatedUser) {
                setSelectedUser((previous) =>
                    previous?.idUsuario === id ? updatedUser : previous
                )
                return true
            }

            return false
        },
        [updateUsuario]
    )

    const handleDelete = useCallback(
        async (id: number) => {
            const success = await deleteUsuario(id)

            if (success && selectedUser?.idUsuario === id) {
                setSelectedUser(null)
            }

            return success
        },
        [deleteUsuario, selectedUser?.idUsuario]
    )

    const handleResetPassword = useCallback(
        async (id: number, payload: UsuarioResetPasswordRequest) =>
            resetUsuarioPassword(id, payload),
        [resetUsuarioPassword]
    )

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-4 xl:gap-6">
                <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-col gap-3 sm:mb-6 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="w-full lg:max-w-md">
                                <UsuariosSearch search={search} onSearchChange={setSearch} />
                            </div>
                            <UsuariosFilters
                                roleFilter={roleFilter}
                                branchFilter={branchFilter}
                                onRoleFilterChange={setRoleFilter}
                                onBranchFilterChange={setBranchFilter}
                            />
                        </div>
                        <UsuariosHeader onOpenCreate={handleOpenCreate} />
                    </div>

                    <UsuariosTable
                        users={displayedUsers}
                        loading={displayedLoading}
                        isSearchMode={isSearchMode}
                        selectedUserId={selectedUser?.idUsuario ?? null}
                        onSelectUser={handleSelectUser}
                        onEditUser={handleEditUsuario}
                        onDeleteUser={handleDeleteUsuario}
                    />

                    <UsuariosPagination
                        totalElements={displayedTotalElements}
                        totalPages={displayedTotalPages}
                        page={displayedPage}
                        onPageChange={setDisplayedPage}
                    />
                </div>

                <UsuarioDetailPanel
                    selectedUser={selectedUser}
                    onClose={handleCloseSelectedUser}
                    onResetPassword={handleResetPasswordUsuario}
                />
            </div>

            <UsuarioCreateDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onCreate={handleCreate}
            />

            <UsuarioEditDialog
                open={editTarget !== null}
                user={editTarget}
                onOpenChange={(open) => {
                    if (!open) setEditTarget(null)
                }}
                onUpdate={handleUpdate}
            />

            <UsuarioDeleteDialog
                open={deleteTarget !== null}
                target={deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null)
                }}
                onDelete={handleDelete}
            />

            <UsuarioResetPasswordDialog
                open={resetPasswordTarget !== null}
                target={resetPasswordTarget}
                isSubmitting={isResettingPassword}
                onOpenChange={(open) => {
                    if (!open) setResetPasswordTarget(null)
                }}
                onSubmit={handleResetPassword}
            />

            <UsuarioMobileDetailDialog
                open={mobileDetail}
                selectedUser={selectedUser}
                onOpenChange={handleMobileOpenChange}
                onResetPassword={handleResetPasswordFromMobile}
            />
        </div>
    )
}
