"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ClienteCreateDialog } from "@/components/clientes/modals/ClienteCreateDialog"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import CatalogViewToggle from "@/components/ventas/CatalogViewToggle"
import CategoryFilter from "@/components/ventas/CategoryFilter"
import CartItem, { type CartItemData } from "@/components/ventas/CartItem"
import ClientSelect, { type ClientSelection } from "@/components/ventas/ClientSelect"
import ProductCard from "@/components/ventas/ProductCard"
import ProductModal, { type SelectedVariant } from "@/components/ventas/ProductModal"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
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
import { useProductos } from "@/lib/hooks/useProductos"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { getSucursalAvatarColor, getSucursalInitials } from "@/lib/sucursal"
import type { CotizacionCreateRequest, CotizacionResponse } from "@/lib/types/cotizacion"
import type { Categoria, PageResponse as CategoriaPageResponse } from "@/lib/types/categoria"
import type { Cliente, ClienteCreatePrefill } from "@/lib/types/cliente"
import type { Color, PageResponse as ColorPageResponse } from "@/lib/types/color"
import type { ProductoResumen } from "@/lib/types/producto"

const DEFAULT_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Generico" }
const DEFAULT_COTIZACION_SERIE = "COT"
const DEFAULT_IGV_PORCENTAJE = 18

type DiscountMode = "none" | "percent" | "amount"

interface CategoryFilterOption {
  id: number
  name: string
}

interface ColorFilterOption {
  id: number
  name: string
  hex: string | null | undefined
}

interface CotizacionPageProps {
  cotizacionId?: number
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 ${className}`}>
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

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function parseDiscountValue(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatRegisteredQuoteCode(serie: string | null | undefined, correlativo: number | null | undefined) {
  const safeSerie = typeof serie === "string" && serie.trim().length > 0 ? serie.trim() : "COT"
  const safeCorrelativo = typeof correlativo === "number" && Number.isFinite(correlativo) && correlativo > 0
    ? String(Math.trunc(correlativo)).padStart(4, "0")
    : "----"

  return `${safeSerie}-${safeCorrelativo}`
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
    .map((color) => ({
      id: color.idColor,
      name: color.nombre?.trim() || `Color #${color.idColor}`,
      hex: color.codigo,
    }))
}

function mapCategoryFilters(payload: unknown): CategoryFilterOption[] {
  const pageData = payload as CategoriaPageResponse<Categoria> | null
  const content = Array.isArray(pageData?.content) ? pageData.content : []

  return content
    .filter((categoria) => {
      if (typeof categoria?.idCategoria !== "number" || categoria.idCategoria <= 0) return false
      const estado = String(categoria?.estado ?? "").trim().toUpperCase()
      return !estado || estado === "ACTIVO"
    })
    .map((categoria) => ({
      id: categoria.idCategoria,
      name: categoria.nombreCategoria?.trim() || `Categoria #${categoria.idCategoria}`,
    }))
}

function resolveDiscountMode(cotizacion: CotizacionResponse): DiscountMode {
  if (cotizacion.tipoDescuento === "PORCENTAJE") return "percent"
  if (cotizacion.tipoDescuento === "MONTO") return "amount"
  return "none"
}

function resolveDiscountValue(cotizacion: CotizacionResponse): string {
  if (cotizacion.descuentoTotal <= 0) return ""

  if (cotizacion.tipoDescuento === "MONTO") {
    return String(cotizacion.descuentoTotal)
  }

  if (cotizacion.tipoDescuento === "PORCENTAJE") {
    const baseSubtotal = cotizacion.detalles.reduce((sum, item) => sum + item.subtotal, 0)
    if (baseSubtotal <= 0) return ""

    const percentage = Number(((cotizacion.descuentoTotal / baseSubtotal) * 100).toFixed(2))
    return percentage > 0 ? String(percentage) : ""
  }

  return ""
}

function mapCotizacionToCart(cotizacion: CotizacionResponse): CartItemData[] {
  return cotizacion.detalles.map((item) => ({
    id: item.idProducto,
    varianteId: item.idProductoVariante,
    nombre: item.nombreProducto,
    precio: item.precioUnitario,
    cantidad: item.cantidad,
    talla: item.talla || "-",
    color: item.color || "-",
    imageUrl: null,
  }))
}

export function CotizacionPage({ cotizacionId }: CotizacionPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const isEditing = typeof cotizacionId === "number" && cotizacionId > 0
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
  const [selectedClient, setSelectedClient] = useState<ClientSelection>(DEFAULT_CLIENT)
  const [clientCreatePrefill, setClientCreatePrefill] = useState<ClienteCreatePrefill | null>(null)
  const [isClientCreateOpen, setIsClientCreateOpen] = useState(false)
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [discountMode, setDiscountMode] = useState<DiscountMode>("none")
  const [discountValue, setDiscountValue] = useState("")
  const [notes, setNotes] = useState("")
  const [modalProduct, setModalProduct] = useState<ProductoResumen | null>(null)
  const [modalVariantSelection, setModalVariantSelection] =
    useState<CatalogVariantSelection | null>(null)
  const [cotizacionError, setCotizacionError] = useState<string | null>(null)
  const [submittingCotizacion, setSubmittingCotizacion] = useState(false)
  const [loadingCotizacion, setLoadingCotizacion] = useState(isEditing)
  const [loadedCotizacion, setLoadedCotizacion] = useState<CotizacionResponse | null>(null)
  const [editingLocked, setEditingLocked] = useState(false)
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

  const defaultAdminSucursalId =
    isAdmin && hasValidSucursalId(user?.idSucursal) ? user.idSucursal : null
  const effectiveSelectedSucursalId = hasValidSucursalId(selectedSucursalId)
    ? selectedSucursalId
    : defaultAdminSucursalId
  const hasSelectedSucursal = hasValidSucursalId(effectiveSelectedSucursalId)

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasSelectedSucursal &&
      !sucursalOptions.some((option) => option.value === String(effectiveSelectedSucursalId))
        ? [{
            value: String(effectiveSelectedSucursalId),
            label: `Sucursal #${effectiveSelectedSucursalId}`,
            avatarText: getSucursalInitials("Sucursal"),
            avatarClassName: getSucursalAvatarColor(effectiveSelectedSucursalId),
          }, ...sucursalOptions]
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

  useEffect(() => {
    if (!isEditing || !cotizacionId) {
      setLoadingCotizacion(false)
      setLoadedCotizacion(null)
      setEditingLocked(false)
      return
    }

    const controller = new AbortController()

    const fetchCotizacion = async () => {
      setLoadingCotizacion(true)
      setCotizacionError(null)

      try {
        const response = await authFetch(`/api/cotizacion/detalle/${cotizacionId}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message =
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof data.message === "string"
              ? data.message
              : `Error ${response.status} al cargar la cotizacion`
          setLoadedCotizacion(null)
          setCotizacionError(message)
          setEditingLocked(false)
          return
        }

        const cotizacion = data as CotizacionResponse
        const locked = cotizacion.estado.trim().toUpperCase() === "CONVERTIDA"

        setLoadedCotizacion(cotizacion)
        setEditingLocked(locked)
        setSelectedClient({
          idCliente: cotizacion.idCliente,
          nombre: cotizacion.nombreCliente?.trim() || DEFAULT_CLIENT.nombre,
        })
        setSelectedSucursalId(cotizacion.idSucursal ?? null)
        setDiscountMode(resolveDiscountMode(cotizacion))
        setDiscountValue(resolveDiscountValue(cotizacion))
        setNotes(cotizacion.observacion ?? "")
        setCart(mapCotizacionToCart(cotizacion))
        if (locked) {
          setCotizacionError("La cotizacion convertida no se puede editar.")
        } else {
          setCotizacionError(null)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return
        setLoadedCotizacion(null)
        setEditingLocked(false)
        setCotizacionError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la cotizacion"
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCotizacion(false)
        }
      }
    }

    void fetchCotizacion()

    return () => {
      controller.abort()
    }
  }, [cotizacionId, isEditing])

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
        const totalPages = typeof pageData?.totalPages === "number" && pageData.totalPages > 0 ? pageData.totalPages : 1
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
        const totalPages = typeof pageData?.totalPages === "number" && pageData.totalPages > 0 ? pageData.totalPages : 1
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

  const safeCategoryPage = Math.max(0, Math.min(categoryPage, Math.max(0, categoryTotalPages - 1)))
  const safeColorPage = Math.max(0, Math.min(colorPage, Math.max(0, colorTotalPages - 1)))
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
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const parsedDiscountValue = parseDiscountValue(discountValue)
  const discountAmount = useMemo(() => {
    if (discountMode === "percent") {
      return subtotal * (Math.min(100, Math.max(0, parsedDiscountValue)) / 100)
    }
    if (discountMode === "amount") {
      return Math.min(subtotal, Math.max(0, parsedDiscountValue))
    }
    return 0
  }, [discountMode, parsedDiscountValue, subtotal])
  const total = Math.max(0, subtotal - discountAmount)
  const payloadDiscountValue = useMemo(() => {
    if (discountMode === "percent") {
      return Math.min(100, Math.max(0, parsedDiscountValue))
    }
    if (discountMode === "amount") {
      return Math.min(subtotal, Math.max(0, parsedDiscountValue))
    }
    return null
  }, [discountMode, parsedDiscountValue, subtotal])
  const payloadDiscountType = useMemo(() => {
    if (discountMode === "percent") return "PORCENTAJE" as const
    if (discountMode === "amount") return "MONTO" as const
    return null
  }, [discountMode])
  const generationIssues = useMemo(() => [
    ...(loadingCotizacion ? ["Cargando cotizacion..."] : []),
    ...(editingLocked ? ["La cotizacion convertida no se puede editar"] : []),
    ...(cart.length === 0 ? ["Agrega al menos una variante a la cotizacion"] : []),
    ...(resolvedSucursalId === null ? [isAdmin ? "Selecciona una sucursal" : "Tu usuario no tiene sucursal asignada"] : []),
    ...(selectedClient.idCliente === null ? ["Selecciona un cliente real"] : []),
  ], [cart.length, editingLocked, isAdmin, loadingCotizacion, resolvedSucursalId, selectedClient.idCliente])
  const canGenerate = generationIssues.length === 0

  const clearCotizacionError = useCallback(() => {
    setCotizacionError(null)
  }, [])

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

  const resetQuoteForm = useCallback(() => {
    setCart([])
    setSelectedClient(DEFAULT_CLIENT)
    setSelectedSucursalId(null)
    setDiscountMode("none")
    setDiscountValue("")
    setNotes("")
    setCotizacionError(null)
  }, [])

  const handleClientSelect = useCallback((client: ClientSelection) => {
    setSelectedClient(client)
    clearCotizacionError()
  }, [clearCotizacionError])

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
    clearCotizacionError()
  }, [clearCotizacionError, resolvedSucursalId])

  const handleClientCreated = useCallback((client: Cliente) => {
    setSelectedClient({
      idCliente: client.idCliente,
      nombre: client.nombres,
    })
    clearCotizacionError()
  }, [clearCotizacionError])

  const handleSucursalChange = useCallback((value: string) => {
    const parsedValue = Number(value)
    setSelectedSucursalId(Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null)
    clearCotizacionError()
  }, [clearCotizacionError])

  const handleDiscountModeChange = useCallback((mode: DiscountMode) => {
    setDiscountMode(mode)
    if (mode === "none") {
      setDiscountValue("")
    }
    clearCotizacionError()
  }, [clearCotizacionError])

  const handleDiscountValueChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDiscountValue(event.target.value)
    clearCotizacionError()
  }, [clearCotizacionError])

  const handleNotesChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value)
    clearCotizacionError()
  }, [clearCotizacionError])

  const closeModal = useCallback(() => {
    setModalProduct(null)
    setModalVariantSelection(null)
  }, [])

  const openProductModal = useCallback((producto: ProductoResumen) => {
    setModalVariantSelection(null)
    setModalProduct(producto)
    clearCotizacionError()
  }, [clearCotizacionError])

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
      setCotizacionError("No se encontro el producto para editar la variante.")
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
    clearCotizacionError()
  }, [clearCotizacionError, displayedCatalogVariants, displayedProductos, productViewVariantItems])

  const addVariantToCart = useCallback((variant: SelectedVariant) => {
    setCart((previous) => {
      const index = previous.findIndex((item) => item.varianteId === variant.varianteId)
      if (index >= 0) {
        return previous.map((item, idx) =>
          idx === index
            ? {
                ...item,
                cantidad: item.cantidad + variant.cantidad,
                precio: variant.precio,
                imageUrl: variant.imageUrl ?? item.imageUrl ?? null,
              }
            : item
        )
      }

      return [
        ...previous,
        {
          id: variant.id,
          varianteId: variant.varianteId,
          nombre: variant.nombre,
          precio: variant.precio,
          cantidad: variant.cantidad,
          talla: variant.talla,
          color: variant.color,
          imageUrl: variant.imageUrl ?? null,
        },
      ]
    })

    clearCotizacionError()
  }, [clearCotizacionError])

  const handleSelectCatalogVariant = useCallback((variant: CatalogVariantItem) => {
    if (!variant.variantId || variant.variantId <= 0) {
      setCotizacionError("La variante seleccionada no tiene un identificador valido.")
      return
    }

    const nextItem = buildCatalogVariantCartSelection(variant)

    setCart((previous) => {
      const index = previous.findIndex((item) => item.varianteId === nextItem.varianteId)
      if (index >= 0) {
        return previous.map((item, idx) =>
          idx === index
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                imageUrl: item.imageUrl ?? nextItem.imageUrl ?? null,
              }
            : item
        )
      }

      return [...previous, nextItem]
    })

    clearCotizacionError()
  }, [clearCotizacionError])

  const updateQty = useCallback((id: number, talla: string, color: string, delta: number, varianteId?: number) => {
    setCart((previous) =>
      previous.map((item) => {
        const isSameItem =
          varianteId && item.varianteId
            ? item.varianteId === varianteId
            : item.id === id && item.talla === talla && item.color === color

        if (!isSameItem) return item
        return { ...item, cantidad: Math.max(1, item.cantidad + delta) }
      })
    )

    clearCotizacionError()
  }, [clearCotizacionError])

  const removeFromCart = useCallback((id: number, talla: string, color: string, varianteId?: number) => {
    setCart((previous) =>
      previous.filter((item) => {
        if (varianteId && item.varianteId) {
          return item.varianteId !== varianteId
        }

        return !(item.id === id && item.talla === talla && item.color === color)
      })
    )

    clearCotizacionError()
  }, [clearCotizacionError])

  const handleGenerateQuote = useCallback(async () => {
    if (!canGenerate) {
      const message = generationIssues[0] ?? "Completa los datos obligatorios."
      setCotizacionError(message)
      toast.error(message)
      return
    }

    if (submittingCotizacion) return

    const invalidItem = cart.find(
      (item) => typeof item.varianteId !== "number" || item.varianteId <= 0
    )
    if (invalidItem) {
      const message = `El item "${invalidItem.nombre}" no tiene una variante valida. Vuelve a seleccionarlo.`
      setCotizacionError(message)
      toast.error(message)
      return
    }

    if (resolvedSucursalId === null || selectedClient.idCliente === null) {
      const message = "Debes seleccionar una sucursal y un cliente antes de registrar la cotizacion."
      setCotizacionError(message)
      toast.error(message)
      return
    }

    const payload: CotizacionCreateRequest = {
      idSucursal: resolvedSucursalId,
      idCliente: selectedClient.idCliente,
      serie: loadedCotizacion?.serie?.trim() || DEFAULT_COTIZACION_SERIE,
      correlativo: isEditing ? loadedCotizacion?.correlativo : undefined,
      igvPorcentaje: loadedCotizacion?.igvPorcentaje ?? DEFAULT_IGV_PORCENTAJE,
      descuentoTotal: payloadDiscountValue,
      tipoDescuento: payloadDiscountType,
      observacion: notes.trim().length > 0 ? notes.trim() : null,
      detalles: cart.map((item) => ({
        idProductoVariante: item.varianteId as number,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precio.toFixed(2)),
        descuento: 0,
      })),
    }

    setSubmittingCotizacion(true)
    setCotizacionError(null)

    const requestUrl = isEditing
      ? `/api/cotizacion/actualizar/${cotizacionId}`
      : "/api/cotizacion/insertar"
    const requestMethod = isEditing ? "PUT" : "POST"

    const requestPromise = (async () => {
      const response = await authFetch(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await parseJsonSafe(response)
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : data && typeof data === "object" && "error" in data && typeof data.error === "string"
              ? data.error
              : `Error ${response.status} al registrar la cotizacion`
        throw new Error(message)
      }

      return data as CotizacionResponse
    })()

    toast.promise(requestPromise, {
      loading: isEditing ? "Actualizando cotizacion..." : "Registrando cotizacion...",
      success: (data) =>
        `Cotizacion ${formatRegisteredQuoteCode(data.serie, data.correlativo)} ${
          isEditing ? "actualizada" : "registrada"
        }`,
      error: (error) =>
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor. Intente nuevamente.",
    })

    try {
      const responseData = await requestPromise
      if (isEditing) {
        router.push(`/ventas/cotizacion/historial?cotizacionId=${responseData.idCotizacion}`)
      } else {
        resetQuoteForm()
      }
    } catch (error) {
      setCotizacionError(error instanceof Error ? error.message : "No se pudo registrar la cotizacion.")
    } finally {
      setSubmittingCotizacion(false)
    }
  }, [
    canGenerate,
    cart,
    generationIssues,
    notes,
    payloadDiscountType,
    payloadDiscountValue,
    resolvedSucursalId,
    resetQuoteForm,
    router,
    selectedClient.idCliente,
    submittingCotizacion,
    cotizacionId,
    isEditing,
    loadedCotizacion?.correlativo,
    loadedCotizacion?.igvPorcentaje,
    loadedCotizacion?.serie,
  ])

  if (isEditing && loadingCotizacion) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-8 py-10 shadow-sm">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Cargando cotizacion...</p>
        </div>
      </div>
    )
  }

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
                onCategoryNextPage={() => {
                  if (safeCategoryPage < categoryTotalPages - 1) setCategoryPage((previous) => previous + 1)
                }}
                onCategoryPrevPage={() => {
                  if (safeCategoryPage > 0) setCategoryPage((previous) => Math.max(0, previous - 1))
                }}
                colorPage={safeColorPage}
                colorTotalPages={colorTotalPages}
                onColorNextPage={() => {
                  if (safeColorPage < colorTotalPages - 1) setColorPage((previous) => previous + 1)
                }}
                onColorPrevPage={() => {
                  if (safeColorPage > 0) setColorPage((previous) => Math.max(0, previous - 1))
                }}
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
                <button onClick={() => void refreshCurrentView()} className="text-xs text-blue-500 hover:underline">Reintentar</button>
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
          <div className="py-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isEditing ? "Editar Cotizacion" : "Cotizacion"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Actualiza cliente, sucursal, productos y observaciones."
                : "Selecciona cliente, sucursal, productos y observaciones."}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 px-1">
            <div className="flex items-center gap-2">
              <SectionLabel>Sucursal</SectionLabel>
              <div className="flex-1">
                {isAdmin ? (
                  <Combobox
                    id="cotizacion-sucursal"
                    value={hasSelectedSucursal ? String(effectiveSelectedSucursalId) : ""}
                    options={sucursalComboboxOptions}
                    searchValue={searchSucursal}
                    onSearchValueChange={setSearchSucursal}
                    onValueChange={handleSucursalChange}
                    placeholder="Selecciona sucursal"
                    searchPlaceholder="Buscar sucursal..."
                    emptyMessage="No se encontraron sucursales"
                    loading={loadingSucursales}
                  />
                ) : (
                  <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                    <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-300">{userHasSucursal ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}` : "Sin sucursal asignada"}</span>
                  </div>
                )}
              </div>
            </div>
            {isAdmin && errorSucursales && <p className="text-[11px] text-red-500">{errorSucursales}</p>}

            <div className="flex items-center gap-2">
              <SectionLabel>Cliente</SectionLabel>
              <div className="flex-1">
                <ClientSelect
                  selected={selectedClient}
                  onSelect={handleClientSelect}
                  onCreateClientRequest={handleClientCreateRequest}
                />
              </div>
            </div>
          </div>

          <Card className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-3.5 dark:border-slate-700/60">
              <SectionLabel>Variantes Cotizadas</SectionLabel>
              <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold", totalItems > 0 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-400 dark:bg-slate-700"].join(" ")}>{totalItems} {totalItems === 1 ? "item" : "items"}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4" style={{ scrollbarWidth: "none" }}>
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                  <ShoppingBagIcon className="h-9 w-9 text-slate-200 dark:text-slate-700" />
                  <p className="max-w-[180px] text-xs font-medium leading-snug text-slate-400 dark:text-slate-600">Agrega variantes para armar la propuesta comercial.</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <CartItem
                    key={`${item.id}-${item.varianteId}-${index}`}
                    item={item}
                    onIncrease={(id) => updateQty(id, item.talla, item.color, 1, item.varianteId)}
                    onDecrease={(id) => updateQty(id, item.talla, item.color, -1, item.varianteId)}
                    onRemove={(id) => removeFromCart(id, item.talla, item.color, item.varianteId)}
                    onEdit={handleEditItem}
                  />
                ))
              )}
            </div>
          </Card>

          <Card className="p-3.5">
            <SectionLabel>Condiciones</SectionLabel>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[{ value: "none", label: "Sin desc." }, { value: "percent", label: "%" }, { value: "amount", label: "S/" }].map((option) => (
                  <button key={option.value} type="button" onClick={() => handleDiscountModeChange(option.value as DiscountMode)} className={["rounded-xl border px-2 py-2 text-xs font-semibold transition-colors", discountMode === option.value ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"].join(" ")}>{option.label}</button>
                ))}
              </div>

              {discountMode !== "none" && (
                <input type="number" min="0" step={discountMode === "percent" ? "0.1" : "0.01"} max={discountMode === "percent" ? "100" : undefined} value={discountValue} onChange={handleDiscountValueChange} placeholder={discountMode === "percent" ? "Ej. 10" : "Ej. 25.00"} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              )}

              <Textarea value={notes} onChange={handleNotesChange} rows={4} placeholder="Observaciones comerciales, tiempos de entrega o condiciones." className="resize-none rounded-xl border-slate-200 bg-white text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </Card>

          <Card className="p-3.5">
            <SectionLabel>Totales</SectionLabel>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span className="tabular-nums">{formatMonedaPen(subtotal)}</span></div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400"><span>Descuento</span><span className="tabular-nums">{formatMonedaPen(discountAmount)}</span></div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white"><span>Total cotizado</span><span className="tabular-nums text-blue-600 dark:text-blue-400">{formatMonedaPen(total)}</span></div>
            </div>
          </Card>

          {cotizacionError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/40 dark:bg-red-900/15">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold leading-snug text-red-700 dark:text-red-400">{cotizacionError}</p>
                <button onClick={() => setCotizacionError(null)} className="mt-0.5 text-[10px] text-red-400 hover:text-red-600">Cerrar</button>
              </div>
            </div>
          )}

          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                void handleGenerateQuote()
              }}
              disabled={!canGenerate || submittingCotizacion}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all duration-200",
                canGenerate && !submittingCotizacion
                  ? "bg-gradient-to-r from-[#3266E4] to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
              ].join(" ")}
            >
              {submittingCotizacion ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  {isEditing ? "Actualizando..." : "Registrando..."}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  {isEditing ? "Actualizar Cotizacion" : "Generar Cotizacion"}
                </>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => router.push("/ventas/cotizacion/historial")}
                disabled={submittingCotizacion}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70"
              >
                Volver al historial
              </button>
            )}
            {!canGenerate && <p className="text-center text-[11px] text-slate-400 dark:text-slate-600">{generationIssues[0]}</p>}
          </div>
        </div>
      </div>
    </>
  )
}
