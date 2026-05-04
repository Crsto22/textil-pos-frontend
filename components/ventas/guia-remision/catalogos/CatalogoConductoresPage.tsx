"use client"

import type { Dispatch, SetStateAction } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  GuiaCatalogoCrudPage,
  type GuiaCatalogoColumn,
} from "@/components/ventas/guia-remision/catalogos/GuiaCatalogoCrudPage"
import { useGuiaCatalogoCrud } from "@/lib/hooks/useGuiaCatalogoCrud"
import type {
  CatalogoConductor,
  CatalogoConductorPayload,
} from "@/lib/types/guia-remision-catalogos"
import { normalizeCatalogoConductor } from "@/lib/types/guia-remision-catalogos"

const ENDPOINT = "/api/guia-remision/catalogos/conductores"

const COLUMNS: GuiaCatalogoColumn<CatalogoConductor>[] = [
  {
    key: "documento",
    header: "Documento",
    render: (item) => (
      <div>
        <p className="font-medium">{item.tipoDocumento === "1" ? "DNI" : item.tipoDocumento}</p>
        <p className="text-muted-foreground">{item.nroDocumento}</p>
      </div>
    ),
  },
  {
    key: "nombre",
    header: "Conductor",
    render: (item) => (
      <div>
        <p className="font-medium">
          {item.nombres} {item.apellidos}
        </p>
        <p className="text-muted-foreground">{item.licencia}</p>
      </div>
    ),
  },
  {
    key: "estado",
    header: "Estado",
    className: "whitespace-nowrap",
    render: (item) => item.estado ?? "ACTIVO",
  },
]

type ConductorForm = CatalogoConductorPayload

function createEmptyForm(): ConductorForm {
  return {
    tipoDocumento: "1",
    nroDocumento: "",
    nombres: "",
    apellidos: "",
    licencia: "",
  }
}

function setFormField(
  setForm: Dispatch<SetStateAction<ConductorForm>>,
  field: keyof ConductorForm,
  value: string
) {
  setForm((previous) => ({ ...previous, [field]: value }))
}

function renderConductorForm(
  form: ConductorForm,
  setForm: Dispatch<SetStateAction<ConductorForm>>,
  disabled: boolean
) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="catalogo-conductor-tipo-documento">Tipo de documento</Label>
          <select
            id="catalogo-conductor-tipo-documento"
            value={form.tipoDocumento}
            onChange={(event) => setFormField(setForm, "tipoDocumento", event.target.value)}
            disabled={disabled}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="1">DNI</option>
            <option value="6">RUC</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="catalogo-conductor-nro-documento">Numero de documento</Label>
          <Input
            id="catalogo-conductor-nro-documento"
            value={form.nroDocumento}
            onChange={(event) => setFormField(setForm, "nroDocumento", event.target.value)}
            disabled={disabled}
            placeholder="75132958"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="catalogo-conductor-nombres">Nombres</Label>
          <Input
            id="catalogo-conductor-nombres"
            value={form.nombres}
            onChange={(event) => setFormField(setForm, "nombres", event.target.value)}
            disabled={disabled}
            placeholder="Mario"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="catalogo-conductor-apellidos">Apellidos</Label>
          <Input
            id="catalogo-conductor-apellidos"
            value={form.apellidos}
            onChange={(event) => setFormField(setForm, "apellidos", event.target.value)}
            disabled={disabled}
            placeholder="Perez"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="catalogo-conductor-licencia">Licencia</Label>
        <Input
          id="catalogo-conductor-licencia"
          value={form.licencia}
          onChange={(event) => setFormField(setForm, "licencia", event.target.value)}
          disabled={disabled}
          placeholder="Q75132958"
        />
      </div>
    </>
  )
}

export function CatalogoConductoresPage() {
  const {
    items,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    search,
    setSearch,
    setDisplayedPage,
    refreshCurrentView,
    createItem,
    updateItem,
    deleteItem,
  } = useGuiaCatalogoCrud<CatalogoConductor, CatalogoConductorPayload>({
    endpoint: ENDPOINT,
    singularLabel: "conductor",
    pluralLabel: "conductores",
    normalizeItem: normalizeCatalogoConductor,
  })

  return (
    <GuiaCatalogoCrudPage<CatalogoConductor, ConductorForm, CatalogoConductorPayload>
      title="Catalogo de conductores"
      description="Administra los conductores reutilizables para GRE remitente."
      singularLabel="conductor"
      pluralLabel="conductores"
      searchPlaceholder="Buscar por nombre, documento o licencia"
      emptyMessage="No se encontraron conductores registrados."
      items={items}
      loading={loading}
      error={error}
      search={search}
      setSearch={setSearch}
      page={page}
      totalPages={totalPages}
      totalElements={totalElements}
      setDisplayedPage={setDisplayedPage}
      refreshCurrentView={refreshCurrentView}
      createItem={createItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
      columns={COLUMNS}
      getId={(item) => item.idCatalogoConductor}
      getItemTitle={(item) => `${item.nombres} ${item.apellidos}`.trim()}
      createEmptyForm={createEmptyForm}
      toForm={(item) => ({
        tipoDocumento: item.tipoDocumento || "1",
        nroDocumento: item.nroDocumento,
        nombres: item.nombres,
        apellidos: item.apellidos,
        licencia: item.licencia,
      })}
      buildPayload={(form) => ({
        tipoDocumento: form.tipoDocumento,
        nroDocumento: form.nroDocumento.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        licencia: form.licencia.trim(),
      })}
      isFormValid={(form) =>
        form.nroDocumento.trim().length > 0 &&
        form.nombres.trim().length > 0 &&
        form.licencia.trim().length > 0
      }
      renderForm={({ form, setForm, disabled }) =>
        renderConductorForm(form, setForm, disabled)
      }
    />
  )
}
