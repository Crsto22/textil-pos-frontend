"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import {
  EntitySmartSearch,
  type EntitySearchResult,
} from "@/components/ventas/guia-remision/guia-remision-common/EntitySmartSearch"
import {
  GuiaConductorCreateDialog,
  GuiaTransportistaCreateDialog,
  GuiaVehiculoCreateDialog,
} from "@/components/ventas/guia-remision/catalogos/GuiaCatalogoEntryForms"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useBarcodeScan } from "@/lib/hooks/useBarcodeScan"
import { useDocumentoLookup } from "@/lib/hooks/useDocumentoLookup"
import { useGlobalBarcodeScanner } from "@/lib/hooks/useGlobalBarcodeScanner"
import { useCanFilterBySucursal } from "@/lib/hooks/useCanFilterByUsuario"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import {
  arePeruUbigeoSelectionsEqual,
  findPeruUbigeoSelection,
  getEmptyPeruUbigeoSelection,
  loadPeruUbigeoCatalog,
  type PeruUbigeoDepartment,
  type PeruUbigeoLocationFields,
} from "@/lib/peru-ubigeo"
import { buildSucursalComboboxOption } from "@/lib/sucursal"
import {
  buildImagenesPorColorMap,
  parseVarianteResumenPageResponse,
} from "@/lib/variante-resumen"
import {
  MOTIVO_TRASLADO_LABELS,
  MOTIVOS_TRASLADO_OPTIONS,
  type GuiaRemisionDocumentoRelacionado,
  type ModalidadTransporte,
  type MotivoTraslado,
} from "@/lib/types/guia-remision"
import type {
  CatalogoConductor,
  CatalogoTransportista,
  CatalogoVehiculo,
} from "@/lib/types/guia-remision-catalogos"
import {
  normalizeCatalogoConductor,
  normalizeCatalogoTransportista,
  normalizeCatalogoVehiculo,
} from "@/lib/types/guia-remision-catalogos"
import type { VarianteEscanearResponse, VarianteResumenItem } from "@/lib/types/variante"
import type { DocumentoRucResponse } from "@/lib/types/documento"

const DEFAULT_SERIE = "T001"
const DEFAULT_UNIDAD_PESO = "KGM"
const DEFAULT_UNIDAD_MEDIDA = "NIU"

function getVariantImageUrl(item: Pick<VarianteResumenItem, "imagenPrincipal">): string | null {
  return item.imagenPrincipal?.url || item.imagenPrincipal?.urlThumb || null
}

function escanearToResumenItem(data: VarianteEscanearResponse): VarianteResumenItem {
  return {
    idProductoVariante: data.idProductoVariante,
    sku: data.sku,
    codigoBarras: data.codigoBarras,
    estado: data.estado,
    stock: data.stock,
    stocksSucursalesVenta: [],
    precio: data.precio,
    precioMayor: data.precioMayor,
    precioOferta: data.precioOferta,
    ofertaInicio: data.ofertaInicio,
    ofertaFin: data.ofertaFin,
    precioVigente: data.precioVigente,
    producto: {
      idProducto: data.producto.idProducto,
      nombre: data.producto.nombre,
      descripcion: data.producto.descripcion,
      estado: "ACTIVO",
      fechaCreacion: "",
      categoria: null,
      sucursal: null,
    },
    color: data.color ? { idColor: data.color.idColor, nombre: data.color.nombre, hex: data.color.hex ?? null } : null,
    talla: data.talla ? { idTalla: data.talla.idTalla, nombre: data.talla.nombre } : null,
    grupoImagen: null,
    imagenPrincipal: data.imagenPrincipal
      ? {
          idColorImagen: null,
          url: data.imagenPrincipal.url,
          urlThumb: data.imagenPrincipal.urlThumb,
          orden: 0,
          esPrincipal: true,
          estado: "ACTIVO",
        }
      : null,
    imagenes: [],
  }
}

type NuevaGuiaForm = {
  serie: string
  motivoTraslado: MotivoTraslado
  descripcionMotivo: string
  fechaInicioTraslado: string
  modalidadTransporte: ModalidadTransporte
  pesoBrutoTotal: string
  unidadPeso: string
  numeroBultos: string
  observaciones: string
  ubigeoPartida: string
  departamentoPartida: string
  provinciaPartida: string
  distritoPartida: string
  direccionPartida: string
  ubigeoLlegada: string
  departamentoLlegada: string
  provinciaLlegada: string
  distritoLlegada: string
  direccionLlegada: string
  idSucursalPartida: number | null
  idSucursalLlegada: number | null
  destinatarioTipoDoc: "6" | "1"
  destinatarioNroDoc: string
  destinatarioRazonSocial: string
  emitirDirectamente: boolean
}

type GuiaDetalleDraft = {
  variante: VarianteResumenItem
  cantidad: string
  unidadMedida: string
  descripcion: string
  pesoUnitario: string
}

type GuiaCreateResponse = {
  idGuiaRemision?: number
  message?: string
  data?: {
    idGuiaRemision?: number
  }
}

type PuntoTrasladoModo = "sucursal" | "externa"

type VentaAutocompleteSearch = {
  tipoDocumento: "01" | "03"
  serie: string
  numero: string
}

type GuiaDocumentoRelacionadoDraft = GuiaRemisionDocumentoRelacionado

type GuiaAutocompleteDetalle = {
  idProductoVariante: number
  descripcion: string
  cantidad: number
  unidadMedida?: string | null
  codigoProducto?: string | null
  pesoUnitario?: number | null
}

type GuiaAutocompleteSugerida = {
  motivoTraslado?: MotivoTraslado
  idSucursalPartida?: number | null
  idSucursalLlegada?: number | null
  ubigeoPartida?: string | null
  direccionPartida?: string | null
  ubigeoLlegada?: string | null
  direccionLlegada?: string | null
  destinatarioTipoDoc?: "6" | "1" | string | null
  destinatarioNroDoc?: string | null
  destinatarioRazonSocial?: string | null
  documentosRelacionados?: GuiaDocumentoRelacionadoDraft[]
  detalles?: GuiaAutocompleteDetalle[]
}

type GuiaAutocompleteVentaResponse = {
  message?: string
  guiaSugerida?: GuiaAutocompleteSugerida | null
}

type GuiaUbigeoFieldsProps = {
  enabled: boolean
  idPrefix: string
  value: PeruUbigeoLocationFields
  onChange: (next: PeruUbigeoLocationFields) => void
}

function parseJsonSafe<T>(response: Response) {
  return response.json().catch(() => null) as Promise<T | null>
}

function getTodayLocalDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function isValidUbigeo(value: string) {
  return /^\d{6}$/.test(value.trim())
}

function normalizePositiveNumberString(value: string) {
  return value.replace(",", ".")
}

function formatVariantAttributes(variant: VarianteResumenItem) {
  return [variant.color?.nombre, variant.talla?.nombre].filter(Boolean).join(" / ")
}

function formatVariantLabel(variant: VarianteResumenItem) {
  const attributes = formatVariantAttributes(variant)
  return attributes ? `${variant.producto.nombre} - ${attributes}` : variant.producto.nombre
}

function autocompleteDetalleToResumenItem(item: GuiaAutocompleteDetalle): VarianteResumenItem {
  return {
    idProductoVariante: item.idProductoVariante,
    sku: item.codigoProducto ?? null,
    codigoBarras: null,
    estado: "ACTIVO",
    stock: null,
    stocksSucursalesVenta: [],
    precio: null,
    precioMayor: null,
    precioOferta: null,
    ofertaInicio: null,
    ofertaFin: null,
    precioVigente: null,
    producto: {
      idProducto: 0,
      nombre: item.descripcion,
      descripcion: item.descripcion,
      estado: "ACTIVO",
      fechaCreacion: "",
      categoria: null,
      sucursal: null,
    },
    color: null,
    talla: null,
    grupoImagen: null,
    imagenPrincipal: null,
    imagenes: [],
  }
}

function withResolvedVariantImages(
  items: VarianteResumenItem[],
  imagenesPorColor: ReturnType<typeof buildImagenesPorColorMap>
): VarianteResumenItem[] {
  return items.map((item) => {
    const mappedImage = item.grupoImagen?.key
      ? imagenesPorColor.get(item.grupoImagen.key)
      : undefined
    const imagenPrincipal =
      mappedImage ??
      item.imagenPrincipal ??
      item.imagenes.find((image) => image.esPrincipal) ??
      item.imagenes[0] ??
      null

    return imagenPrincipal === item.imagenPrincipal ? item : { ...item, imagenPrincipal }
  })
}

function formatDocumentoRelacionado(documento: GuiaDocumentoRelacionadoDraft) {
  const label =
    documento.tipoDocumento === "01"
      ? "Factura"
      : documento.tipoDocumento === "03"
        ? "Boleta"
        : documento.tipoDocumento === "04"
          ? "Liquidacion de compra"
          : documento.tipoDocumento

  return `${label} ${documento.serie}-${documento.numero}`
}

function formatConductorLabel(item: CatalogoConductor) {
  return [item.nombres, item.apellidos].filter(Boolean).join(" ").trim() || item.nroDocumento
}

function parseConductorResult(value: unknown): EntitySearchResult<CatalogoConductor> | null {
  const item = normalizeCatalogoConductor(value)
  if (!item) return null

  return {
    id: item.idCatalogoConductor,
    label: formatConductorLabel(item),
    subtitle: `${item.nroDocumento} · Licencia ${item.licencia}`,
    data: item,
  }
}

function parseVehiculoResult(value: unknown): EntitySearchResult<CatalogoVehiculo> | null {
  const item = normalizeCatalogoVehiculo(value)
  if (!item) return null

  return {
    id: item.idCatalogoVehiculo,
    label: item.placa,
    subtitle: "Vehiculo de catalogo",
    data: item,
  }
}

function parseTransportistaResult(
  value: unknown
): EntitySearchResult<CatalogoTransportista> | null {
  const item = normalizeCatalogoTransportista(value)
  if (!item) return null

  const subtitleParts = [item.transportistaNroDoc]
  if (item.transportistaRegistroMtc) subtitleParts.push(`MTC ${item.transportistaRegistroMtc}`)

  return {
    id: item.idCatalogoTransportista,
    label: item.transportistaRazonSocial,
    subtitle: subtitleParts.join(" · "),
    data: item,
  }
}

function buildTransportValidationMessage(
  modalidad: ModalidadTransporte,
  conductores: EntitySearchResult<CatalogoConductor>[],
  vehiculos: EntitySearchResult<CatalogoVehiculo>[],
  transportistas: EntitySearchResult<CatalogoTransportista>[]
) {
  if (modalidad === "01") {
    return transportistas.length === 0
      ? "Selecciona al menos un transportista para transporte publico."
      : null
  }

  if (conductores.length === 0) return "Selecciona al menos un conductor para transporte privado."
  if (vehiculos.length === 0) return "Selecciona al menos un vehiculo para transporte privado."
  return null
}

function GuiaUbigeoFields({ enabled, idPrefix, value, onChange }: GuiaUbigeoFieldsProps) {
  const [catalog, setCatalog] = useState<PeruUbigeoDepartment[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [selection, setSelection] = useState(getEmptyPeruUbigeoSelection())

  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true)
    setCatalogError(null)

    try {
      const nextCatalog = await loadPeruUbigeoCatalog()
      setCatalog(nextCatalog)
    } catch {
      setCatalogError("No se pudo cargar la ubicacion de Peru")
    } finally {
      setIsLoadingCatalog(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled || catalog.length > 0 || isLoadingCatalog) return
    void fetchCatalog()
  }, [catalog.length, enabled, fetchCatalog, isLoadingCatalog])

  useEffect(() => {
    if (catalog.length === 0) {
      setSelection((previous) =>
        arePeruUbigeoSelectionsEqual(previous, getEmptyPeruUbigeoSelection())
          ? previous
          : getEmptyPeruUbigeoSelection()
      )
      return
    }

    const nextSelection = findPeruUbigeoSelection(catalog, value)
    setSelection((previous) =>
      arePeruUbigeoSelectionsEqual(previous, nextSelection) ? previous : nextSelection
    )
  }, [catalog, value])

  const selectedDepartment = useMemo(
    () => catalog.find((department) => department.code === selection.departmentCode) ?? null,
    [catalog, selection.departmentCode]
  )

  const provinceOptions = useMemo(
    () => selectedDepartment?.provinces ?? [],
    [selectedDepartment]
  )

  const selectedProvince = useMemo(
    () => provinceOptions.find((province) => province.code === selection.provinceCode) ?? null,
    [provinceOptions, selection.provinceCode]
  )

  const districtOptions = useMemo(
    () => selectedProvince?.districts ?? [],
    [selectedProvince]
  )

  const handleDepartmentChange = (departmentCode: string) => {
    const department = catalog.find((item) => item.code === departmentCode) ?? null

    setSelection({ departmentCode, provinceCode: "", districtCode: "" })
    onChange({
      ubigeo: "",
      departamento: department?.name ?? "",
      provincia: "",
      distrito: "",
    })
  }

  const handleProvinceChange = (provinceCode: string) => {
    if (!selectedDepartment) return

    const province =
      selectedDepartment.provinces.find((item) => item.code === provinceCode) ?? null

    setSelection({
      departmentCode: selectedDepartment.code,
      provinceCode,
      districtCode: "",
    })
    onChange({
      ubigeo: "",
      departamento: selectedDepartment.name,
      provincia: province?.name ?? "",
      distrito: "",
    })
  }

  const handleDistrictChange = (districtCode: string) => {
    if (!selectedDepartment || !selectedProvince) return

    const district =
      selectedProvince.districts.find((item) => item.code === districtCode) ?? null

    setSelection({
      departmentCode: selectedDepartment.code,
      provinceCode: selectedProvince.code,
      districtCode,
    })
    onChange({
      ubigeo: district?.code ?? "",
      departamento: selectedDepartment.name,
      provincia: selectedProvince.name,
      distrito: district?.name ?? "",
    })
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-2">
        <div className="grid gap-1.5">
          <label htmlFor={`${idPrefix}-departamento`} className="text-xs font-medium">
            Departamento
          </label>
          <Select
            value={selection.departmentCode || undefined}
            onValueChange={handleDepartmentChange}
            disabled={isLoadingCatalog || catalog.length === 0}
          >
            <SelectTrigger id={`${idPrefix}-departamento`} className="w-full">
              <SelectValue
                placeholder={
                  isLoadingCatalog ? "Cargando..." : "Departamento"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((department) => (
                <SelectItem key={department.code} value={department.code}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={`${idPrefix}-provincia`} className="text-xs font-medium">
            Provincia
          </label>
          <Select
            value={selection.provinceCode || undefined}
            onValueChange={handleProvinceChange}
            disabled={isLoadingCatalog || !selectedDepartment}
          >
            <SelectTrigger id={`${idPrefix}-provincia`} className="w-full">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              {provinceOptions.map((province) => (
                <SelectItem key={province.code} value={province.code}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={`${idPrefix}-distrito`} className="text-xs font-medium">
            Distrito
          </label>
          <Select
            value={selection.districtCode || undefined}
            onValueChange={handleDistrictChange}
            disabled={isLoadingCatalog || !selectedProvince}
          >
            <SelectTrigger id={`${idPrefix}-distrito`} className="w-full">
              <SelectValue placeholder="Distrito" />
            </SelectTrigger>
            <SelectContent>
              {districtOptions.map((district) => (
                <SelectItem key={district.code} value={district.code}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Input value={value.ubigeo} placeholder="Ubigeo automatico" readOnly />
      {catalogError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <p>{catalogError}</p>
          <button
            type="button"
            onClick={() => void fetchCatalog()}
            className="mt-1 font-medium underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function NuevaGuiaRemisionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    loading: lookingDestinatario,
    error: destinatarioLookupError,
    clearError: clearDestinatarioLookupError,
    lookupDocumento,
  } = useDocumentoLookup()
  const isAdmin = isAdministratorRole(user?.rol)
  const canFilterBySucursal = useCanFilterBySucursal()
  const isMultiSucursalNonAdmin = !isAdmin && canFilterBySucursal && (user?.sucursalesPermitidas ?? []).length > 1
  const userSucursalId =
    typeof user?.idSucursal === "number" && user.idSucursal > 0 ? user.idSucursal : null

  const { sucursales, loadingSucursales } = useSucursalOptions(true)

  const [form, setForm] = useState<NuevaGuiaForm>({
    serie: DEFAULT_SERIE,
    motivoTraslado: "04",
    descripcionMotivo: "",
    fechaInicioTraslado: getTodayLocalDate(),
    modalidadTransporte: "02",
    pesoBrutoTotal: "",
    unidadPeso: DEFAULT_UNIDAD_PESO,
    numeroBultos: "",
    observaciones: "",
    ubigeoPartida: "",
    departamentoPartida: "",
    provinciaPartida: "",
    distritoPartida: "",
    direccionPartida: "",
    ubigeoLlegada: "",
    departamentoLlegada: "",
    provinciaLlegada: "",
    distritoLlegada: "",
    direccionLlegada: "",
    idSucursalPartida: null,
    idSucursalLlegada: null,
    destinatarioTipoDoc: "6",
    destinatarioNroDoc: "",
    destinatarioRazonSocial: "",
    emitirDirectamente: false,
  })

  const [searchSucursalPartida, setSearchSucursalPartida] = useState("")
  const [searchSucursalLlegada, setSearchSucursalLlegada] = useState("")
  const [searchMotivo, setSearchMotivo] = useState("")
  const [partidaModo, setPartidaModo] = useState<PuntoTrasladoModo>("sucursal")
  const [llegadaModo, setLlegadaModo] = useState<PuntoTrasladoModo>("sucursal")
  const [ventaSearch, setVentaSearch] = useState<VentaAutocompleteSearch>({
    tipoDocumento: "01",
    serie: "",
    numero: "",
  })
  const [loadingVentaAutocomplete, setLoadingVentaAutocomplete] = useState(false)
  const [documentoDraft, setDocumentoDraft] = useState<GuiaDocumentoRelacionadoDraft>({
    tipoDocumento: "01",
    serie: "",
    numero: "",
  })
  const [documentosRelacionados, setDocumentosRelacionados] = useState<
    GuiaDocumentoRelacionadoDraft[]
  >([])
  const [variantQuery, setVariantQuery] = useState("")
  const [variantResults, setVariantResults] = useState<VarianteResumenItem[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [detalles, setDetalles] = useState<GuiaDetalleDraft[]>([])

  const [selectedConductores, setSelectedConductores] = useState<
    EntitySearchResult<CatalogoConductor>[]
  >([])
  const [selectedVehiculos, setSelectedVehiculos] = useState<
    EntitySearchResult<CatalogoVehiculo>[]
  >([])
  const [selectedTransportistas, setSelectedTransportistas] = useState<
    EntitySearchResult<CatalogoTransportista>[]
  >([])

  const [showConductorDialog, setShowConductorDialog] = useState(false)
  const [showVehiculoDialog, setShowVehiculoDialog] = useState(false)
  const [showTransportistaDialog, setShowTransportistaDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  const searchAbortRef = useRef<AbortController | null>(null)
  const skipNextPartidaResetRef = useRef(false)

  const motivoOptions = useMemo(() => {
    const search = searchMotivo.trim().toLowerCase()
    return MOTIVOS_TRASLADO_OPTIONS.filter((item) => {
      if (!search) return true
      return `${item.codigo} ${item.label} ${item.shortLabel}`.toLowerCase().includes(search)
    }).map((item) => ({
      value: item.codigo,
      label: `${item.codigo} - ${item.shortLabel}`,
      description: item.label,
    }))
  }, [searchMotivo])

  const isMotivoTrasladoInterno = form.motivoTraslado === "04"
  const requiresDescripcionMotivo = form.motivoTraslado === "13"
  const supportsVentaAutocomplete = ["01", "03", "14"].includes(form.motivoTraslado)
  const supportsDocumentosRelacionados = ["01", "02", "03", "14"].includes(
    form.motivoTraslado
  )
  const requiresDocumentoRelacionado = ["01", "02", "03"].includes(form.motivoTraslado)
  const requiresDestinatario = ["01", "03", "05", "06", "14", "17"].includes(
    form.motivoTraslado
  )
  const isPartidaExterna = !isMotivoTrasladoInterno && partidaModo === "externa"
  const isLlegadaExterna = !isMotivoTrasladoInterno && llegadaModo === "externa"
  const productSearchSucursalId =
    !isPartidaExterna && form.idSucursalPartida
      ? form.idSucursalPartida
      : !isLlegadaExterna && form.idSucursalLlegada
        ? form.idSucursalLlegada
        : null
  const canLookupDestinatarioRuc =
    form.destinatarioTipoDoc === "6" &&
    form.destinatarioNroDoc.trim().length === 11 &&
    !saving

  useEffect(() => {
    if (!isAdmin && !isMultiSucursalNonAdmin && userSucursalId) {
      setForm((current) => ({ ...current, idSucursalPartida: userSucursalId }))
    } else if (isMultiSucursalNonAdmin && userSucursalId && !form.idSucursalPartida) {
      setForm((current) => ({ ...current, idSucursalPartida: userSucursalId }))
    }
  }, [isAdmin, isMultiSucursalNonAdmin, userSucursalId])

  useEffect(() => {
    if (form.motivoTraslado === "04") {
      setPartidaModo("sucursal")
      setLlegadaModo("sucursal")
      return
    }

    const nextPartidaModo: PuntoTrasladoModo =
      form.motivoTraslado === "02" || form.motivoTraslado === "07"
        ? "externa"
        : "sucursal"
    const nextLlegadaModo: PuntoTrasladoModo =
      form.motivoTraslado === "02" || form.motivoTraslado === "07"
        ? "sucursal"
        : "externa"

    setPartidaModo(nextPartidaModo)
    setLlegadaModo(nextLlegadaModo)
    setForm((current) => ({
      ...current,
      idSucursalPartida:
        nextPartidaModo === "sucursal"
          ? current.idSucursalPartida ?? userSucursalId
          : null,
      idSucursalLlegada:
        nextLlegadaModo === "sucursal"
          ? current.idSucursalLlegada ?? userSucursalId
          : null,
      direccionPartida: nextPartidaModo === "externa" ? current.direccionPartida : "",
      direccionLlegada: nextLlegadaModo === "externa" ? current.direccionLlegada : "",
      departamentoPartida: nextPartidaModo === "externa" ? current.departamentoPartida : "",
      provinciaPartida: nextPartidaModo === "externa" ? current.provinciaPartida : "",
      distritoPartida: nextPartidaModo === "externa" ? current.distritoPartida : "",
      departamentoLlegada: nextLlegadaModo === "externa" ? current.departamentoLlegada : "",
      provinciaLlegada: nextLlegadaModo === "externa" ? current.provinciaLlegada : "",
      distritoLlegada: nextLlegadaModo === "externa" ? current.distritoLlegada : "",
    }))
  }, [form.motivoTraslado, userSucursalId])

  useEffect(() => {
    if (!isMotivoTrasladoInterno) return
    setForm((current) => ({
      ...current,
      descripcionMotivo: "",
      direccionPartida: "",
      direccionLlegada: "",
      destinatarioNroDoc: "",
      destinatarioRazonSocial: "",
    }))
  }, [isMotivoTrasladoInterno])

  useEffect(() => {
    if (supportsDocumentosRelacionados) return
    setDocumentosRelacionados([])
  }, [supportsDocumentosRelacionados])

  useEffect(() => {
    setVariantQuery("")
    setVariantResults([])
    if (skipNextPartidaResetRef.current) {
      skipNextPartidaResetRef.current = false
    } else {
      setDetalles([])
    }

    setForm((current) =>
      current.idSucursalPartida !== null &&
      current.idSucursalLlegada === current.idSucursalPartida
        ? { ...current, idSucursalLlegada: null }
        : current
    )
  }, [form.idSucursalPartida])

  useEffect(() => {
    searchAbortRef.current?.abort()

    if (!productSearchSucursalId || variantQuery.trim().length < 2) {
      setVariantResults([])
      setLoadingVariants(false)
      return
    }

    const controller = new AbortController()
    searchAbortRef.current = controller

    const timer = window.setTimeout(() => {
      const run = async () => {
        setLoadingVariants(true)
        try {
          const params = new URLSearchParams({
            page: "0",
            q: variantQuery.trim(),
            idSucursal: String(productSearchSucursalId),
          })
          const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, {
            signal: controller.signal,
          })
          const data = await parseJsonSafe<unknown>(response)

          if (controller.signal.aborted) return
          if (!response.ok) {
            setVariantResults([])
            return
          }

          const pageData = parseVarianteResumenPageResponse(data)
          const imageMap = buildImagenesPorColorMap(pageData.imagenesPorColor)
          setVariantResults(withResolvedVariantImages(pageData.content.slice(0, 8), imageMap))
        } catch {
          if (!controller.signal.aborted) setVariantResults([])
        } finally {
          if (!controller.signal.aborted) setLoadingVariants(false)
        }
      }

      void run()
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [productSearchSucursalId, variantQuery])

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort()
    }
  }, [])

  // Obtener el correlativo siguiente según la serie
  const sucursalesActivas = useMemo(
    () =>
      sucursales.filter(
        (item) =>
          item.estado === "ACTIVO" &&
          /^\d{4}$/.test(item.codigoEstablecimientoSunat ?? "")
      ),
    [sucursales]
  )

  const sucursalesSinCodigo = useMemo(
    () =>
      sucursales.filter(
        (item) =>
          item.estado === "ACTIVO" &&
          !/^\d{4}$/.test(item.codigoEstablecimientoSunat ?? "")
      ).length,
    [sucursales]
  )

  const partidaSucursales = useMemo(() => {
    if (isAdmin) return sucursalesActivas
    if (isMultiSucursalNonAdmin) {
      const permittedIds = new Set(
        (user?.sucursalesPermitidas ?? []).map((s) => s.idSucursal)
      )
      return sucursalesActivas.filter((s) => permittedIds.has(s.idSucursal))
    }
    return sucursalesActivas.filter((s) => s.idSucursal === userSucursalId)
  }, [isAdmin, isMultiSucursalNonAdmin, user?.sucursalesPermitidas, sucursalesActivas, userSucursalId])

  const partidaOptions = useMemo(() => {
    const search = searchSucursalPartida.trim().toLowerCase()
    return partidaSucursales
      .filter((item) => {
        if (!search) return true
        return [item.nombre, item.ciudad, item.direccion, item.tipo]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)
      })
      .map((item) => buildSucursalComboboxOption(item))
  }, [searchSucursalPartida, partidaSucursales])

  const llegadaOptions = useMemo(() => {
    const search = searchSucursalLlegada.trim().toLowerCase()
    return sucursalesActivas
      .filter((item) => item.idSucursal !== form.idSucursalPartida)
      .filter((item) => {
        if (!search) return true
        return [item.nombre, item.ciudad, item.direccion, item.tipo]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)
      })
      .map((item) => buildSucursalComboboxOption(item))
  }, [form.idSucursalPartida, searchSucursalLlegada, sucursalesActivas])

  const selectedPartida = useMemo(
    () =>
      sucursalesActivas.find((item) => item.idSucursal === form.idSucursalPartida) ?? null,
    [form.idSucursalPartida, sucursalesActivas]
  )

  const selectedLlegada = useMemo(
    () =>
      sucursalesActivas.find((item) => item.idSucursal === form.idSucursalLlegada) ?? null,
    [form.idSucursalLlegada, sucursalesActivas]
  )

  // Auto-fill ubigeo from selected sucursal
  useEffect(() => {
    if (isPartidaExterna) return
    setForm((current) => ({
      ...current,
      ubigeoPartida: selectedPartida?.ubigeo ?? "",
      departamentoPartida: "",
      provinciaPartida: "",
      distritoPartida: "",
    }))
  }, [isPartidaExterna, selectedPartida])

  useEffect(() => {
    if (isLlegadaExterna) return
    setForm((current) => ({
      ...current,
      ubigeoLlegada: selectedLlegada?.ubigeo ?? "",
      departamentoLlegada: "",
      provinciaLlegada: "",
      distritoLlegada: "",
    }))
  }, [isLlegadaExterna, selectedLlegada])

  const transportValidationMessage = useMemo(
    () =>
      buildTransportValidationMessage(
        form.modalidadTransporte,
        selectedConductores,
        selectedVehiculos,
        selectedTransportistas
      ),
    [form.modalidadTransporte, selectedConductores, selectedTransportistas, selectedVehiculos]
  )

  const invalidDetailMessage = useMemo(() => {
    if (detalles.length === 0) return "Agrega al menos un producto a la guia."

    const detail = detalles.find((item) => {
      const cantidad = Number(normalizePositiveNumberString(item.cantidad))
      const pesoUnitario = item.pesoUnitario.trim()
      const numeroPeso = pesoUnitario ? Number(normalizePositiveNumberString(pesoUnitario)) : null

      if (!Number.isFinite(cantidad) || cantidad <= 0) return true
      if (!item.unidadMedida.trim()) return true
      if (pesoUnitario && (!Number.isFinite(numeroPeso) || Number(numeroPeso) <= 0)) return true
      return false
    })

    if (!detail) return null
    return `Revisa el detalle de "${formatVariantLabel(detail.variante)}".`
  }, [detalles])

  const generalValidationMessage = useMemo(() => {
    if (isMotivoTrasladoInterno && !form.idSucursalPartida) return "Selecciona la sucursal de partida."
    if (isMotivoTrasladoInterno && !form.idSucursalLlegada) return "Selecciona la sucursal de llegada."
    if (isMotivoTrasladoInterno && form.idSucursalPartida === form.idSucursalLlegada) {
      return "La sucursal de llegada debe ser distinta a la de partida."
    }
    if (!form.fechaInicioTraslado) return "Ingresa la fecha de inicio de traslado."
    if (isPartidaExterna) {
      if (!isValidUbigeo(form.ubigeoPartida)) return "El ubigeo de partida debe tener 6 digitos."
      if (!form.direccionPartida.trim()) return "Ingresa la direccion de partida."
    } else if (!form.idSucursalPartida) {
      return "Selecciona la sucursal de partida."
    }
    if (isLlegadaExterna) {
      if (!isValidUbigeo(form.ubigeoLlegada)) return "El ubigeo de llegada debe tener 6 digitos."
      if (!form.direccionLlegada.trim()) return "Ingresa la direccion de llegada."
    } else if (!form.idSucursalLlegada) {
      return "Selecciona la sucursal de llegada."
    }
    if (requiresDescripcionMotivo && !form.descripcionMotivo.trim()) {
      return "Describe el motivo cuando seleccionas Otros."
    }
    if (requiresDocumentoRelacionado && documentosRelacionados.length === 0) {
      return "Agrega el documento relacionado para este motivo."
    }
    if (requiresDestinatario) {
      if (!form.destinatarioNroDoc.trim()) return "Ingresa el documento del destinatario."
      if (!form.destinatarioRazonSocial.trim()) return "Ingresa la razon social del destinatario."
    }

    const peso = Number(normalizePositiveNumberString(form.pesoBrutoTotal))
    if (!Number.isFinite(peso) || peso <= 0) return "El peso bruto total debe ser mayor a 0."

    if (form.numeroBultos.trim()) {
      const bultos = Number(form.numeroBultos)
      if (!Number.isInteger(bultos) || bultos < 0) {
        return "El numero de bultos debe ser un entero mayor o igual a 0."
      }
    }

    return invalidDetailMessage ?? transportValidationMessage
  }, [
    documentosRelacionados.length,
    form,
    invalidDetailMessage,
    isLlegadaExterna,
    isMotivoTrasladoInterno,
    isPartidaExterna,
    requiresDocumentoRelacionado,
    requiresDescripcionMotivo,
    requiresDestinatario,
    transportValidationMessage,
  ])

  const canSubmit = !saving && !generalValidationMessage

  const setField = <K extends keyof NuevaGuiaForm>(field: K, value: NuevaGuiaForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setVentaSearchField = <K extends keyof VentaAutocompleteSearch>(
    field: K,
    value: VentaAutocompleteSearch[K]
  ) => {
    setVentaSearch((current) => ({ ...current, [field]: value }))
  }

  const setDocumentoDraftField = <K extends keyof GuiaDocumentoRelacionadoDraft>(
    field: K,
    value: GuiaDocumentoRelacionadoDraft[K]
  ) => {
    setDocumentoDraft((current) => ({ ...current, [field]: value }))
  }

  const addVariantToGuide = (variant: VarianteResumenItem) => {
    setDetalles((current) => {
      const existingIndex = current.findIndex(
        (item) => item.variante.idProductoVariante === variant.idProductoVariante
      )

      if (existingIndex >= 0) {
        return current.map((item, index) => {
          if (index !== existingIndex) return item

          const currentCantidad = Number.parseInt(item.cantidad, 10)
          const nextCantidad =
            Number.isFinite(currentCantidad) && currentCantidad > 0
              ? currentCantidad + 1
              : 1

          return { ...item, cantidad: String(nextCantidad) }
        })
      }

      return [
        ...current,
        {
          variante: variant,
          cantidad: "1",
          unidadMedida: DEFAULT_UNIDAD_MEDIDA,
          descripcion: "",
          pesoUnitario: "",
        },
      ]
    })
    setVariantQuery("")
    setVariantResults([])
  }

  const findResumenVariantForDetalle = async (
    detalle: GuiaAutocompleteDetalle,
    idSucursal: number | null
  ): Promise<VarianteResumenItem | null> => {
    const query = detalle.codigoProducto?.trim() || detalle.descripcion.trim()
    if (!query) return null

    try {
      const params = new URLSearchParams({ page: "0", q: query })
      if (idSucursal) params.set("idSucursal", String(idSucursal))

      const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`)
      const data = await parseJsonSafe<unknown>(response)
      if (!response.ok) return null

      const pageData = parseVarianteResumenPageResponse(data)
      const imageMap = buildImagenesPorColorMap(pageData.imagenesPorColor)
      const results = withResolvedVariantImages(pageData.content, imageMap)

      return (
        results.find((item) => item.idProductoVariante === detalle.idProductoVariante) ??
        null
      )
    } catch {
      return null
    }
  }

  const updateDetalle = (
    idProductoVariante: number,
    patch: Partial<Omit<GuiaDetalleDraft, "variante">>
  ) => {
    setDetalles((current) =>
      current.map((item) =>
        item.variante.idProductoVariante === idProductoVariante ? { ...item, ...patch } : item
      )
    )
  }

  const removeDetalle = (idProductoVariante: number) => {
    setDetalles((current) =>
      current.filter((item) => item.variante.idProductoVariante !== idProductoVariante)
    )
  }

  const handleBarcodeScanSuccess = useCallback(
    (data: VarianteEscanearResponse) => {
      addVariantToGuide(escanearToResumenItem(data))
    },
    []
  )

  const handleBarcodeScanError = useCallback(
    async (message: string, context?: import("@/lib/hooks/useBarcodeScan").BarcodeScanErrorContext) => {
      const isStockError = /no tiene stock disponible/i.test(message)

      if (isStockError && context && context.idSucursal) {
        // Para guias de remision el stock no importa: buscar el producto y agregarlo igual
        try {
          const params = new URLSearchParams({
            page: "0",
            q: context.codigoBarras,
            idSucursal: String(context.idSucursal),
          })
          const res = await authFetch(`/api/variante/listar-resumen?${params.toString()}`)
          if (res.ok) {
            const data = await parseJsonSafe<unknown>(res)
            const pageData = parseVarianteResumenPageResponse(data)
            const imageMap = buildImagenesPorColorMap(pageData.imagenesPorColor)
            const results = withResolvedVariantImages(pageData.content, imageMap)
            const found = results.find(
              (v) => v.codigoBarras === context.codigoBarras
            ) ?? results[0]
            if (found) {
              addVariantToGuide(found)
              toast.warning("Producto agregado sin stock disponible")
              return
            }
          }
        } catch {
          // si falla la búsqueda secundaria, caemos al error normal
        }
      }

      toast.error(message)
    },
    []
  )

  const { scan: scanBarcode, scanning: scanningBarcode } = useBarcodeScan({
    idSucursal: productSearchSucursalId,
    onSuccess: handleBarcodeScanSuccess,
    onError: handleBarcodeScanError,
  })

  const { active: scannerActive, toggle: toggleScanner } = useGlobalBarcodeScanner({
    onScan: scanBarcode,
  })

  const handleSelectConductor = (result: EntitySearchResult<CatalogoConductor>) => {
    setSelectedConductores([result])
  }

  const handleSelectVehiculo = (result: EntitySearchResult<CatalogoVehiculo>) => {
    setSelectedVehiculos([result])
  }

  const handleSelectTransportista = (result: EntitySearchResult<CatalogoTransportista>) => {
    setSelectedTransportistas([result])
  }

  const removeSelectedById = <T,>(
    setter: Dispatch<SetStateAction<EntitySearchResult<T>[]>>,
    id: string | number
  ) => {
    setter((current) => current.filter((item) => item.id !== id))
  }

  const addDocumentoRelacionado = (documento: GuiaDocumentoRelacionadoDraft) => {
    const nextDocumento = {
      tipoDocumento: documento.tipoDocumento,
      serie: documento.serie.trim().toUpperCase(),
      numero: documento.numero.trim().padStart(8, "0"),
    }

    if (!nextDocumento.serie || !/^\d{1,8}$/.test(documento.numero.trim())) {
      toast.error("Completa serie y numero del documento relacionado")
      return
    }

    setDocumentosRelacionados([nextDocumento])
  }

  const removeDocumentoRelacionado = (documento: GuiaDocumentoRelacionadoDraft) => {
    setDocumentosRelacionados((current) =>
      current.filter(
        (item) =>
          item.tipoDocumento !== documento.tipoDocumento ||
          item.serie !== documento.serie ||
          item.numero !== documento.numero
      )
    )
  }

  const handleLookupDestinatarioRuc = async () => {
    if (!canLookupDestinatarioRuc || lookingDestinatario) return

    const result = await lookupDocumento("RUC", form.destinatarioNroDoc)
    if (!result.ok) return

    const data = result.data as DocumentoRucResponse
    const razonSocial =
      typeof data.razonSocial === "string" ? data.razonSocial.replace(/\s+/g, " ").trim() : ""

    if (razonSocial) {
      setForm((current) => ({ ...current, destinatarioRazonSocial: razonSocial }))
      toast.success("Razon social encontrada")
    }
  }

  const handleAutocompletarDesdeVenta = async () => {
    const serie = ventaSearch.serie.trim().toUpperCase()
    const numero = ventaSearch.numero.trim()

    if (!supportsVentaAutocomplete) {
      toast.error("La busqueda por venta aplica para los motivos 01, 03 y 14")
      return
    }

    if (!serie || !/^\d{1,8}$/.test(numero)) {
      toast.error("Ingresa serie y numero de comprobante validos")
      return
    }

    setLoadingVentaAutocomplete(true)
    try {
      const params = new URLSearchParams({
        tipoDocumento: ventaSearch.tipoDocumento,
        serie,
        numero,
      })
      const response = await authFetch(
        `/api/guia-remision/autocompletar/venta?${params.toString()}`
      )
      const data = await parseJsonSafe<GuiaAutocompleteVentaResponse>(response)

      if (!response.ok) {
        toast.error(data?.message ?? "No se pudo autocompletar desde la venta")
        return
      }

      const sugerida = data?.guiaSugerida
      if (!sugerida) {
        toast.error("La venta no devolvio datos sugeridos para la guia")
        return
      }

      const nextPartidaModo: PuntoTrasladoModo = sugerida.idSucursalPartida
        ? "sucursal"
        : "externa"
      const nextLlegadaModo: PuntoTrasladoModo = sugerida.idSucursalLlegada
        ? "sucursal"
        : "externa"

      setPartidaModo(nextPartidaModo)
      setLlegadaModo(nextLlegadaModo)
      skipNextPartidaResetRef.current = true
      setForm((current) => ({
        ...current,
        motivoTraslado: supportsVentaAutocomplete
          ? current.motivoTraslado
          : sugerida.motivoTraslado ?? "01",
        idSucursalPartida: sugerida.idSucursalPartida ?? null,
        idSucursalLlegada: sugerida.idSucursalLlegada ?? null,
        ubigeoPartida: sugerida.ubigeoPartida ?? "",
        direccionPartida: sugerida.direccionPartida ?? "",
        ubigeoLlegada: sugerida.ubigeoLlegada ?? "",
        direccionLlegada: sugerida.direccionLlegada ?? "",
        destinatarioTipoDoc:
          sugerida.destinatarioTipoDoc === "1"
            ? "1"
            : sugerida.destinatarioTipoDoc === "6"
              ? "6"
              : current.destinatarioTipoDoc,
        destinatarioNroDoc: sugerida.destinatarioNroDoc ?? current.destinatarioNroDoc,
        destinatarioRazonSocial:
          sugerida.destinatarioRazonSocial ?? current.destinatarioRazonSocial,
      }))

      if (Array.isArray(sugerida.documentosRelacionados)) {
        setDocumentosRelacionados(
          sugerida.documentosRelacionados
            .filter((item) => item.tipoDocumento && item.serie && item.numero)
            .map((item) => ({
              tipoDocumento: item.tipoDocumento,
              serie: item.serie.trim().toUpperCase(),
              numero: item.numero.trim().padStart(8, "0"),
            }))
            .slice(0, 1)
        )
      }

      if (Array.isArray(sugerida.detalles) && sugerida.detalles.length > 0) {
        const idSucursalImagen =
          sugerida.idSucursalPartida ?? sugerida.idSucursalLlegada ?? productSearchSucursalId
        const detallesConImagen = await Promise.all(
          sugerida.detalles.map(async (item) => ({
            variante:
              (await findResumenVariantForDetalle(item, idSucursalImagen ?? null)) ??
              autocompleteDetalleToResumenItem(item),
            cantidad: String(item.cantidad),
            unidadMedida: item.unidadMedida?.trim() || DEFAULT_UNIDAD_MEDIDA,
            descripcion: item.descripcion,
            pesoUnitario:
              typeof item.pesoUnitario === "number" && Number.isFinite(item.pesoUnitario)
                ? String(item.pesoUnitario)
                : "",
          }))
        )
        setDetalles(detallesConImagen)
        setVariantQuery("")
        setVariantResults([])
      }

      toast.success("Guia precargada desde la venta")
    } catch {
      toast.error("Error inesperado al autocompletar desde la venta")
    } finally {
      setLoadingVentaAutocomplete(false)
    }
  }

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (generalValidationMessage) {
        toast.error(generalValidationMessage)
        return
      }

      const pesoBrutoTotal = Number(normalizePositiveNumberString(form.pesoBrutoTotal))
      const numeroBultos = form.numeroBultos.trim() ? Number(form.numeroBultos) : null

      const payload = {
        serie: form.serie.trim().toUpperCase() || DEFAULT_SERIE,
        motivoTraslado: form.motivoTraslado,
        ...(form.descripcionMotivo.trim()
          ? { descripcionMotivo: form.descripcionMotivo.trim() }
          : {}),
        ...(!isPartidaExterna
          ? { idSucursalPartida: form.idSucursalPartida }
          : {
              ubigeoPartida: form.ubigeoPartida.trim(),
              direccionPartida: form.direccionPartida.trim(),
            }),
        ...(!isLlegadaExterna
          ? { idSucursalLlegada: form.idSucursalLlegada }
          : {
              ubigeoLlegada: form.ubigeoLlegada.trim(),
              direccionLlegada: form.direccionLlegada.trim(),
            }),
        ...(form.destinatarioNroDoc.trim() || form.destinatarioRazonSocial.trim()
          ? {
              destinatarioTipoDoc: form.destinatarioTipoDoc,
              destinatarioNroDoc: form.destinatarioNroDoc.trim(),
              destinatarioRazonSocial: form.destinatarioRazonSocial.trim(),
            }
          : {}),
        fechaInicioTraslado: form.fechaInicioTraslado,
        modalidadTransporte: form.modalidadTransporte,
        pesoBrutoTotal,
        unidadPeso: form.unidadPeso.trim().toUpperCase() || DEFAULT_UNIDAD_PESO,
        numeroBultos,
        observaciones: form.observaciones.trim() || null,
        ...(documentosRelacionados.length > 0
          ? { documentosRelacionados }
          : {}),
        detalles: detalles.map((item) => {
          const cantidad = Number(normalizePositiveNumberString(item.cantidad))
          const pesoUnitario = item.pesoUnitario.trim()

          return {
            idProductoVariante: item.variante.idProductoVariante,
            cantidad,
            unidadMedida: item.unidadMedida.trim().toUpperCase() || DEFAULT_UNIDAD_MEDIDA,
            descripcion: item.descripcion.trim() || formatVariantLabel(item.variante),
            ...(pesoUnitario
              ? { pesoUnitario: Number(normalizePositiveNumberString(pesoUnitario)) }
              : {}),
          }
        }),
        ...(form.modalidadTransporte === "01"
          ? {
              transportistas: selectedTransportistas.map((item) => ({
                transportistaTipoDoc: item.data.transportistaTipoDoc || "6",
                transportistaNroDoc: item.data.transportistaNroDoc,
                transportistaRazonSocial: item.data.transportistaRazonSocial,
                transportistaRegistroMtc: item.data.transportistaRegistroMtc ?? null,
              })),
            }
          : {
              conductores: selectedConductores.map((item) => ({
                tipoDocumento: item.data.tipoDocumento || "1",
                nroDocumento: item.data.nroDocumento,
                nombres: item.data.nombres,
                apellidos: item.data.apellidos,
                licencia: item.data.licencia,
              })),
              vehiculos: selectedVehiculos.map((item) => ({
                placa: item.data.placa,
              })),
            }),
        emitirDirectamente: form.emitirDirectamente,
      }

      setSaving(true)
      try {
        const response = await authFetch("/api/guia-remision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await parseJsonSafe<GuiaCreateResponse>(response)

        if (!response.ok) {
          toast.error(data?.message ?? "No se pudo registrar la guia de remision remitente")
          return
        }

        const createdId =
          typeof data?.idGuiaRemision === "number"
            ? data.idGuiaRemision
            : typeof data?.data?.idGuiaRemision === "number"
              ? data.data.idGuiaRemision
              : null

        toast.success(
          form.emitirDirectamente
            ? "Guia de remision creada y enviada correctamente"
            : "Guia de remision creada correctamente"
        )

        router.push("/ventas/guia-remision")
      } catch {
        toast.error("Error inesperado al registrar la guia de remision remitente")
      } finally {
        setSaving(false)
      }
    },
    [
      detalles,
      documentosRelacionados,
      form,
      generalValidationMessage,
      isLlegadaExterna,
      isPartidaExterna,
      router,
      selectedConductores,
      selectedTransportistas,
      selectedVehiculos,
    ]
  )

  const userWithoutSucursal = !isAdmin && !isMultiSucursalNonAdmin && !userSucursalId

  return (
    <>
      <GuiaConductorCreateDialog
        open={showConductorDialog}
        onClose={() => setShowConductorDialog(false)}
        onCreated={(item) => handleSelectConductor(parseConductorResult(item)!)}
      />
      <GuiaVehiculoCreateDialog
        open={showVehiculoDialog}
        onClose={() => setShowVehiculoDialog(false)}
        onCreated={(item) => handleSelectVehiculo(parseVehiculoResult(item)!)}
      />
      <GuiaTransportistaCreateDialog
        open={showTransportistaDialog}
        onClose={() => setShowTransportistaDialog(false)}
        onCreated={(item) => handleSelectTransportista(parseTransportistaResult(item)!)}
      />

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/ventas/guia-remision"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">Nueva guia de remision remitente</h1>
            <p className="text-sm text-muted-foreground">
              Registra una guia de remision remitente con los motivos SUNAT habilitados.
            </p>
          </div>
        </div>

        {userWithoutSucursal ? (
          <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">
                Usuario sin sucursal asignada
              </CardTitle>
              <CardDescription className="text-red-600/90 dark:text-red-300/80">
                Tu usuario necesita una sucursal para poder registrar GRE remitente.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {/* ── Layout: col izquierda (3 cards sticky) + col derecha (productos) ── */}
        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-4 xl:grid-cols-[3fr_2.5fr]">

            {/* ────────────────────────────────────────────────
                COLUMNA DERECHA · Productos a trasladar
            ──────────────────────────────────────────────── */}
            <Card className="flex flex-col xl:sticky xl:top-4 xl:order-2 xl:max-h-[calc(100vh-2rem)]">

              <CardContent className="flex-1 space-y-4 xl:overflow-y-auto">
                {/* Peso bruto y bultos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Peso bruto total (KGM)
                    </label>
                    <Input
                      value={form.pesoBrutoTotal}
                      onChange={(e) =>
                        setField("pesoBrutoTotal", e.target.value.replace(/[^0-9.,]/g, ""))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      N° de bultos
                    </label>
                    <Input
                      value={form.numeroBultos}
                      onChange={(e) =>
                        setField("numeroBultos", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Search input + scanner button */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    {loadingVariants ? (
                      <ArrowPathIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : null}
                    <Input
                      value={variantQuery}
                      onChange={(e) => setVariantQuery(e.target.value)}
                      placeholder={
                        form.idSucursalPartida
                          ? "Buscar producto, SKU o codigo de barras..."
                          : productSearchSucursalId
                            ? "Buscar producto, SKU o codigo de barras..."
                            : "Selecciona una sucursal de partida o llegada"
                      }
                      disabled={!productSearchSucursalId}
                      className="pl-9 pr-9"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={toggleScanner}
                    disabled={!productSearchSucursalId}
                    title="Escanear codigo de barras"
                    aria-pressed={scannerActive}
                    className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                      scannerActive
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <QrCodeIcon className="h-4 w-4" />
                    Escaner
                    {scanningBarcode && (
                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    )}
                  </button>
                </div>

                {/* Search results with images */}
                {variantQuery.trim().length >= 2 && variantResults.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border shadow-sm">
                    {variantResults.map((variant) => {
                      const alreadyAdded = detalles.some(
                        (item) =>
                          item.variante.idProductoVariante === variant.idProductoVariante
                      )
                      const attributes = formatVariantAttributes(variant)
                      const thumbUrl = getVariantImageUrl(variant)

                      return (
                        <button
                          key={variant.idProductoVariante}
                          type="button"
                          onClick={() => addVariantToGuide(variant)}
                          disabled={alreadyAdded}
                          className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {/* Thumbnail */}
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                            {thumbUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumbUrl}
                                alt={variant.producto.nombre}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <PhotoIcon className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {variant.producto.nombre}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[attributes, variant.sku, `Stock ${variant.stock ?? 0}`]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>

                          {/* Badge */}
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              alreadyAdded
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                            }`}
                          >
                            {alreadyAdded ? null : <PlusIcon className="h-3 w-3" />}
                            {alreadyAdded ? "Agregado" : "Agregar"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {/* Product list */}
                <div className="space-y-3">
                  {detalles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center text-muted-foreground">
                      <PhotoIcon className="mb-2 h-10 w-10 opacity-25" />
                      <p className="text-sm font-medium">Sin productos</p>
                      <p className="text-xs opacity-70">
                        Busca y agrega los productos que se trasladaran
                      </p>
                    </div>
                  ) : (
                    detalles.map((item) => {
                      const thumbUrl = getVariantImageUrl(item.variante)

                      return (
                        <div
                          key={item.variante.idProductoVariante}
                          className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm"
                        >
                          <div className="flex gap-3 p-3">
                            {/* Image */}
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                              {thumbUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumbUrl}
                                  alt={formatVariantLabel(item.variante)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <PhotoIcon className="h-6 w-6 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>

                            {/* Info + actions */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">
                                    {formatVariantLabel(item.variante)}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {[item.variante.sku, `Stock ${item.variante.stock ?? 0}`]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    removeDetalle(item.variante.idProductoVariante)
                                  }
                                  className="shrink-0 text-muted-foreground hover:text-destructive"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Fields row */}
                              <div className="mt-2.5 grid grid-cols-3 gap-2">
                                {/* Cantidad: stepper - / + */}
                                <div className="grid gap-1">
                                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Cantidad
                                  </label>
                                  <div className="flex h-8 items-center overflow-hidden rounded-md border">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const curr = Math.max(0, Number(normalizePositiveNumberString(item.cantidad)) || 0)
                                        const next = Math.max(1, curr - 1)
                                        updateDetalle(item.variante.idProductoVariante, { cantidad: String(next) })
                                      }}
                                      className="flex h-full w-7 shrink-0 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
                                    >
                                      <span className="text-base leading-none">−</span>
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={item.cantidad}
                                      onChange={(e) =>
                                        updateDetalle(item.variante.idProductoVariante, {
                                          cantidad: e.target.value.replace(/[^0-9]/g, ""),
                                        })
                                      }
                                      onBlur={() => {
                                        const n = Number(item.cantidad)
                                        if (!n || n < 1) {
                                          updateDetalle(item.variante.idProductoVariante, { cantidad: "1" })
                                        }
                                      }}
                                      className="w-0 flex-1 bg-transparent text-center text-sm font-medium focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const curr = Math.max(0, Number(normalizePositiveNumberString(item.cantidad)) || 0)
                                        updateDetalle(item.variante.idProductoVariante, { cantidad: String(curr + 1) })
                                      }}
                                      className="flex h-full w-7 shrink-0 items-center justify-center border-l text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
                                    >
                                      <span className="text-base leading-none">+</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Unidad: solo lectura */}
                                <div className="grid gap-1">
                                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Unidad
                                  </label>
                                  <div className="flex h-8 items-center rounded-md border bg-muted/50 px-2 text-sm text-muted-foreground">
                                    {item.unidadMedida || DEFAULT_UNIDAD_MEDIDA}
                                  </div>
                                </div>

                                {/* Peso unitario */}
                                <div className="grid gap-1">
                                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Peso (kg)
                                  </label>
                                  <Input
                                    value={item.pesoUnitario}
                                    onChange={(e) =>
                                      updateDetalle(item.variante.idProductoVariante, {
                                        pesoUnitario: e.target.value.replace(/[^0-9.,]/g, ""),
                                      })
                                    }
                                    placeholder="0.50"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>

              {detalles.length > 0 ? (
                <CardFooter className="border-t bg-muted/30 pb-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    {detalles.length}{" "}
                    {detalles.length === 1 ? "producto agregado" : "productos agregados"}
                  </p>
                </CardFooter>
              ) : null}
            </Card>

            {/* ────────────────────────────────────────────────
                COLUMNA IZQUIERDA · Documento + Transporte + Ruta
            ──────────────────────────────────────────────── */}
            <div className="sticky top-4 space-y-4 self-start xl:order-1">

              {/* Fila superior: [Datos del documento] [Tipo de transporte] */}
              <div className="grid gap-4 md:grid-cols-2">

                {/* Datos del documento */}
                <Card>
                  <CardContent className="space-y-4">
                    {/* Serie (solo lectura) */}
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Serie</label>
                      <Input
                        value={form.serie}
                        readOnly
                        className="bg-muted/50 text-muted-foreground"
                      />
                    </div>

                    {/* Fecha inicio traslado */}
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Fecha inicio traslado</label>
                      <Input
                        type="date"
                        value={form.fechaInicioTraslado}
                        onChange={(e) => setField("fechaInicioTraslado", e.target.value)}
                      />
                    </div>

                    {/* Motivo SUNAT */}
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Motivo de traslado</label>
                      <Combobox
                        value={form.motivoTraslado}
                        options={motivoOptions}
                        searchValue={searchMotivo}
                        onSearchValueChange={setSearchMotivo}
                        onValueChange={(value) =>
                          setField("motivoTraslado", value as MotivoTraslado)
                        }
                        placeholder="Selecciona motivo"
                        searchPlaceholder="Buscar motivo..."
                      />
                      <p className="text-xs text-muted-foreground">
                        {MOTIVO_TRASLADO_LABELS[form.motivoTraslado] ?? form.motivoTraslado}
                      </p>
                    </div>

                    {form.motivoTraslado !== "04" ? (
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium">
                          Descripcion del motivo {requiresDescripcionMotivo ? "*" : ""}
                        </label>
                        <Textarea
                          value={form.descripcionMotivo}
                          onChange={(e) =>
                            setField("descripcionMotivo", e.target.value.slice(0, 255))
                          }
                          placeholder="Ej. Envio a taller para bordado"
                          className="min-h-20 resize-none"
                        />
                        <p className="text-right text-[10px] text-muted-foreground">
                          {form.descripcionMotivo.length}/255
                        </p>
                      </div>
                    ) : null}

                    {/* Toggle emitir inmediatamente */}
                    <div className="flex items-center justify-between gap-3 rounded-xl border p-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Emitir inmediatamente</p>
                        <p className="text-xs text-muted-foreground">
                          Se enviara a SUNAT al registrar
                        </p>
                      </div>
                      <Switch
                        checked={form.emitirDirectamente}
                        onCheckedChange={(checked) =>
                          setField("emitirDirectamente", checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tipo de transporte */}
                <Card>
                  <CardContent className="space-y-4">
                    {/* Selector público / privado */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setField("modalidadTransporte", "01")}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-center transition-all ${
                          form.modalidadTransporte === "01"
                            ? "border-amber-400 bg-amber-50 shadow-sm dark:border-amber-500/60 dark:bg-amber-950/30"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                        }`}
                      >
                        <TruckIcon
                          className={`h-5 w-5 ${
                            form.modalidadTransporte === "01"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p
                          className={`text-sm font-semibold ${
                            form.modalidadTransporte === "01"
                              ? "text-amber-800 dark:text-amber-300"
                              : ""
                          }`}
                        >
                          Publico
                        </p>
                        <p className="text-[11px] leading-tight text-muted-foreground">
                          Empresa de transporte
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setField("modalidadTransporte", "02")}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-center transition-all ${
                          form.modalidadTransporte === "02"
                            ? "border-amber-400 bg-amber-50 shadow-sm dark:border-amber-500/60 dark:bg-amber-950/30"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                        }`}
                      >
                        <UserIcon
                          className={`h-5 w-5 ${
                            form.modalidadTransporte === "02"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p
                          className={`text-sm font-semibold ${
                            form.modalidadTransporte === "02"
                              ? "text-amber-800 dark:text-amber-300"
                              : ""
                          }`}
                        >
                          Privado
                        </p>
                        <p className="text-[11px] leading-tight text-muted-foreground">
                          Conductor propio
                        </p>
                      </button>
                    </div>

                    {/* Dynamic transport fields */}
                    {form.modalidadTransporte === "01" ? (
                      <EntitySmartSearch<CatalogoTransportista>
                        label="Transportista"
                        placeholder="Haz click para ver disponibles o escribe para buscar..."
                        searchEndpoint="/api/guia-remision/catalogos/transportistas"
                        parseResult={parseTransportistaResult}
                        onSelect={handleSelectTransportista}
                        onAddNew={() => setShowTransportistaDialog(true)}
                        selectedItems={selectedTransportistas}
                        onRemoveItem={(id) =>
                          removeSelectedById(setSelectedTransportistas, id)
                        }
                        disabled={saving}
                        eagerLoad
                      />
                    ) : (
                      <div className="space-y-4">
                        <EntitySmartSearch<CatalogoConductor>
                          label="Conductor"
                          placeholder="Haz click para ver disponibles o escribe para buscar..."
                          searchEndpoint="/api/guia-remision/catalogos/conductores"
                          parseResult={parseConductorResult}
                          onSelect={handleSelectConductor}
                          onAddNew={() => setShowConductorDialog(true)}
                          selectedItems={selectedConductores}
                          onRemoveItem={(id) =>
                            removeSelectedById(setSelectedConductores, id)
                          }
                          disabled={saving}
                          eagerLoad
                        />
                        <div className="h-px bg-border" />
                        <EntitySmartSearch<CatalogoVehiculo>
                          label="Placa del vehiculo"
                          placeholder="Haz click para ver disponibles o escribe para buscar..."
                          searchEndpoint="/api/guia-remision/catalogos/vehiculos"
                          parseResult={parseVehiculoResult}
                          onSelect={handleSelectVehiculo}
                          onAddNew={() => setShowVehiculoDialog(true)}
                          selectedItems={selectedVehiculos}
                          onRemoveItem={(id) =>
                            removeSelectedById(setSelectedVehiculos, id)
                          }
                          disabled={saving}
                          eagerLoad
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {supportsDocumentosRelacionados ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Documento relacionado</CardTitle>
                    <CardDescription>
                      {requiresDocumentoRelacionado
                        ? "Obligatorio para este motivo."
                        : "Opcional para sustentar la operacion."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {supportsVentaAutocomplete ? (
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <div className="grid gap-2 md:grid-cols-[120px_1fr_1fr_auto]">
                          <select
                            value={ventaSearch.tipoDocumento}
                            onChange={(event) =>
                              setVentaSearchField(
                                "tipoDocumento",
                                event.target.value as "01" | "03"
                              )
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="01">Factura</option>
                            <option value="03">Boleta</option>
                          </select>
                          <Input
                            value={ventaSearch.serie}
                            onChange={(event) =>
                              setVentaSearchField(
                                "serie",
                                event.target.value.toUpperCase().slice(0, 4)
                              )
                            }
                            placeholder="F001"
                            className="uppercase"
                          />
                          <Input
                            value={ventaSearch.numero}
                            onChange={(event) =>
                              setVentaSearchField(
                                "numero",
                                event.target.value.replace(/\D/g, "").slice(0, 8)
                              )
                            }
                            placeholder="00001234"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              void handleAutocompletarDesdeVenta()
                            }}
                            disabled={loadingVentaAutocomplete}
                          >
                            {loadingVentaAutocomplete ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <MagnifyingGlassIcon className="h-4 w-4" />
                            )}
                            Buscar venta
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-2 md:grid-cols-[150px_1fr_1fr_auto]">
                      <select
                        value={documentoDraft.tipoDocumento}
                        onChange={(event) =>
                          setDocumentoDraftField("tipoDocumento", event.target.value)
                        }
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="01">Factura</option>
                        <option value="03">Boleta</option>
                        <option value="04">Liquidacion compra</option>
                      </select>
                      <Input
                        value={documentoDraft.serie}
                        onChange={(event) =>
                          setDocumentoDraftField(
                            "serie",
                            event.target.value.toUpperCase().slice(0, 4)
                          )
                        }
                        placeholder="Serie"
                        className="uppercase"
                      />
                      <Input
                        value={documentoDraft.numero}
                        onChange={(event) =>
                          setDocumentoDraftField(
                            "numero",
                            event.target.value.replace(/\D/g, "").slice(0, 8)
                          )
                        }
                        placeholder="Numero"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addDocumentoRelacionado(documentoDraft)}
                      >
                        <PlusIcon className="h-4 w-4" />
                        {documentosRelacionados.length > 0 ? "Reemplazar" : "Agregar"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solo se permite un documento relacionado para esta GRE remitente.
                    </p>

                    {documentosRelacionados.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {documentosRelacionados.map((documento) => (
                          <span
                            key={`${documento.tipoDocumento}-${documento.serie}-${documento.numero}`}
                            className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium"
                          >
                            {formatDocumentoRelacionado(documento)}
                            <button
                              type="button"
                              onClick={() => removeDocumentoRelacionado(documento)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Quitar documento relacionado"
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Aun no hay documento relacionado agregado.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Fila inferior: Ruta de traslado (ancho completo) */}
              <Card>

                <CardContent>
                  {sucursalesSinCodigo > 0 && !loadingSucursales ? (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
                      {sucursalesSinCodigo}{" "}
                      {sucursalesSinCodigo === 1 ? "sucursal activa no aparece" : "sucursales activas no aparecen"} porque{" "}
                      {sucursalesSinCodigo === 1 ? "no tiene" : "no tienen"} codigo de establecimiento SUNAT configurado.
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                    {/* Partida */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          A
                        </span>
                        <label className="text-sm font-medium">
                          Punto de partida
                        </label>
                      </div>
                      {!isMotivoTrasladoInterno ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPartidaModo("sucursal")
                              if (!form.idSucursalPartida && userSucursalId) {
                                setField("idSucursalPartida", userSucursalId)
                              }
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                              !isPartidaExterna
                                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Sucursal propia
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPartidaModo("externa")
                              setField("idSucursalPartida", null)
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                              isPartidaExterna
                                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Direccion externa
                          </button>
                        </div>
                      ) : null}
                      {!isPartidaExterna ? (
                        <Combobox
                          value={form.idSucursalPartida ? String(form.idSucursalPartida) : ""}
                          options={partidaOptions}
                          searchValue={searchSucursalPartida}
                          onSearchValueChange={setSearchSucursalPartida}
                          onValueChange={(value) =>
                            setField("idSucursalPartida", value ? Number(value) : null)
                          }
                          placeholder="Selecciona sucursal"
                          searchPlaceholder="Buscar sucursal..."
                          loading={loadingSucursales}
                          disabled={!isAdmin && !isMultiSucursalNonAdmin && isMotivoTrasladoInterno}
                        />
                      ) : null}
                      {!isPartidaExterna && selectedPartida ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedPartida.ciudad || "Sin ciudad"} ·{" "}
                          {selectedPartida.direccion || "Sin direccion"}
                          {selectedPartida.ubigeo ? (
                            <> · <span className="font-mono">{selectedPartida.ubigeo}</span></>
                          ) : null}
                          {selectedPartida.codigoEstablecimientoSunat ? (
                            <> · Cod. SUNAT: <span className="font-mono">{selectedPartida.codigoEstablecimientoSunat}</span></>
                          ) : null}
                        </p>
                      ) : isPartidaExterna ? (
                        <div className="grid gap-2">
                          <GuiaUbigeoFields
                            enabled={isPartidaExterna}
                            idPrefix="guia-partida"
                            value={{
                              ubigeo: form.ubigeoPartida,
                              departamento: form.departamentoPartida,
                              provincia: form.provinciaPartida,
                              distrito: form.distritoPartida,
                            }}
                            onChange={(next) =>
                              setForm((current) => ({
                                ...current,
                                ubigeoPartida: next.ubigeo,
                                departamentoPartida: next.departamento,
                                provinciaPartida: next.provincia,
                                distritoPartida: next.distrito,
                              }))
                            }
                          />
                          <Input
                            value={form.direccionPartida}
                            onChange={(e) => setField("direccionPartida", e.target.value)}
                            placeholder="Direccion completa de partida"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Flecha central */}
                    <div className="hidden items-center justify-center pt-6 md:flex">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm">
                        <ArrowRightIcon className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Llegada */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          B
                        </span>
                        <label className="text-sm font-medium">
                          Punto de llegada
                        </label>
                      </div>
                      {!isMotivoTrasladoInterno ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLlegadaModo("sucursal")
                              if (!form.idSucursalLlegada && userSucursalId) {
                                setField("idSucursalLlegada", userSucursalId)
                              }
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                              !isLlegadaExterna
                                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Sucursal propia
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLlegadaModo("externa")
                              setField("idSucursalLlegada", null)
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                              isLlegadaExterna
                                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Direccion externa
                          </button>
                        </div>
                      ) : null}
                      {!isLlegadaExterna ? (
                        <Combobox
                          value={form.idSucursalLlegada ? String(form.idSucursalLlegada) : ""}
                          options={llegadaOptions}
                          searchValue={searchSucursalLlegada}
                          onSearchValueChange={setSearchSucursalLlegada}
                          onValueChange={(value) =>
                            setField("idSucursalLlegada", value ? Number(value) : null)
                          }
                          placeholder="Selecciona sucursal"
                          searchPlaceholder="Buscar sucursal..."
                          loading={loadingSucursales}
                        />
                      ) : null}
                      {!isLlegadaExterna && selectedLlegada ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedLlegada.ciudad || "Sin ciudad"} ·{" "}
                          {selectedLlegada.direccion || "Sin direccion"}
                          {selectedLlegada.ubigeo ? (
                            <> · <span className="font-mono">{selectedLlegada.ubigeo}</span></>
                          ) : null}
                          {selectedLlegada.codigoEstablecimientoSunat ? (
                            <> · Cod. SUNAT: <span className="font-mono">{selectedLlegada.codigoEstablecimientoSunat}</span></>
                          ) : null}
                        </p>
                      ) : isLlegadaExterna ? (
                        <div className="grid gap-2">
                          <GuiaUbigeoFields
                            enabled={isLlegadaExterna}
                            idPrefix="guia-llegada"
                            value={{
                              ubigeo: form.ubigeoLlegada,
                              departamento: form.departamentoLlegada,
                              provincia: form.provinciaLlegada,
                              distrito: form.distritoLlegada,
                            }}
                            onChange={(next) =>
                              setForm((current) => ({
                                ...current,
                                ubigeoLlegada: next.ubigeo,
                                departamentoLlegada: next.departamento,
                                provinciaLlegada: next.provincia,
                                distritoLlegada: next.distrito,
                              }))
                            }
                          />
                          <Input
                            value={form.direccionLlegada}
                            onChange={(e) => setField("direccionLlegada", e.target.value)}
                            placeholder="Direccion completa de llegada"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {form.motivoTraslado !== "04" ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Destinatario</CardTitle>
                    <CardDescription>
                      {requiresDestinatario
                        ? "Obligatorio para este motivo."
                        : "Opcional si el receptor es la empresa emisora."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-[120px_1fr]">
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Tipo doc.</label>
                      <select
                        value={form.destinatarioTipoDoc}
                        onChange={(e) => {
                          clearDestinatarioLookupError()
                          setField("destinatarioTipoDoc", e.target.value as "6" | "1")
                        }}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="6">RUC</option>
                        <option value="1">DNI</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Numero documento</label>
                      <div className="flex gap-2">
                        <Input
                          value={form.destinatarioNroDoc}
                          onChange={(e) => {
                            clearDestinatarioLookupError()
                            setField(
                              "destinatarioNroDoc",
                              e.target.value.replace(/\D/g, "").slice(0, 11)
                            )
                          }}
                          placeholder="20123456789"
                          maxLength={11}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => {
                            void handleLookupDestinatarioRuc()
                          }}
                          disabled={!canLookupDestinatarioRuc || lookingDestinatario}
                        >
                          {lookingDestinatario ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <MagnifyingGlassIcon className="h-4 w-4" />
                          )}
                          Buscar
                        </Button>
                      </div>
                      {destinatarioLookupError ? (
                        <p className="text-xs text-red-500">{destinatarioLookupError}</p>
                      ) : form.destinatarioTipoDoc === "6" ? (
                        <p className="">
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium">Razon social o nombres</label>
                      <Input
                        value={form.destinatarioRazonSocial}
                        onChange={(e) => setField("destinatarioRazonSocial", e.target.value)}
                        placeholder="TALLER TEXTIL LIMA SAC"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Validation + actions */}
              {generalValidationMessage ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
                  {generalValidationMessage}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                  La guia esta lista para registrarse.
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {saving ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Guardando guia...
                    </>
                  ) : (
                    "Registrar guia de remision remitente"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild className="w-full">
                  <Link href="/ventas/guia-remision">Cancelar</Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
