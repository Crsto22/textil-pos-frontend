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
  CatalogoVehiculo,
  CatalogoVehiculoPayload,
} from "@/lib/types/guia-remision-catalogos"
import { normalizeCatalogoVehiculo } from "@/lib/types/guia-remision-catalogos"

const ENDPOINT = "/api/guia-remision/catalogos/vehiculos"

const COLUMNS: GuiaCatalogoColumn<CatalogoVehiculo>[] = [
  {
    key: "placa",
    header: "Placa",
    render: (item) => <span className="font-medium uppercase">{item.placa}</span>,
  },
  {
    key: "estado",
    header: "Estado",
    className: "whitespace-nowrap",
    render: (item) => item.estado ?? "ACTIVO",
  },
]

type VehiculoForm = CatalogoVehiculoPayload

function createEmptyForm(): VehiculoForm {
  return {
    placa: "",
  }
}

function setFormField(
  setForm: Dispatch<SetStateAction<VehiculoForm>>,
  field: keyof VehiculoForm,
  value: string
) {
  setForm((previous) => ({ ...previous, [field]: value }))
}

function renderVehiculoForm(
  form: VehiculoForm,
  setForm: Dispatch<SetStateAction<VehiculoForm>>,
  disabled: boolean
) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="catalogo-vehiculo-placa">Placa</Label>
      <Input
        id="catalogo-vehiculo-placa"
        value={form.placa}
        onChange={(event) => setFormField(setForm, "placa", event.target.value.toUpperCase())}
        disabled={disabled}
        placeholder="ABC123"
        maxLength={10}
        className="uppercase"
      />
    </div>
  )
}

export function CatalogoVehiculosPage() {
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
  } = useGuiaCatalogoCrud<CatalogoVehiculo, CatalogoVehiculoPayload>({
    endpoint: ENDPOINT,
    singularLabel: "vehiculo",
    pluralLabel: "vehiculos",
    normalizeItem: normalizeCatalogoVehiculo,
  })

  return (
    <GuiaCatalogoCrudPage<CatalogoVehiculo, VehiculoForm, CatalogoVehiculoPayload>
      title="Catalogo de vehiculos"
      description="Administra las placas reutilizables para GRE remitente."
      singularLabel="vehiculo"
      pluralLabel="vehiculos"
      searchPlaceholder="Buscar por placa"
      emptyMessage="No se encontraron vehiculos registrados."
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
      getId={(item) => item.idCatalogoVehiculo}
      getItemTitle={(item) => item.placa}
      createEmptyForm={createEmptyForm}
      toForm={(item) => ({
        placa: item.placa,
      })}
      buildPayload={(form) => ({
        placa: form.placa.trim().toUpperCase(),
      })}
      isFormValid={(form) => form.placa.trim().length > 0}
      renderForm={({ form, setForm, disabled }) =>
        renderVehiculoForm(form, setForm, disabled)
      }
    />
  )
}
