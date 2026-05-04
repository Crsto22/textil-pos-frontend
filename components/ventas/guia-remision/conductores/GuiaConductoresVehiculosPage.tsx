"use client"

import { BuildingOfficeIcon, TruckIcon, UserIcon } from "@heroicons/react/24/outline"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GuiaCatalogoCrudPage,
  type GuiaCatalogoColumn,
} from "@/components/ventas/guia-remision/catalogos/GuiaCatalogoCrudPage"
import {
  buildConductorCatalogPayload,
  buildTransportistaCatalogPayload,
  buildVehiculoCatalogPayload,
  ConductorCatalogFormFields,
  createEmptyConductorCatalogForm,
  createEmptyTransportistaCatalogForm,
  createEmptyVehiculoCatalogForm,
  isConductorCatalogFormValid,
  isTransportistaCatalogFormValid,
  isVehiculoCatalogFormValid,
  TransportistaCatalogFormFields,
  type ConductorCatalogForm,
  type TransportistaCatalogForm,
  type VehiculoCatalogForm,
  VehiculoCatalogFormFields,
} from "@/components/ventas/guia-remision/catalogos/GuiaCatalogoEntryForms"
import { useGuiaCatalogoCrud } from "@/lib/hooks/useGuiaCatalogoCrud"
import type {
  CatalogoConductor,
  CatalogoConductorPayload,
  CatalogoTransportista,
  CatalogoTransportistaPayload,
  CatalogoVehiculo,
  CatalogoVehiculoPayload,
} from "@/lib/types/guia-remision-catalogos"
import {
  normalizeCatalogoConductor,
  normalizeCatalogoTransportista,
  normalizeCatalogoVehiculo,
} from "@/lib/types/guia-remision-catalogos"

const CONDUCTOR_COLUMNS: GuiaCatalogoColumn<CatalogoConductor>[] = [
  {
    key: "documento",
    header: "Documento",
    render: (item) => (
      <div>
        <p className="font-medium">{item.tipoDocumento === "1" ? "DNI" : item.tipoDocumento}</p>
        <p className="text-xs text-muted-foreground">{item.nroDocumento}</p>
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
        <p className="text-xs text-muted-foreground">Lic. {item.licencia}</p>
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

const VEHICULO_COLUMNS: GuiaCatalogoColumn<CatalogoVehiculo>[] = [
  {
    key: "placa",
    header: "Placa",
    render: (item) => (
      <span className="font-mono font-semibold uppercase tracking-widest">{item.placa}</span>
    ),
  },
  {
    key: "estado",
    header: "Estado",
    className: "whitespace-nowrap",
    render: (item) => item.estado ?? "ACTIVO",
  },
]

const TRANSPORTISTA_COLUMNS: GuiaCatalogoColumn<CatalogoTransportista>[] = [
  {
    key: "documento",
    header: "RUC",
    render: (item) => <p className="font-medium">{item.transportistaNroDoc}</p>,
  },
  {
    key: "razonSocial",
    header: "Transportista",
    render: (item) => (
      <div>
        <p className="font-medium">{item.transportistaRazonSocial}</p>
        <p className="text-xs text-muted-foreground">
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

export function GuiaConductoresVehiculosPage() {
  const conductoresCrud = useGuiaCatalogoCrud<CatalogoConductor, CatalogoConductorPayload>({
    endpoint: "/api/guia-remision/catalogos/conductores",
    singularLabel: "conductor",
    pluralLabel: "conductores",
    normalizeItem: normalizeCatalogoConductor,
  })

  const vehiculosCrud = useGuiaCatalogoCrud<CatalogoVehiculo, CatalogoVehiculoPayload>({
    endpoint: "/api/guia-remision/catalogos/vehiculos",
    singularLabel: "placa",
    pluralLabel: "placas",
    normalizeItem: normalizeCatalogoVehiculo,
  })

  const transportistasCrud = useGuiaCatalogoCrud<CatalogoTransportista, CatalogoTransportistaPayload>({
    endpoint: "/api/guia-remision/catalogos/transportistas",
    singularLabel: "transportista",
    pluralLabel: "transportistas",
    normalizeItem: normalizeCatalogoTransportista,
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="conductores">
        <TabsList className="mb-2">
          <TabsTrigger value="conductores" className="gap-2">
            <UserIcon className="h-4 w-4" />
            Conductores
          </TabsTrigger>
          <TabsTrigger value="placas" className="gap-2">
            <TruckIcon className="h-4 w-4" />
            Placas
          </TabsTrigger>
          <TabsTrigger value="transportistas" className="gap-2">
            <BuildingOfficeIcon className="h-4 w-4" />
            Transportistas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conductores">
          <GuiaCatalogoCrudPage<CatalogoConductor, ConductorCatalogForm, CatalogoConductorPayload>
            title="Conductores"
            description="Administra los conductores disponibles para asignar a GRE remitente."
            singularLabel="conductor"
            pluralLabel="conductores"
            searchPlaceholder="Buscar por nombre, documento o licencia"
            emptyMessage="No hay conductores registrados."
            items={conductoresCrud.items}
            loading={conductoresCrud.loading}
            error={conductoresCrud.error}
            search={conductoresCrud.search}
            setSearch={conductoresCrud.setSearch}
            page={conductoresCrud.page}
            totalPages={conductoresCrud.totalPages}
            totalElements={conductoresCrud.totalElements}
            setDisplayedPage={conductoresCrud.setDisplayedPage}
            refreshCurrentView={conductoresCrud.refreshCurrentView}
            createItem={conductoresCrud.createItem}
            updateItem={conductoresCrud.updateItem}
            deleteItem={conductoresCrud.deleteItem}
            columns={CONDUCTOR_COLUMNS}
            getId={(item) => item.idCatalogoConductor}
            getItemTitle={(item) => `${item.nombres} ${item.apellidos}`.trim()}
            createEmptyForm={createEmptyConductorCatalogForm}
            toForm={(item) => ({
              tipoDocumento: item.tipoDocumento || "1",
              nroDocumento: item.nroDocumento,
              nombres: item.nombres,
              apellidos: item.apellidos,
              licencia: item.licencia,
            })}
            buildPayload={buildConductorCatalogPayload}
            isFormValid={isConductorCatalogFormValid}
            renderForm={({ form, setForm, disabled }) => (
              <ConductorCatalogFormFields form={form} setForm={setForm} disabled={disabled} />
            )}
          />
        </TabsContent>

        <TabsContent value="placas">
          <GuiaCatalogoCrudPage<CatalogoVehiculo, VehiculoCatalogForm, CatalogoVehiculoPayload>
            title="Placas"
            description="Administra los vehiculos disponibles para asignar a GRE remitente."
            singularLabel="placa"
            pluralLabel="placas"
            searchPlaceholder="Buscar por placa"
            emptyMessage="No hay placas registradas."
            items={vehiculosCrud.items}
            loading={vehiculosCrud.loading}
            error={vehiculosCrud.error}
            search={vehiculosCrud.search}
            setSearch={vehiculosCrud.setSearch}
            page={vehiculosCrud.page}
            totalPages={vehiculosCrud.totalPages}
            totalElements={vehiculosCrud.totalElements}
            setDisplayedPage={vehiculosCrud.setDisplayedPage}
            refreshCurrentView={vehiculosCrud.refreshCurrentView}
            createItem={vehiculosCrud.createItem}
            updateItem={vehiculosCrud.updateItem}
            deleteItem={vehiculosCrud.deleteItem}
            columns={VEHICULO_COLUMNS}
            getId={(item) => item.idCatalogoVehiculo}
            getItemTitle={(item) => item.placa}
            createEmptyForm={createEmptyVehiculoCatalogForm}
            toForm={(item) => ({
              placa: item.placa,
            })}
            buildPayload={buildVehiculoCatalogPayload}
            isFormValid={isVehiculoCatalogFormValid}
            renderForm={({ form, setForm, disabled }) => (
              <VehiculoCatalogFormFields form={form} setForm={setForm} disabled={disabled} />
            )}
          />
        </TabsContent>

        <TabsContent value="transportistas">
          <GuiaCatalogoCrudPage<CatalogoTransportista, TransportistaCatalogForm, CatalogoTransportistaPayload>
            title="Transportistas"
            description="Administra los transportistas disponibles para asignar a GRE remitente."
            singularLabel="transportista"
            pluralLabel="transportistas"
            searchPlaceholder="Buscar por razon social, RUC o registro MTC"
            emptyMessage="No hay transportistas registrados."
            items={transportistasCrud.items}
            loading={transportistasCrud.loading}
            error={transportistasCrud.error}
            search={transportistasCrud.search}
            setSearch={transportistasCrud.setSearch}
            page={transportistasCrud.page}
            totalPages={transportistasCrud.totalPages}
            totalElements={transportistasCrud.totalElements}
            setDisplayedPage={transportistasCrud.setDisplayedPage}
            refreshCurrentView={transportistasCrud.refreshCurrentView}
            createItem={transportistasCrud.createItem}
            updateItem={transportistasCrud.updateItem}
            deleteItem={transportistasCrud.deleteItem}
            columns={TRANSPORTISTA_COLUMNS}
            getId={(item) => item.idCatalogoTransportista}
            getItemTitle={(item) => item.transportistaRazonSocial}
            createEmptyForm={createEmptyTransportistaCatalogForm}
            toForm={(item) => ({
              transportistaNroDoc: item.transportistaNroDoc,
              transportistaRazonSocial: item.transportistaRazonSocial,
              transportistaRegistroMtc: item.transportistaRegistroMtc ?? "",
            })}
            buildPayload={buildTransportistaCatalogPayload}
            isFormValid={isTransportistaCatalogFormValid}
            renderForm={({ form, setForm, disabled }) => (
              <TransportistaCatalogFormFields form={form} setForm={setForm} disabled={disabled} />
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
