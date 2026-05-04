"use client"

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { useIsMobile } from "@/lib/hooks/useIsMobile"

export interface GuiaCatalogoColumn<TItem> {
  key: string
  header: string
  className?: string
  render: (item: TItem) => ReactNode
}

interface GuiaCatalogoCrudPageProps<TItem, TForm, TPayload> {
  title: string
  description: string
  singularLabel: string
  pluralLabel: string
  searchPlaceholder: string
  emptyMessage: string
  items: TItem[]
  loading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
  page: number
  totalPages: number
  totalElements: number
  setDisplayedPage: Dispatch<SetStateAction<number>>
  refreshCurrentView: () => Promise<void>
  createItem: (payload: TPayload) => Promise<boolean>
  updateItem: (id: number, payload: TPayload) => Promise<boolean>
  deleteItem: (id: number) => Promise<boolean>
  columns: GuiaCatalogoColumn<TItem>[]
  getId: (item: TItem) => number
  getItemTitle: (item: TItem) => string
  createEmptyForm: () => TForm
  toForm: (item: TItem) => TForm
  buildPayload: (form: TForm) => TPayload
  isFormValid: (form: TForm) => boolean
  renderForm: (args: {
    form: TForm
    setForm: Dispatch<SetStateAction<TForm>>
    disabled: boolean
    mode: "create" | "edit"
  }) => ReactNode
}

export function GuiaCatalogoCrudPage<TItem, TForm, TPayload>({
  title,
  description,
  singularLabel,
  pluralLabel,
  searchPlaceholder,
  emptyMessage,
  items,
  loading,
  error,
  search,
  setSearch,
  page,
  totalPages,
  totalElements,
  setDisplayedPage,
  refreshCurrentView,
  createItem,
  updateItem,
  deleteItem,
  columns,
  getId,
  getItemTitle,
  createEmptyForm,
  toForm,
  buildPayload,
  isFormValid,
  renderForm,
}: GuiaCatalogoCrudPageProps<TItem, TForm, TPayload>) {
  const isMobile = useIsMobile()

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<TForm>(createEmptyForm)
  const [createSaving, setCreateSaving] = useState(false)

  const [editTarget, setEditTarget] = useState<TItem | null>(null)
  const [editForm, setEditForm] = useState<TForm>(createEmptyForm)
  const [editSaving, setEditSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<TItem | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)

  useEffect(() => {
    if (!showCreate) return
    setCreateForm(createEmptyForm())
  }, [createEmptyForm, showCreate])

  useEffect(() => {
    if (!editTarget) return
    setEditForm(toForm(editTarget))
  }, [editTarget, toForm])

  const handleCreate = async () => {
    if (!isFormValid(createForm)) return
    setCreateSaving(true)
    try {
      const success = await createItem(buildPayload(createForm))
      if (success) setShowCreate(false)
    } finally {
      setCreateSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget || !isFormValid(editForm)) return
    setEditSaving(true)
    try {
      const success = await updateItem(getId(editTarget), buildPayload(editForm))
      if (success) setEditTarget(null)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteSaving(true)
    try {
      const success = await deleteItem(getId(deleteTarget))
      if (success) setDeleteTarget(null)
    } finally {
      setDeleteSaving(false)
    }
  }

  // ─── Shared form body content ───────────────────────────────────────────────

  const createFormBody = (
    <div className="grid gap-4 py-2">
      {renderForm({ form: createForm, setForm: setCreateForm, disabled: createSaving, mode: "create" })}
    </div>
  )

  const editFormBody = (
    <div className="grid gap-4 py-2">
      {renderForm({ form: editForm, setForm: setEditForm, disabled: editSaving, mode: "edit" })}
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ─── Header: title + search + new button ─── */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <Button type="button" onClick={() => setShowCreate(true)} className="h-10 shrink-0">
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo {singularLabel}</span>
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
          {error}
          <button type="button" onClick={() => { void refreshCurrentView() }} className="ml-2 underline hover:no-underline">
            Reintentar
          </button>
        </div>
      )}

      {/* ─── MOBILE: cards ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:hidden">
          <LoaderSpinner text={`Cargando ${pluralLabel}...`} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground sm:hidden">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:hidden">
          {items.map((item) => (
            <div key={getId(item)} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="space-y-2.5">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      {col.header}
                    </span>
                    <div className="min-w-0 flex-1 text-xs leading-snug [&_p]:text-xs [&_span]:text-xs">{col.render(item)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setEditTarget(item)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50/50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:border-red-900/60 dark:bg-red-900/10 dark:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── DESKTOP: table ─── */}
      <section className="hidden rounded-2xl border bg-card shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                {columns.map((column) => (
                  <th key={column.key} className={`px-4 py-3 ${column.className ?? ""}`}>
                    {column.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                    <LoaderSpinner text={`Cargando ${pluralLabel}...`} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={getId(item)} className="border-b last:border-b-0">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 align-top ${column.className ?? ""}`}>
                        {column.render(item)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => setEditTarget(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PaginationResponsive
        totalElements={totalElements}
        totalPages={totalPages}
        page={page}
        onPageChange={setDisplayedPage}
        itemLabel={pluralLabel}
      />

      {/* ════════════════════════════════════════════════════════
          CREATE — Sheet (mobile) / Dialog (desktop)
      ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <Sheet open={showCreate} onOpenChange={(open) => !createSaving && setShowCreate(open)}>
          <SheetContent side="bottom" className="flex h-[85dvh] flex-col gap-0 p-0">
            <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
              <SheetTitle className="text-sm">Nuevo {singularLabel}</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              {createFormBody}
            </div>
            <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={createSaving} onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" onClick={handleCreate} disabled={!isFormValid(createForm) || createSaving}>
                  {createSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showCreate} onOpenChange={(open) => !createSaving && setShowCreate(open)}>
          <DialogContent className="sm:max-w-[640px]" showCloseButton={!createSaving}>
            <DialogHeader>
              <DialogTitle>Nuevo {singularLabel}</DialogTitle>
              <DialogDescription>Completa los datos para registrar un nuevo {singularLabel}.</DialogDescription>
            </DialogHeader>
            {createFormBody}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={createSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="button" onClick={handleCreate} disabled={!isFormValid(createForm) || createSaving}>
                {createSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ════════════════════════════════════════════════════════
          EDIT — Sheet (mobile) / Dialog (desktop)
      ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <Sheet open={editTarget !== null} onOpenChange={(open) => !editSaving && !open && setEditTarget(null)}>
          <SheetContent side="bottom" className="flex h-[85dvh] flex-col gap-0 p-0">
            <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
              <SheetTitle className="text-sm">
                Editar {editTarget ? getItemTitle(editTarget) : singularLabel}
              </SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              {editFormBody}
            </div>
            <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={editSaving} onClick={() => setEditTarget(null)}>
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" onClick={handleUpdate} disabled={!isFormValid(editForm) || editSaving}>
                  {editSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={editTarget !== null} onOpenChange={(open) => !editSaving && !open && setEditTarget(null)}>
          <DialogContent className="sm:max-w-[640px]" showCloseButton={!editSaving}>
            <DialogHeader>
              <DialogTitle>Editar {singularLabel}</DialogTitle>
              <DialogDescription>
                Actualiza los datos de {editTarget ? getItemTitle(editTarget) : singularLabel}.
              </DialogDescription>
            </DialogHeader>
            {editFormBody}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={editSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="button" onClick={handleUpdate} disabled={!isFormValid(editForm) || editSaving}>
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ════════════════════════════════════════════════════════
          DELETE — Sheet (mobile) / Dialog (desktop)
      ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <Sheet open={deleteTarget !== null} onOpenChange={(open) => !deleteSaving && !open && setDeleteTarget(null)}>
          <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
            <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
              <SheetTitle className="text-sm">Eliminar {singularLabel}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-2 pt-4 text-sm text-muted-foreground">
              {deleteTarget
                ? `Se eliminara ${getItemTitle(deleteTarget)} del catalogo. Esta accion no se puede deshacer.`
                : `Confirma la eliminacion del ${singularLabel}.`}
            </div>
            <div className="shrink-0 p-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={deleteSaving} onClick={() => setDeleteTarget(null)}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleteSaving}>
                  {deleteSaving ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={deleteTarget !== null} onOpenChange={(open) => !deleteSaving && !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-[480px]" showCloseButton={!deleteSaving}>
            <DialogHeader>
              <DialogTitle>Eliminar {singularLabel}</DialogTitle>
              <DialogDescription>
                {deleteTarget
                  ? `Se eliminara ${getItemTitle(deleteTarget)} del catalogo.`
                  : `Confirma la eliminacion del ${singularLabel}.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteSaving}>
                {deleteSaving ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
