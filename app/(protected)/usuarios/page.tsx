"use client"

import { useCallback, useState } from "react"

import { UsuarioDetailPanel } from "@/components/usuarios/UsuarioDetailPanel"
import { UsuarioMobileDetailDialog } from "@/components/usuarios/UsuarioMobileDetailDialog"
import { UsuariosHeader } from "@/components/usuarios/UsuariosHeader"
import { UsuariosPagination } from "@/components/usuarios/UsuariosPagination"
import { UsuariosSearch } from "@/components/usuarios/UsuariosSearch"
import { UsuariosTable } from "@/components/usuarios/UsuariosTable"
import { UsuarioCreateDialog } from "@/components/usuarios/modals/UsuarioCreateDialog"
import { UsuarioDeleteDialog } from "@/components/usuarios/modals/UsuarioDeleteDialog"
import { UsuarioEditDialog } from "@/components/usuarios/modals/UsuarioEditDialog"
import { useUsuarios } from "@/lib/hooks/useUsuarios"
import type {
  Usuario,
  UsuarioCreateRequest,
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

  const {
    totalElements,
    activeCount,
    search,
    setSearch,
    debouncedSearch,
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

  const handleOpenEditFromSelected = useCallback(() => {
    if (!selectedUser) return
    openEditModal(selectedUser)
  }, [openEditModal, selectedUser])

  const handleMobileEdit = useCallback(
    (usuario: Usuario) => {
      openEditModal(usuario)
      setMobileDetail(false)
    },
    [openEditModal]
  )

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

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <UsuariosHeader
            isSearchMode={isSearchMode}
            displayedTotalElements={displayedTotalElements}
            debouncedSearch={debouncedSearch}
            totalElements={totalElements}
            activeCount={activeCount}
            selectedUser={selectedUser}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEditFromSelected}
          />

          <UsuariosSearch search={search} onSearchChange={setSearch} />

          <UsuariosTable
            users={displayedUsers}
            loading={displayedLoading}
            isSearchMode={isSearchMode}
            selectedUserId={selectedUser?.idUsuario ?? null}
            onSelectUser={handleSelectUser}
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
        />
      </div>

      <UsuarioMobileDetailDialog
        open={mobileDetail}
        selectedUser={selectedUser}
        onOpenChange={handleMobileOpenChange}
        onEditUser={handleMobileEdit}
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
    </div>
  )
}
