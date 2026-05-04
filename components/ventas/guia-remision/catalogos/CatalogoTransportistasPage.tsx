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
  CatalogoTransportista,
  CatalogoTransportistaPayload,
} from "@/lib/types/guia-remision-catalogos"
import { normalizeCatalogoTransportista } from "@/lib/types/guia-remision-catalogos"

const ENDPOINT = "/api/guia-remision/catalogos/transportistas"

const COLUMNS: GuiaCatalogoColumn<CatalogoTransportista>[] = [
  {
    key: "documento",
    header: "Documento",
    render: (item) => (
      <div>
        <p className="font-medium">
          {item.transportistaTipoDoc === "6" ? "RUC" : item.transportistaTipoDoc}
        </p>
        <p className="text-muted-foreground">{item.transportistaNroDoc}</p>
      </div>
    ),
  },
  {
    key: "razonSocial",
    header: "Transportista",
    render: (item) => (
      <div>
        <p className="font-medium">{item.transportistaRazonSocial}</p>
        <p className="text-muted-foreground">
          {item.transportistaRegistroMtc ?? "Sin registro MTC"}
        </p>
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

type TransportistaForm = {
  transportistaTipoDoc: string
  transportistaNroDoc: string
  transportistaRazonSocial: string
  transportistaRegistroMtc: string
}

function createEmptyForm(): TransportistaForm {
  return {
    transportistaTipoDoc: "6",
    transportistaNroDoc: "",
    transportistaRazonSocial: "",
    transportistaRegistroMtc: "",
  }
}

function setFormField(
  setForm: Dispatch<SetStateAction<TransportistaForm>>,
  field: keyof TransportistaForm,
  value: string
) {
  setForm((previous) => ({ ...previous, [field]: value }))
}

function renderTransportistaForm(
  form: TransportistaForm,
  setForm: Dispatch<SetStateAction<TransportistaForm>>,
  disabled: boolean
) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="catalogo-transportista-tipo-documento">Tipo de documento</Label>
          <select
            id="catalogo-transportista-tipo-documento"
            value={form.transportistaTipoDoc}
            onChange={(event) =>
              setFormField(setForm, "transportistaTipoDoc", event.target.value)
            }
            disabled={disabled}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="6">RUC</option>
            <option value="1">DNI</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="catalogo-transportista-nro-documento">Numero de documento</Label>
          <Input
            id="catalogo-transportista-nro-documento"
            value={form.transportistaNroDoc}
            onChange={(event) =>
              setFormField(setForm, "transportistaNroDoc", event.target.value)
            }
            disabled={disabled}
            placeholder="20552103816"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="catalogo-transportista-razon-social">Razon social</Label>
        <Input
          id="catalogo-transportista-razon-social"
          value={form.transportistaRazonSocial}
          onChange={(event) =>
            setFormField(setForm, "transportistaRazonSocial", event.target.value)
          }
          disabled={disabled}
          placeholder="AGROLIGHT PERU S.A.C."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="catalogo-transportista-registro-mtc">Registro MTC</Label>
        <Input
          id="catalogo-transportista-registro-mtc"
          value={form.transportistaRegistroMtc}
          onChange={(event) =>
            setFormField(setForm, "transportistaRegistroMtc", event.target.value)
          }
          disabled={disabled}
          placeholder="1234567"
        />
      </div>
    </>
  )
}

export function CatalogoTransportistasPage() {
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
  } = useGuiaCatalogoCrud<CatalogoTransportista, CatalogoTransportistaPayload>({
    endpoint: ENDPOINT,
    singularLabel: "transportista",
    pluralLabel: "transportistas",
    normalizeItem: normalizeCatalogoTransportista,
  })

  return (
    <GuiaCatalogoCrudPage<
      CatalogoTransportista,
      TransportistaForm,
      CatalogoTransportistaPayload
    >
      title="Catalogo de transportistas"
      description="Gestiona los transportistas reutilizables para GRE remitente con transporte publico."
      singularLabel="transportista"
      pluralLabel="transportistas"
      searchPlaceholder="Buscar por razon social, documento o registro MTC"
      emptyMessage="No se encontraron transportistas registrados."
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
      getId={(item) => item.idCatalogoTransportista}
      getItemTitle={(item) => item.transportistaRazonSocial}
      createEmptyForm={createEmptyForm}
      toForm={(item) => ({
        transportistaTipoDoc: item.transportistaTipoDoc || "6",
        transportistaNroDoc: item.transportistaNroDoc,
        transportistaRazonSocial: item.transportistaRazonSocial,
        transportistaRegistroMtc: item.transportistaRegistroMtc ?? "",
      })}
      buildPayload={(form) => ({
        transportistaTipoDoc: form.transportistaTipoDoc,
        transportistaNroDoc: form.transportistaNroDoc.trim(),
        transportistaRazonSocial: form.transportistaRazonSocial.trim(),
        transportistaRegistroMtc: form.transportistaRegistroMtc.trim() || null,
      })}
      isFormValid={(form) =>
        form.transportistaNroDoc.trim().length > 0 &&
        form.transportistaRazonSocial.trim().length > 0
      }
      renderForm={({ form, setForm, disabled }) =>
        renderTransportistaForm(form, setForm, disabled)
      }
    />
  )
}
