"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  TicketIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ClienteCreateDialog } from "@/components/clientes/modals/ClienteCreateDialog"
import CatalogViewToggle from "@/components/ventas/CatalogViewToggle"
import CategoryFilter from "@/components/ventas/CategoryFilter"
import CartItem, { type CartItemData } from "@/components/ventas/CartItem"
import ClientSelect, { type ClientSelection } from "@/components/ventas/ClientSelect"
import PaymentMethod, {
  type PaymentKey,
} from "@/components/ventas/PaymentMethod"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useAuth } from "@/lib/auth/auth-context"
import ProductCard from "@/components/ventas/ProductCard"
import ProductModal, { type SelectedVariant } from "@/components/ventas/ProductModal"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  buildCatalogVariantItems,
  buildCatalogVariantCartSelection,
  matchesCatalogVariantItem,
  type CatalogVariantItem,
  type CatalogVariantSelection,
  type CatalogViewMode,
} from "@/lib/catalog-view"
import { useCatalogoVariantes } from "@/lib/hooks/useCatalogoVariantes"
import { useCatalogViewMode } from "@/lib/hooks/useCatalogViewMode"
import { useClienteCreate } from "@/lib/hooks/useClienteCreate"
import { useComprobanteOptions } from "@/lib/hooks/useComprobanteOptions"
import { useMetodosPagoActivos } from "@/lib/hooks/useMetodosPagoActivos"
import { useProductos } from "@/lib/hooks/useProductos"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { getSucursalAvatarColor, getSucursalInitials } from "@/lib/sucursal"
import type { Categoria, PageResponse as CategoriaPageResponse } from "@/lib/types/categoria"
import type { Cliente, ClienteCreatePrefill } from "@/lib/types/cliente"
import type { Color, PageResponse as ColorPageResponse } from "@/lib/types/color"
import type { ProductoResumen } from "@/lib/types/producto"
import type { VentaLineaPrecioTipo } from "@/lib/types/venta-price"
import type { VentaCreateRequest, VentaInsertResponse } from "@/lib/types/venta"
import {
  appliesIgvForComprobante,
  calculateIncludedIgvAmount,
} from "@/lib/venta-tax"

const DEFAULT_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Generico" }
const DEFAULT_IGV_PORCENTAJE = 18

type DiscountMode = "none" | "percent" | "amount"
type DiscountTypeOption = { value: DiscountMode; label: string }

interface DiscountState {
  mode: DiscountMode
  value: string
}

const DISCOUNT_MODE_OPTIONS: DiscountTypeOption[] = [
  { value: "percent", label: "%" },
  { value: "amount", label: "S/" },
]

function createEmptyDiscountState(): DiscountState {
  return { mode: "none", value: "" }
}

function LiveClock() {
  const [time, setTime] = useState("")

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )

    tick()
    const intervalId = setInterval(tick, 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
      <ClockIcon className="h-3.5 w-3.5" />
      {time}
    </span>
  )
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 ${className}`}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {children}
    </p>
  )
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

interface CategoryFilterOption {
  id: number
  name: string
}

interface ColorFilterOption {
  id: number
  name: string
  hex: string | null | undefined
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function parseDiscountValue(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function getNormalizedDiscountValue(
  mode: DiscountMode,
  rawValue: number,
  subtotal: number
) {
  if (mode === "percent") {
    return Math.min(100, Math.max(0, rawValue))
  }

  if (mode === "amount") {
    return Math.min(subtotal, Math.max(0, rawValue))
  }

  return 0
}

function getDiscountAmount(
  mode: DiscountMode,
  normalizedValue: number,
  subtotal: number
) {
  if (mode === "percent") {
    return subtotal * (normalizedValue / 100)
  }

  if (mode === "amount") {
    return normalizedValue
  }

  return 0
}

function getDiscountType(mode: DiscountMode) {
  if (mode === "percent") return "PORCENTAJE" as const
  if (mode === "amount") return "MONTO" as const
  return null
}

function mapColorFilters(payload: unknown): ColorFilterOption[] {
  const pageData = payload as ColorPageResponse<Color> | null
  const content = Array.isArray(pageData?.content) ? pageData.content : []

  return content
    .filter((color) => {
      if (typeof color?.idColor !== "number" || color.idColor <= 0) return false
      const estado = String(color?.estado ?? "").trim().toUpperCase()
      return !estado || estado === "ACTIVO"
    })
    .map((color) => {
      const name = color.nombre?.trim()
      return {
        id: color.idColor,
        name: name && name.length > 0 ? name : `Color #${color.idColor}`,
        hex: color.codigo,
      }
    })
}

function mapCategoryFilters(payload: unknown): CategoryFilterOption[] {
  const pageData = payload as CategoriaPageResponse<Categoria> | null
  const content = Array.isArray(pageData?.content) ? pageData.content : []

  return content
    .filter((categoria) => {
      if (typeof categoria?.idCategoria !== "number" || categoria.idCategoria <= 0) {
        return false
      }
      const estado = String(categoria?.estado ?? "").trim().toUpperCase()
      return !estado || estado === "ACTIVO"
    })
    .map((categoria) => {
      const name = categoria.nombreCategoria?.trim()
      return {
        id: categoria.idCategoria,
        name: name && name.length > 0 ? name : `Categoria #${categoria.idCategoria}`,
      }
    })
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function extractVentaInsertResponse(payload: unknown): VentaInsertResponse | null {
  const source = asRecord(payload)
  if (!source) return null

  const nestedCandidates = [source.response, source.data, source.venta]
    .map((value) => asRecord(value))
    .filter((value): value is Record<string, unknown> => value !== null)

  const candidates = [source, ...nestedCandidates]

  for (const candidate of candidates) {
    const idVenta = Number(candidate.idVenta ?? candidate.id_venta ?? candidate.id)
    if (!Number.isFinite(idVenta) || idVenta <= 0) continue

    return {
      idVenta,
      sunatEstado:
        typeof candidate.sunatEstado === "string" && candidate.sunatEstado.trim()
          ? candidate.sunatEstado
          : null,
      sunatXmlNombre:
        typeof candidate.sunatXmlNombre === "string" && candidate.sunatXmlNombre.trim()
          ? candidate.sunatXmlNombre
          : null,
      sunatZipNombre:
        typeof candidate.sunatZipNombre === "string" && candidate.sunatZipNombre.trim()
          ? candidate.sunatZipNombre
          : null,
      sunatCdrNombre:
        typeof candidate.sunatCdrNombre === "string" && candidate.sunatCdrNombre.trim()
          ? candidate.sunatCdrNombre
          : null,
      sunatAutoDispatchTriggered:
        typeof candidate.sunatAutoDispatchTriggered === "boolean"
          ? candidate.sunatAutoDispatchTriggered
          : undefined,
      sunatAutoDispatchError:
        typeof candidate.sunatAutoDispatchError === "string" &&
        candidate.sunatAutoDispatchError.trim()
          ? candidate.sunatAutoDispatchError
          : null,
    }
  }

  return null
}

function buildVentaDetalleDescripcion(item: CartItemData): string {
  const parts = [item.nombre.trim(), item.color.trim(), item.talla.trim()].filter(Boolean)
  return parts.join(" ").trim() || item.nombre
}

function normalizeStockLimit(stockDisponible?: number | null) {
  if (typeof stockDisponible !== "number" || !Number.isFinite(stockDisponible)) {
    return null
  }

  return Math.max(0, Math.trunc(stockDisponible))
}

function hasAvailableStock(stockDisponible?: number | null) {
  const stockLimit = normalizeStockLimit(stockDisponible)
  return stockLimit === null || stockLimit > 0
}

function clampCartQuantity(cantidad: number, stockDisponible?: number | null) {
  const normalizedQuantity = Math.max(1, Math.trunc(cantidad))
  const stockLimit = normalizeStockLimit(stockDisponible)

  if (stockLimit === null || stockLimit < 1) {
    return normalizedQuantity
  }

  return Math.min(normalizedQuantity, stockLimit)
}

export default function VentasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const [catalogViewMode, setCatalogViewMode] = useCatalogViewMode()
  const isVariantView = catalogViewMode === "variantes"

  const {
    search: searchProductos,
    setSearch: setSearchProductos,
    idCategoriaFilter: idCategoriaFilterProductos,
    idColorFilter: idColorFilterProductos,
    setIdCategoriaFilter: setIdCategoriaFilterProductos,
    setIdColorFilter: setIdColorFilterProductos,
    displayedProductos,
    displayedTotalElements: displayedTotalElementsProductos,
    displayedTotalPages: displayedTotalPagesProductos,
    displayedPage: displayedPageProductos,
    displayedLoading: displayedLoadingProductos,
    setDisplayedPage: setDisplayedPageProductos,
    error: errorProductosListado,
    refreshCurrentView: refreshProductosView,
  } = useProductos(!isVariantView)
  const {
    search: searchVariantes,
    setSearch: setSearchVariantes,
    idCategoriaFilter: idCategoriaFilterVariantes,
    idColorFilter: idColorFilterVariantes,
    setIdCategoriaFilter: setIdCategoriaFilterVariantes,
    setIdColorFilter: setIdColorFilterVariantes,
    displayedCatalogVariants,
    displayedTotalElements: displayedTotalElementsVariantes,
    displayedTotalPages: displayedTotalPagesVariantes,
    displayedPage: displayedPageVariantes,
    displayedLoading: displayedLoadingVariantes,
    setDisplayedPage: setDisplayedPageVariantes,
    error: errorVariantesListado,
    refreshCurrentView: refreshVariantesView,
  } = useCatalogoVariantes(isVariantView)

  const [cart, setCart] = useState<CartItemData[]>([])
  const [selectedPayment, setSelectedPayment] = useState<PaymentKey | null>(null)
  const [paymentOperationCode, setPaymentOperationCode] = useState("")
  const [selectedClient, setSelectedClient] = useState<ClientSelection>(DEFAULT_CLIENT)
  const [clientCreatePrefill, setClientCreatePrefill] = useState<ClienteCreatePrefill | null>(null)
  const [isClientCreateOpen, setIsClientCreateOpen] = useState(false)
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false)
  const [discount, setDiscount] = useState<DiscountState>(() => createEmptyDiscountState())
  const [discountDraft, setDiscountDraft] = useState<DiscountState>(() => createEmptyDiscountState())
  const [isDiscountEditorActive, setIsDiscountEditorActive] = useState(false)
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [selectedComprobanteId, setSelectedComprobanteId] = useState("")
  const [modalProduct, setModalProduct] = useState<ProductoResumen | null>(null)
  const [modalVariantSelection, setModalVariantSelection] =
    useState<CatalogVariantSelection | null>(null)
  const [submittingVenta, setSubmittingVenta] = useState(false)
  const [ventaError, setVentaError] = useState<string | null>(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoryFilterOption[]>([])
  const [categoryPage, setCategoryPage] = useState(0)
  const [categoryTotalPages, setCategoryTotalPages] = useState(1)
  const [coloresDisponibles, setColoresDisponibles] = useState<ColorFilterOption[]>([])
  const [colorPage, setColorPage] = useState(0)
  const [colorTotalPages, setColorTotalPages] = useState(1)

  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)
  const { createCliente } = useClienteCreate({
    successMessage: "Cliente creado y seleccionado",
  })

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await authFetch(`/api/categoria/listar?page=${categoryPage}`)
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          setCategoriasDisponibles([])
          setCategoryTotalPages(1)
          return
        }

        const pageData = data as CategoriaPageResponse<Categoria> | null
        const totalPages =
          typeof pageData?.totalPages === "number" && pageData.totalPages > 0
            ? pageData.totalPages
            : 1

        if (categoryPage > totalPages - 1) {
          setCategoryPage(Math.max(0, totalPages - 1))
          return
        }

        setCategoriasDisponibles(mapCategoryFilters(data))
        setCategoryTotalPages(totalPages)
      } catch {
        setCategoriasDisponibles([])
        setCategoryTotalPages(1)
      }
    }

    void fetchCategorias()
  }, [categoryPage])

  useEffect(() => {
    const fetchColores = async () => {
      try {
        const response = await authFetch(`/api/color/listar?page=${colorPage}`)
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          setColoresDisponibles([])
          setColorTotalPages(1)
          return
        }

        const pageData = data as ColorPageResponse<Color> | null
        const totalPages =
          typeof pageData?.totalPages === "number" && pageData.totalPages > 0
            ? pageData.totalPages
            : 1

        if (colorPage > totalPages - 1) {
          setColorPage(Math.max(0, totalPages - 1))
          return
        }

        setColoresDisponibles(mapColorFilters(data))
        setColorTotalPages(totalPages)
      } catch {
        setColoresDisponibles([])
        setColorTotalPages(1)
      }
    }

    void fetchColores()
  }, [colorPage])

  const defaultAdminSucursalId =
    isAdmin && hasValidSucursalId(user?.idSucursal) ? user.idSucursal : null
  const effectiveSelectedSucursalId = hasValidSucursalId(selectedSucursalId)
    ? selectedSucursalId
    : defaultAdminSucursalId
  const hasSelectedSucursal = hasValidSucursalId(effectiveSelectedSucursalId)

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasSelectedSucursal &&
      !sucursalOptions.some(
        (option) => option.value === String(effectiveSelectedSucursalId)
      )
        ? [
            {
              value: String(effectiveSelectedSucursalId),
              label: `Sucursal #${effectiveSelectedSucursalId}`,
              avatarText: getSucursalInitials("Sucursal"),
              avatarClassName: getSucursalAvatarColor(effectiveSelectedSucursalId),
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [effectiveSelectedSucursalId, hasSelectedSucursal, sucursalOptions]
  )

  const resolvedSucursalId = isAdmin
    ? hasSelectedSucursal
      ? effectiveSelectedSucursalId
      : null
    : userHasSucursal
      ? user?.idSucursal ?? null
      : null

  const {
    comprobantes,
    comprobanteOptions,
    loadingComprobantes,
    errorComprobantes,
    searchComprobante,
    setSearchComprobante,
  } = useComprobanteOptions({
    enabled: true,
    idSucursal: resolvedSucursalId,
  })
  const {
    methods: activeMetodosPago,
  } = useMetodosPagoActivos()

  const effectiveSelectedComprobanteId = useMemo(() => {
    if (comprobanteOptions.length === 0) return ""
    const exists = comprobanteOptions.some(
      (option) => option.value === selectedComprobanteId
    )
    return exists ? selectedComprobanteId : comprobanteOptions[0].value
  }, [comprobanteOptions, selectedComprobanteId])

  const selectedComprobante = useMemo(
    () =>
      comprobantes.find(
        (item) => String(item.idComprobante) === effectiveSelectedComprobanteId
      ) ?? null,
    [comprobantes, effectiveSelectedComprobanteId]
  )
  const showIgvSummary = useMemo(
    () => appliesIgvForComprobante(selectedComprobante?.tipoComprobante),
    [selectedComprobante?.tipoComprobante]
  )
  const safeCategoryPage = Math.max(
    0,
    Math.min(categoryPage, Math.max(0, categoryTotalPages - 1))
  )
  const canGoPrevCategoryPage = safeCategoryPage > 0
  const canGoNextCategoryPage = safeCategoryPage < categoryTotalPages - 1

  const handleNextCategoryPage = useCallback(() => {
    if (!canGoNextCategoryPage) return
    setCategoryPage((previous) => previous + 1)
  }, [canGoNextCategoryPage])

  const handlePrevCategoryPage = useCallback(() => {
    if (!canGoPrevCategoryPage) return
    setCategoryPage((previous) => Math.max(0, previous - 1))
  }, [canGoPrevCategoryPage])

  const safeColorPage = Math.max(0, Math.min(colorPage, Math.max(0, colorTotalPages - 1)))
  const canGoPrevColorPage = safeColorPage > 0
  const canGoNextColorPage = safeColorPage < colorTotalPages - 1

  const handleNextColorPage = useCallback(() => {
    if (!canGoNextColorPage) return
    setColorPage((previous) => previous + 1)
  }, [canGoNextColorPage])

  const handlePrevColorPage = useCallback(() => {
    if (!canGoPrevColorPage) return
    setColorPage((previous) => Math.max(0, previous - 1))
  }, [canGoPrevColorPage])

  const productViewVariantItems = useMemo(
    () => buildCatalogVariantItems(displayedProductos),
    [displayedProductos]
  )
  const search = isVariantView ? searchVariantes : searchProductos
  const idCategoriaFilter = isVariantView ? idCategoriaFilterVariantes : idCategoriaFilterProductos
  const idColorFilter = isVariantView ? idColorFilterVariantes : idColorFilterProductos
  const displayedTotalElements = isVariantView
    ? displayedTotalElementsVariantes
    : displayedTotalElementsProductos
  const displayedTotalPages = isVariantView
    ? displayedTotalPagesVariantes
    : displayedTotalPagesProductos
  const displayedPage = isVariantView ? displayedPageVariantes : displayedPageProductos
  const displayedLoading = isVariantView ? displayedLoadingVariantes : displayedLoadingProductos
  const errorProductos = isVariantView ? errorVariantesListado : errorProductosListado
  const refreshCurrentView = isVariantView ? refreshVariantesView : refreshProductosView
  const visibleCatalogCount = isVariantView
    ? displayedCatalogVariants.length
    : displayedProductos.length

  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)
  const parsedDiscountValue = parseDiscountValue(discount.value)
  const normalizedDiscountValue = useMemo(
    () => getNormalizedDiscountValue(discount.mode, parsedDiscountValue, subtotal),
    [discount.mode, parsedDiscountValue, subtotal]
  )
  const discountAmount = useMemo(() => {
    return getDiscountAmount(discount.mode, normalizedDiscountValue, subtotal)
  }, [discount.mode, normalizedDiscountValue, subtotal])
  const total = Math.max(0, subtotal - discountAmount)
  const payloadDiscountValue = normalizedDiscountValue
  const payloadDiscountType = useMemo(() => {
    return payloadDiscountValue > 0 ? getDiscountType(discount.mode) : null
  }, [discount.mode, payloadDiscountValue])
  const parsedDiscountDraftValue = parseDiscountValue(discountDraft.value)
  const normalizedDiscountDraftValue = useMemo(
    () => getNormalizedDiscountValue(discountDraft.mode, parsedDiscountDraftValue, subtotal),
    [discountDraft.mode, parsedDiscountDraftValue, subtotal]
  )
  const discountDraftAmount = useMemo(() => {
    return getDiscountAmount(discountDraft.mode, normalizedDiscountDraftValue, subtotal)
  }, [discountDraft.mode, normalizedDiscountDraftValue, subtotal])
  const draftTotal = Math.max(0, subtotal - discountDraftAmount)
  const visibleDiscountAmount = isDiscountEditorActive ? discountDraftAmount : discountAmount
  const selectedMetodoPago = useMemo(() => {
    if (!selectedPayment || !activeMetodosPago) return null
    return activeMetodosPago.find((method) => method.nombre === selectedPayment) ?? null
  }, [activeMetodosPago, selectedPayment])
  const canContinueToPayment =
    cart.length > 0 &&
    resolvedSucursalId !== null &&
    selectedComprobante !== null
  const canConfirm = canContinueToPayment && selectedPayment !== null && selectedMetodoPago !== null

  const continueHint = useMemo(() => {
    if (cart.length === 0) return "Agrega al menos una variante"
    if (resolvedSucursalId === null) {
      return isAdmin
        ? "Selecciona una sucursal"
        : "Tu usuario no tiene sucursal asignada"
    }
    if (selectedComprobante === null) {
      if (loadingComprobantes) return "Cargando tipos de comprobante..."
      if (errorComprobantes) return errorComprobantes
      return "Selecciona un tipo de comprobante"
    }
    return ""
  }, [
    cart.length,
    isAdmin,
    loadingComprobantes,
    errorComprobantes,
    resolvedSucursalId,
    selectedComprobante,
  ])
  const paymentHint = useMemo(() => {
    if (!activeMetodosPago) return "Cargando metodos de pago..."
    if (activeMetodosPago.length === 0) return "No hay metodos de pago activos"
    if (selectedPayment === null) return "Selecciona un metodo de pago"
    if (selectedMetodoPago === null) return "Selecciona un metodo de pago valido"
    return ""
  }, [activeMetodosPago, selectedMetodoPago, selectedPayment])
  const isPaymentStepActive = isPaymentDrawerOpen
  const footerTotal = isDiscountEditorActive && !isPaymentStepActive ? draftTotal : total
  const footerIgv = useMemo(
    () => calculateIncludedIgvAmount(footerTotal, DEFAULT_IGV_PORCENTAJE),
    [footerTotal]
  )
  const isPrimaryActionDisabled = isPaymentStepActive
    ? !canConfirm || submittingVenta
    : !canContinueToPayment || submittingVenta
  const primaryActionHint = isPaymentStepActive ? paymentHint : continueHint

  const handleSearchChange = useCallback(
    (value: string) => {
      if (isVariantView) {
        setSearchVariantes(value)
        return
      }

      setSearchProductos(value)
    },
    [isVariantView, setSearchProductos, setSearchVariantes]
  )

  const handleCategoriaFilterChange = useCallback(
    (value: number | null) => {
      if (isVariantView) {
        setIdCategoriaFilterVariantes(value)
        return
      }

      setIdCategoriaFilterProductos(value)
    },
    [
      isVariantView,
      setIdCategoriaFilterProductos,
      setIdCategoriaFilterVariantes,
    ]
  )

  const handleColorFilterChange = useCallback(
    (value: number | null) => {
      if (isVariantView) {
        setIdColorFilterVariantes(value)
        return
      }

      setIdColorFilterProductos(value)
    },
    [isVariantView, setIdColorFilterProductos, setIdColorFilterVariantes]
  )

  const handleDisplayedPageChange = useCallback(
    (value: number | ((previous: number) => number)) => {
      if (isVariantView) {
        setDisplayedPageVariantes(value)
        return
      }

      setDisplayedPageProductos(value)
    },
    [isVariantView, setDisplayedPageProductos, setDisplayedPageVariantes]
  )

  const closeModal = useCallback(() => {
    setModalProduct(null)
    setModalVariantSelection(null)
  }, [])

  const openProductModal = useCallback((producto: ProductoResumen) => {
    setModalVariantSelection(null)
    setModalProduct(producto)
    setVentaError(null)
  }, [])

  const handleClientCreateOpenChange = useCallback((open: boolean) => {
    setIsClientCreateOpen(open)
    if (!open) {
      setClientCreatePrefill(null)
    }
  }, [])

  const handleClientCreateRequest = useCallback((prefill: ClienteCreatePrefill) => {
    setClientCreatePrefill({
      ...prefill,
      idSucursal: resolvedSucursalId,
    })
    setIsClientCreateOpen(true)
    setVentaError(null)
  }, [resolvedSucursalId])

  const handleClientCreated = useCallback((client: Cliente) => {
    setSelectedClient({
      idCliente: client.idCliente,
      nombre: client.nombres,
    })
    setVentaError(null)
  }, [])

  const handleEditItem = useCallback((item: CartItemData) => {
    const matchedVariant =
      displayedCatalogVariants.find((variant) => matchesCatalogVariantItem(item, variant)) ??
      productViewVariantItems.find((variant) => matchesCatalogVariantItem(item, variant)) ??
      null
    const producto =
      displayedProductos.find((candidate) => candidate.idProducto === item.id) ??
      matchedVariant?.product ??
      null

    if (!producto) {
      setVentaError("No se encontro el producto para editar la variante.")
      return
    }

    setCart((previous) =>
      previous.filter((current) => {
        if (item.varianteId && current.varianteId) {
          return current.varianteId !== item.varianteId
        }

        return !(
          current.id === item.id &&
          current.talla === item.talla &&
          current.color === item.color
        )
      })
    )

    setModalVariantSelection(matchedVariant?.selection ?? null)
    setModalProduct(producto)
    setVentaError(null)
  }, [displayedCatalogVariants, displayedProductos, productViewVariantItems])

  const addVariantToCart = useCallback((variant: SelectedVariant) => {
    if (!hasAvailableStock(variant.stockDisponible)) {
      setVentaError("La variante seleccionada no tiene stock disponible.")
      return
    }

    setCart((previous) => {
      const index = previous.findIndex((item) => item.varianteId === variant.varianteId)

      if (index >= 0) {
        return previous.map((item, idx) => {
          if (idx !== index) return item

          const stockDisponible = variant.stockDisponible ?? item.stockDisponible ?? null

          return {
            ...item,
            cantidad: clampCartQuantity(item.cantidad + variant.cantidad, stockDisponible),
            precio: variant.precio,
            precioSeleccionado: variant.precioSeleccionado,
            preciosDisponibles: variant.preciosDisponibles,
            stockDisponible,
            imageUrl: variant.imageUrl ?? item.imageUrl ?? null,
          }
        })
      }

      return [
        ...previous,
        {
          id: variant.id,
          varianteId: variant.varianteId,
          nombre: variant.nombre,
          precio: variant.precio,
          precioSeleccionado: variant.precioSeleccionado,
          preciosDisponibles: variant.preciosDisponibles,
          cantidad: clampCartQuantity(variant.cantidad, variant.stockDisponible),
          stockDisponible: variant.stockDisponible,
          talla: variant.talla,
          color: variant.color,
          imageUrl: variant.imageUrl ?? null,
        },
      ]
    })
    setVentaError(null)
  }, [])

  const handleSelectCatalogVariant = useCallback((variant: CatalogVariantItem) => {
    if (!variant.variantId || variant.variantId <= 0) {
      setVentaError("La variante seleccionada no tiene un identificador valido.")
      return
    }

    const nextItem = buildCatalogVariantCartSelection(variant)

    if (!hasAvailableStock(nextItem.stockDisponible)) {
      setVentaError("La variante seleccionada no tiene stock disponible.")
      return
    }

    setCart((previous) => {
      const index = previous.findIndex((item) => item.varianteId === nextItem.varianteId)

      if (index >= 0) {
        return previous.map((item, idx) => {
          if (idx !== index) return item

          const stockDisponible = nextItem.stockDisponible ?? item.stockDisponible ?? null

          return {
            ...item,
            cantidad: clampCartQuantity(item.cantidad + 1, stockDisponible),
            precioSeleccionado: item.precioSeleccionado ?? nextItem.precioSeleccionado,
            preciosDisponibles: item.preciosDisponibles ?? nextItem.preciosDisponibles,
            stockDisponible,
            imageUrl: item.imageUrl ?? nextItem.imageUrl ?? null,
          }
        })
      }

      return [...previous, nextItem]
    })
    setVentaError(null)
  }, [])

  const handleSelectCartItemPrice = useCallback(
    (targetItem: CartItemData, priceType: VentaLineaPrecioTipo) => {
      setCart((previous) =>
        previous.map((item) => {
          const isSameItem =
            targetItem.varianteId && item.varianteId
              ? item.varianteId === targetItem.varianteId
              : item.id === targetItem.id &&
                item.talla === targetItem.talla &&
                item.color === targetItem.color

          if (!isSameItem) return item

          const selectedOption =
            item.preciosDisponibles?.find((option) => option.type === priceType) ?? null

          if (!selectedOption) return item

          return {
            ...item,
            precio: selectedOption.precio,
            precioSeleccionado: priceType,
          }
        })
      )
      setVentaError(null)
    },
    []
  )

  const updateQty = useCallback(
    (id: number, talla: string, color: string, delta: number, varianteId?: number) => {
      setCart((previous) =>
        previous.map((item) => {
          const isSameItem =
            varianteId && item.varianteId
              ? item.varianteId === varianteId
              : item.id === id && item.talla === talla && item.color === color

          if (!isSameItem) return item
          const nextQuantity =
            delta > 0
              ? clampCartQuantity(item.cantidad + delta, item.stockDisponible)
              : Math.max(1, item.cantidad + delta)

          return { ...item, cantidad: nextQuantity }
        })
      )
    },
    []
  )

  const removeFromCart = useCallback(
    (id: number, talla: string, color: string, varianteId?: number) => {
      setCart((previous) =>
        previous.filter((item) => {
          if (varianteId && item.varianteId) {
            return item.varianteId !== varianteId
          }

          return !(item.id === id && item.talla === talla && item.color === color)
        })
      )
    },
    []
  )

  const handleOpenDiscountEditor = useCallback(() => {
    setDiscountDraft(
      discount.mode === "none"
        ? {
            mode: "percent",
            value: "",
          }
        : { ...discount }
    )
    setIsDiscountEditorActive(true)
    setVentaError(null)
  }, [discount])

  const handleDiscountDraftModeChange = useCallback((mode: DiscountMode) => {
    setDiscountDraft((previous) => ({
      mode,
      value: previous.value,
    }))
    setVentaError(null)
  }, [])

  const handleDiscountDraftValueChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDiscountDraft((previous) => ({
      ...previous,
      value: event.target.value,
    }))
    setVentaError(null)
  }, [])

  const handlePaymentOperationCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPaymentOperationCode(event.target.value)
      setVentaError(null)
    },
    []
  )

  const commitDiscountDraft = useCallback(() => {
    if (normalizedDiscountDraftValue <= 0) {
      setDiscount(createEmptyDiscountState())
    } else {
      setDiscount({
        mode: discountDraft.mode,
        value: String(normalizedDiscountDraftValue),
      })
    }
    setIsDiscountEditorActive(false)
    setVentaError(null)
  }, [discountDraft.mode, normalizedDiscountDraftValue])

  const handleApplyDiscount = useCallback(() => {
    commitDiscountDraft()
  }, [commitDiscountDraft])

  const handleOpenPaymentDrawer = useCallback(() => {
    if (!canContinueToPayment || submittingVenta) return

    if (isDiscountEditorActive) {
      commitDiscountDraft()
    }

    setIsPaymentDrawerOpen(true)
    setVentaError(null)
  }, [
    canContinueToPayment,
    commitDiscountDraft,
    isDiscountEditorActive,
    submittingVenta,
  ])

  const handleReturnToCart = useCallback(() => {
    setIsPaymentDrawerOpen(false)
    setVentaError(null)
  }, [])

  const resetVentaDraft = useCallback(() => {
    setCart([])
    setSelectedPayment(null)
    setPaymentOperationCode("")
    setSelectedClient(DEFAULT_CLIENT)
    setIsPaymentDrawerOpen(false)
    setDiscount(createEmptyDiscountState())
    setDiscountDraft(createEmptyDiscountState())
    setIsDiscountEditorActive(false)
    setVentaError(null)
  }, [])

  const handleFinalizarVenta = useCallback(async () => {
    if (!canConfirm || submittingVenta || !selectedPayment) return

    const invalidItem = cart.find(
      (item) => typeof item.varianteId !== "number" || item.varianteId <= 0
    )

    if (invalidItem) {
      setVentaError(
        `El item \"${invalidItem.nombre}\" no tiene idProductoVariante valido. Vuelve a seleccionarlo.`
      )
      return
    }

    if (!resolvedSucursalId) {
      setVentaError("Debe seleccionar una sucursal para registrar la venta.")
      return
    }

    if (!selectedMetodoPago) {
      setVentaError("Debe seleccionar un metodo de pago valido.")
      return
    }

    if (!selectedComprobante) {
      setVentaError("Debe seleccionar un tipo de comprobante valido.")
      return
    }

    setSubmittingVenta(true)
    setVentaError(null)
    const ventaPromise = (async () => {
      const body: VentaCreateRequest = {
        idSucursal: resolvedSucursalId,
        idCliente: selectedClient.idCliente,
        tipoComprobante: selectedComprobante.tipoComprobante,
        moneda: "PEN",
        formaPago: "CONTADO",
        igvPorcentaje: DEFAULT_IGV_PORCENTAJE,
        descuentoTotal: payloadDiscountValue,
        tipoDescuento: payloadDiscountType,
        detalles: cart.map((item) => ({
          idProductoVariante: item.varianteId as number,
          descripcion: buildVentaDetalleDescripcion(item),
          cantidad: item.cantidad,
          unidadMedida: "NIU",
          codigoTipoAfectacionIgv: "10",
          precioUnitario: item.precio,
          descuento: 0,
        })),
        pagos: [
          {
            idMetodoPago: selectedMetodoPago.idMetodoPago,
            monto: total,
            codigoOperacion: paymentOperationCode.trim() || null,
          },
        ],
      }

      const response = await authFetch("/api/venta/insertar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : data && typeof data === "object" && "error" in data && typeof data.error === "string"
              ? data.error
              : `Error ${response.status} al registrar la venta`
        throw new Error(message)
      }

      const ventaResponse = extractVentaInsertResponse(data)
      return {
        ventaId: ventaResponse?.idVenta ?? null,
        sunatEstado: ventaResponse?.sunatEstado ?? null,
        sunatAutoDispatchError: ventaResponse?.sunatAutoDispatchError ?? null,
      }
    })()

    toast.promise(ventaPromise, {
      loading: "Registrando venta...",
      success: ({ ventaId, sunatEstado, sunatAutoDispatchError }) => ({
        message: sunatAutoDispatchError
          ? "Venta registrada. SUNAT requiere revision manual."
          : sunatEstado
            ? `Venta registrada - SUNAT ${sunatEstado}`
            : "Venta registrada",
        action: {
          label: ventaId ? "Ver venta" : "Ver historial",
          onClick: () => {
            router.push(ventaId ? `/ventas/historial?ventaId=${ventaId}` : "/ventas/historial")
          },
        },
      }),
      error: (error) =>
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor. Intente nuevamente.",
    })

    void ventaPromise
      .then((result) => {
        resetVentaDraft()
        void refreshCurrentView()

        if (result.sunatAutoDispatchError) {
          toast.error(result.sunatAutoDispatchError)
        }
      })
      .catch(() => {
        // El feedback de error ya lo maneja toast.promise.
      })
      .finally(() => {
        setSubmittingVenta(false)
      })
  }, [
    canConfirm,
    cart,
    paymentOperationCode,
    refreshCurrentView,
    resolvedSucursalId,
    resetVentaDraft,
    router,
    selectedClient.idCliente,
    selectedComprobante,
    payloadDiscountType,
    payloadDiscountValue,
    selectedMetodoPago,
    selectedPayment,
    submittingVenta,
    total,
  ])

  return (
    <>
      <ProductModal
        product={modalProduct}
        initialSelection={modalVariantSelection}
        onClose={closeModal}
        onConfirm={addVariantToCart}
      />
      <ClienteCreateDialog
        open={isClientCreateOpen}
        onOpenChange={handleClientCreateOpenChange}
        onCreate={createCliente}
        prefill={clientCreatePrefill}
        onCreated={handleClientCreated}
      />

      <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-5">
        <div className="flex min-h-0 min-w-0 flex-[7] flex-col gap-3">
          <div className="flex shrink-0 flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    isVariantView
                      ? "Buscar por SKU, nombre, color o talla..."
                      : "Buscar por nombre, SKU o categoria..."
                  }
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end">
                <CatalogViewToggle value={catalogViewMode} onChange={setCatalogViewMode} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
              <CategoryFilter
                categories={categoriasDisponibles}
                colors={coloresDisponibles}
                activeCategoryId={idCategoriaFilter}
                onCategoryChange={handleCategoriaFilterChange}
                activeColorId={idColorFilter}
                onColorChange={handleColorFilterChange}
                categoryPage={safeCategoryPage}
                categoryTotalPages={categoryTotalPages}
                onCategoryNextPage={handleNextCategoryPage}
                onCategoryPrevPage={handlePrevCategoryPage}
                colorPage={safeColorPage}
                colorTotalPages={colorTotalPages}
                onColorNextPage={handleNextColorPage}
                onColorPrevPage={handlePrevColorPage}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {visibleCatalogCount} {isVariantView ? "variante(s)" : "producto(s)"} en esta pagina.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
            {displayedLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-slate-400">Cargando catalogo...</p>
              </div>
            ) : errorProductos ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <CubeIcon className="h-12 w-12 text-rose-200 dark:text-rose-800" />
                <p className="text-sm font-semibold text-slate-500">{errorProductos}</p>
                <button
                  onClick={() => {
                    void refreshCurrentView()
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : isVariantView ? (
              displayedCatalogVariants.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  {displayedCatalogVariants.map((variant) => (
                    <ProductCard
                      key={variant.key}
                      product={variant.product}
                      onAdd={() => handleSelectCatalogVariant(variant)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                  <CubeIcon className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">Sin resultados</p>
                </div>
              )
            ) : displayedProductos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {displayedProductos.map((producto) => (
                  <ProductCard
                    key={producto.idProducto}
                    product={producto}
                    onAdd={openProductModal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                <CubeIcon className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">Sin resultados</p>
              </div>
            )}

            {!displayedLoading && !errorProductos && (
              <ProductosPagination
                totalElements={displayedTotalElements}
                totalPages={displayedTotalPages}
                page={displayedPage}
                onPageChange={handleDisplayedPageChange}
                itemLabel={isVariantView ? "variantes" : "productos"}
              />
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-[340px] max-w-[450px] flex-[3.4] flex-col gap-2">
          <div className="flex shrink-0 items-center justify-between py-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Panel de Venta
            </h2>
            <LiveClock />
          </div>

          <div className="flex shrink-0 flex-col gap-2 px-1">
            <div className="flex items-center gap-2">
              <SectionLabel>Sucursal</SectionLabel>
              <div className="flex-1">
                {isAdmin ? (
                  <Combobox
                    id="venta-sucursal"
                    value={hasSelectedSucursal ? String(effectiveSelectedSucursalId) : ""}
                    options={sucursalComboboxOptions}
                    searchValue={searchSucursal}
                    onSearchValueChange={setSearchSucursal}
                    onValueChange={(value) => {
                      const nextValue = Number(value)
                      setSelectedSucursalId(Number.isFinite(nextValue) ? nextValue : null)
                    }}
                    placeholder="Selecciona sucursal"
                    searchPlaceholder="Buscar sucursal..."
                    emptyMessage="No se encontraron sucursales"
                    loading={loadingSucursales}
                  />
                ) : (
                  <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                    <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-300">
                      {userHasSucursal
                        ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
                        : "Sin sucursal asignada"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {isAdmin && errorSucursales && (
              <p className="text-[11px] text-red-500">{errorSucursales}</p>
            )}

            <div className="flex items-center gap-2">
              <SectionLabel>Comprobante</SectionLabel>
              <div className="flex-1">
                <Combobox
                  id="venta-comprobante"
                  value={effectiveSelectedComprobanteId}
                  options={comprobanteOptions}
                  searchValue={searchComprobante}
                  onSearchValueChange={setSearchComprobante}
                  onValueChange={setSelectedComprobanteId}
                  placeholder={
                    resolvedSucursalId ? "Selecciona comprobante" : "Selecciona sucursal primero"
                  }
                  searchPlaceholder="Buscar comprobante..."
                  emptyMessage={
                    resolvedSucursalId
                      ? "No hay comprobantes activos para esta sucursal"
                      : "Selecciona una sucursal"
                  }
                  loading={loadingComprobantes}
                  loadingMessage="Cargando comprobantes..."
                  disabled={resolvedSucursalId === null}
                />
              </div>
            </div>
            {errorComprobantes && (
              <p className="text-[11px] text-red-500">{errorComprobantes}</p>
            )}

            <div className="flex items-center gap-2">
              <SectionLabel>Cliente</SectionLabel>
              <div className="flex-1">
                <ClientSelect
                  selected={selectedClient}
                  onSelect={setSelectedClient}
                  onCreateClientRequest={handleClientCreateRequest}
                />
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              className={[
                "flex h-full w-[200%] will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isPaymentStepActive ? "-translate-x-1/2" : "translate-x-0",
              ].join(" ")}
            >
              <div className="flex min-h-0 w-1/2 shrink-0 flex-col gap-2 px-0.5">
                <Card className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-3.5 dark:border-slate-700/60">
                    <SectionLabel>Pedido Actual</SectionLabel>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        totalItems > 0
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-700",
                      ].join(" ")}
                    >
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div
                    className="min-h-0 flex-1 overflow-y-auto px-4"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {cart.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                        <ShoppingBagIcon className="h-9 w-9 text-slate-200 dark:text-slate-700" />
                        <p className="max-w-[150px] text-xs font-medium leading-snug text-slate-400 dark:text-slate-600">
                          {isVariantView
                            ? "Haz click en una variante para agregar"
                            : "Haz click en un producto para agregar"}
                        </p>
                      </div>
                    ) : (
                      cart.map((item, index) => (
                        <CartItem
                          key={`${item.id}-${item.varianteId}-${index}`}
                          item={item}
                          onIncrease={(id) =>
                            updateQty(id, item.talla, item.color, 1, item.varianteId)
                          }
                          onDecrease={(id) =>
                            updateQty(id, item.talla, item.color, -1, item.varianteId)
                          }
                          onRemove={(id) =>
                            removeFromCart(id, item.talla, item.color, item.varianteId)
                          }
                          onSelectPrice={handleSelectCartItemPrice}
                          onEdit={handleEditItem}
                          showPriceTypeBadge
                        />
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="flex shrink-0 justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400 dark:border-slate-700/60">
                      <span>
                        {totalItems} articulo{totalItems !== 1 ? "s" : ""}
                      </span>
                      <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                        {formatMonedaPen(total)}
                      </span>
                    </div>
                  )}
                </Card>
              </div>

              <div className="flex min-h-0 w-1/2 shrink-0 flex-col gap-2 px-0.5">
                <div className="flex shrink-0 items-center justify-between px-1">
                  <div>
                    <SectionLabel>Metodo de Pago</SectionLabel>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Selecciona el metodo y confirma la venta
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReturnToCart}
                    className="rounded-full"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Volver
                  </Button>
                </div>

                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <PaymentMethod
                      selected={selectedPayment}
                      onSelect={setSelectedPayment}
                      methods={activeMetodosPago}
                      variant="drawer"
                    />

                    <div className="mt-4 space-y-2">
                      <label
                        htmlFor="venta-codigo-operacion"
                        className="text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        Codigo de operacion
                      </label>
                      <input
                        id="venta-codigo-operacion"
                        type="text"
                        value={paymentOperationCode}
                        onChange={handlePaymentOperationCodeChange}
                        placeholder="Opcional. Ej. YAPE-938271"
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <Card className="overflow-hidden">
              <div className="px-4 py-3.5">
                {!isPaymentStepActive && (
                  <>
                    {isDiscountEditorActive ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                            <TicketIcon className="h-2.5 w-2.5" />
                          </span>
                          Editando Descuento
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
                          aria-label="Cerrar editor de descuento"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenDiscountEditor}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                          <TicketIcon className="h-2.5 w-2.5" />
                        </span>
                        {payloadDiscountType ? "Editar Descuento" : "Aplicar Descuento"}
                      </button>
                    )}

                    <div className="mt-3 h-px bg-slate-100 dark:bg-slate-700/60" />

                    {isDiscountEditorActive && (
                      <div className="mt-3 flex items-center gap-2.5">
                        <div className="flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                          {DISCOUNT_MODE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleDiscountDraftModeChange(option.value)}
                              className={[
                                "flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-semibold transition-all",
                                discountDraft.mode === option.value
                                  ? "bg-[#5964f2] text-white shadow-[0_8px_18px_rgba(89,100,242,0.4)]"
                                  : "text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                              ].join(" ")}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step={discountDraft.mode === "percent" ? "0.1" : "0.01"}
                            max={discountDraft.mode === "percent" ? "100" : undefined}
                            value={discountDraft.value}
                            onChange={handleDiscountDraftValueChange}
                            placeholder={discountDraft.mode === "percent" ? "12" : "25.00"}
                            className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className={isPaymentStepActive ? "space-y-2.5" : "mt-4 space-y-2.5"}>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatMonedaPen(subtotal)}</span>
                  </div>

                  {showIgvSummary && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Total IGV</span>
                      <span className="tabular-nums">{formatMonedaPen(footerIgv)}</span>
                    </div>
                  )}

                  {visibleDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Descuento
                      </span>
                      <span className="tabular-nums font-medium">
                        -{formatMonedaPen(visibleDiscountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-end justify-between gap-3 pt-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Total a Pagar
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-2xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50">
                        {formatMonedaPen(footerTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {ventaError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/40 dark:bg-red-900/15">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-snug text-red-700 dark:text-red-400">
                    {ventaError}
                  </p>
                  <button
                    onClick={() => setVentaError(null)}
                    className="mt-0.5 text-[10px] text-red-400 hover:text-red-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              onClick={() => {
                if (isPaymentStepActive) {
                  void handleFinalizarVenta()
                  return
                }

                handleOpenPaymentDrawer()
              }}
              disabled={isPrimaryActionDisabled}
              className={[
                "h-auto w-full rounded-[26px] py-4 text-base font-bold transition-all duration-200",
                !isPrimaryActionDisabled
                  ? "shadow-sm active:scale-[0.985]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-600 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {submittingVenta ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />{" "}
                  {isPaymentStepActive ? "Confirmar y Registrar" : "Continuar al Pago"}
                </>
              )}
            </Button>

            {isPrimaryActionDisabled && primaryActionHint && (
              <p className="-mt-1 text-center text-[11px] text-slate-400 dark:text-slate-600">
                {primaryActionHint}
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
