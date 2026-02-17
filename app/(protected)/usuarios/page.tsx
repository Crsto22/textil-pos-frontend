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

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<Usuario | null>(null)

  const [openDelete, setOpenDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)

  const [openResetPassword, setOpenResetPassword] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<Usuario | null>(
    null
  )

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

  const handleSelectUser = useCallback((usuario: Usuario) => {
    setSelectedUser((previous) => {
      const isAlreadySelected = previous?.idUsuario === usuario.idUsuario

      if (!isAlreadySelected && window.innerWidth < 1280) {
        setMobileDetail(true)
      }

      return isAlreadySelected ? null : usuario
    })
  }, [])

  const openEditModal = useCallback((usuario: Usuario) => {
    setEditTarget(usuario)
    setOpenEdit(true)
  }, [])

  const handleCreate = useCallback(
    async (payload: UsuarioCreateRequest) => createUsuario(payload),
    [createUsuario]
  )

  const handleUpdate = useCallback(
    async (id: number, payload: UsuarioUpdateRequest) => {
      const success = await updateUsuario(id, payload)

      if (success) {
        setSelectedUser((previous) =>
          previous?.idUsuario === id
            ? {
                ...previous,
                nombre: payload.nombre,
                apellido: payload.apellido,
                dni: payload.dni,
                telefono: payload.telefono,
                correo: payload.correo,
                rol: payload.rol,
                estado: payload.estado,
                idSucursal: payload.idSucursal,
              }
            : previous
        )
      }

      return success
    },
    [updateUsuario]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      const success = await deleteUsuario(id)

      if (success) {
        setSelectedUser((previous) =>
          previous?.idUsuario === id ? null : previous
        )
        setDeleteTarget(null)
      }

      return success
    },
    [deleteUsuario]
  )

  const handleResetPassword = useCallback(
    async (id: number, payload: UsuarioResetPasswordRequest) =>
      resetUsuarioPassword(id, payload),
    [resetUsuarioPassword]
  )

  const handleMobileOpenChange = useCallback((open: boolean) => {
    setMobileDetail(open)
    if (!open) {
      setSelectedUser(null)
    }
  }, [])

  const handleEditOpenChange = useCallback((open: boolean) => {
    setOpenEdit(open)
    if (!open) {
      setEditTarget(null)
    }
  }, [])

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    setOpenDelete(open)
    if (!open) {
      setDeleteTarget(null)
    }
  }, [])

  const handleResetPasswordOpenChange = useCallback((open: boolean) => {
    setOpenResetPassword(open)
    if (!open) {
      setResetPasswordTarget(null)
    }
  }, [])

  const handleRequestDelete = useCallback((usuario: Usuario) => {
    setDeleteTarget(usuario)
    setOpenDelete(true)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setOpenCreate(true)
  }, [])

  const handleCloseSelectedUser = useCallback(() => {
    setSelectedUser(null)
  }, [])

  const handleRequestResetPassword = useCallback((usuario: Usuario) => {
    setResetPasswordTarget(usuario)
    setOpenResetPassword(true)
  }, [])

  const handleRequestResetPasswordFromMobile = useCallback((usuario: Usuario) => {
    setMobileDetail(false)
    setResetPasswordTarget(usuario)
    setOpenResetPassword(true)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
            onEditUser={openEditModal}
            onDeleteUser={handleRequestDelete}
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
          onResetPassword={handleRequestResetPassword}
        />
      </div>

      <UsuarioMobileDetailDialog
        open={mobileDetail}
        selectedUser={selectedUser}
        onOpenChange={handleMobileOpenChange}
        onResetPassword={handleRequestResetPasswordFromMobile}
      />

      <UsuarioCreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={handleCreate}
      />

      <UsuarioEditDialog
        open={openEdit}
        user={editTarget}
        onOpenChange={handleEditOpenChange}
        onUpdate={handleUpdate}
      />

      <UsuarioDeleteDialog
        open={openDelete}
        target={deleteTarget}
        onOpenChange={handleDeleteOpenChange}
        onDelete={handleDelete}
      />

      <UsuarioResetPasswordDialog
        open={openResetPassword}
        target={resetPasswordTarget}
        isSubmitting={isResettingPassword}
        onOpenChange={handleResetPasswordOpenChange}
        onSubmit={handleResetPassword}
      />
    </div>
  )
}
