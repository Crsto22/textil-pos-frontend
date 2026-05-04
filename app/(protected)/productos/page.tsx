"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BuildingStorefrontIcon, CheckCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { ProductosCards } from "@/components/productos/ProductosCards"
import {
  ProductosHeader,
  type ProductosViewMode,
} from "@/components/productos/ProductosHeader"
import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ProductosTable } from "@/components/productos/ProductosTable"
import { ProductosVariantesCards } from "@/components/productos/ProductosVariantesCards"
import { ProductosVariantesTable } from "@/components/productos/ProductosVariantesTable"
import { BarcodeListDialog } from "@/components/productos/modals/BarcodeListDialog"
import { ProductoDeleteDialog } from "@/components/productos/modals/ProductoDeleteDialog"
import { ProductoVarianteDeleteDialog } from "@/components/productos/modals/ProductoVarianteDeleteDialog"
import { ProductoVarianteEditDialog } from "@/components/productos/modals/ProductoVarianteEditDialog"
import { VarianteBarcodeDialog } from "@/components/productos/modals/VarianteBarcodeDialog"
import CatalogViewToggle from "@/components/ventas/CatalogViewToggle"
import CategoryFilter from "@/components/ventas/CategoryFilter"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole, roleCanManageStock } from "@/lib/auth/roles"
import { AgregarStockModal } from "@/components/stock/AgregarStockModal"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useCanFilterBySucursal } from "@/lib/hooks/useCanFilterByUsuario"
import { useCatalogoVariantes } from "@/lib/hooks/useCatalogoVariantes"
import { useCatalogViewMode } from "@/lib/hooks/useCatalogViewMode"
import { useProductos } from "@/lib/hooks/useProductos"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { generateBarcode } from "@/lib/barcode-generator"
import { useVarianteReporteExcel } from "@/lib/hooks/useVarianteReporteExcel"
import type { Categoria, PageResponse as CategoriaPageResponse } from "@/lib/types/categoria"
import type { Color, PageResponse as ColorPageResponse } from "@/lib/types/color"
import type { ProductoResumen } from "@/lib/types/producto"
import type { VarianteResumenImagen, VarianteUpdateRequest } from "@/lib/types/variante"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
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

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export default function ProductosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = isAdministratorRole(user?.rol)
  const canManageStock = roleCanManageStock(user?.rol)
  const canFilterBySucursal = useCanFilterBySucursal()
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const isMultiSucursalNonAdmin = !isAdmin && canFilterBySucursal && (user?.sucursalesPermitidas ?? []).length > 1
  const defaultSucursalId = userHasSucursal ? user!.idSucursal : null
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockModalSession, setStockModalSession] = useState(0)
  const [stockModalDefaults, setStockModalDefaults] = useState<{
    idSucursal?: number | null
    codigoBarras?: string | null
    query?: string | null
  }>({})
  const resolvedSucursalId = (() => {
    if (isAdmin) return hasValidSucursalId(selectedSucursalId) ? selectedSucursalId : null
    if (isMultiSucursalNonAdmin) return hasValidSucursalId(selectedSucursalId) ? selectedSucursalId : defaultSucursalId
    return userHasSucursal ? user?.idSucursal ?? null : null
  })()
  const isSucursalResolved = isAdmin || isMultiSucursalNonAdmin || userHasSucursal

  const {
    sucursalOptions: adminSucursalOptions,
    loadingSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin, "VENTA")

  const nonAdminSucursalVentaOptions = useMemo<ComboboxOption[]>(
    () =>
      isMultiSucursalNonAdmin
        ? (user?.sucursalesPermitidas ?? [])
            .filter((s) => !s.tipoSucursal || s.tipoSucursal === "VENTA")
            .map((s) => ({ value: String(s.idSucursal), label: s.nombreSucursal }))
        : [],
    [isMultiSucursalNonAdmin, user?.sucursalesPermitidas]
  )

  const TODAS_SUCURSALES_OPTION: ComboboxOption = useMemo(
    () => ({ value: "todas", label: "Todas las sucursales" }),
    []
  )

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () => {
      if (isMultiSucursalNonAdmin) return nonAdminSucursalVentaOptions
      return [TODAS_SUCURSALES_OPTION, ...adminSucursalOptions]
    },
    [TODAS_SUCURSALES_OPTION, adminSucursalOptions, isMultiSucursalNonAdmin, nonAdminSucursalVentaOptions]
  )

  const { isExporting, exportReporteExcel } = useVarianteReporteExcel()
  const [deleteTarget, setDeleteTarget] = useState<ProductoResumen | null>(null)
  const [editVariantTarget, setEditVariantTarget] = useState<CatalogVariantItem | null>(null)
  const [deleteVariantTarget, setDeleteVariantTarget] = useState<CatalogVariantItem | null>(null)
  const [barcodeTarget, setBarcodeTarget] = useState<CatalogVariantItem | null>(null)
  const [showBarcodeList, setShowBarcodeList] = useState(false)
  const [viewMode, setViewMode] = useState<ProductosViewMode>("cards")
  const [catalogViewMode, setCatalogViewMode] = useCatalogViewMode()
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoryFilterOption[]>(
    []
  )
  const [categoryPage, setCategoryPage] = useState(0)
  const [categoryTotalPages, setCategoryTotalPages] = useState(1)
  const [coloresDisponibles, setColoresDisponibles] = useState<ColorFilterOption[]>([])
  const [colorPage, setColorPage] = useState(0)
  const [colorTotalPages, setColorTotalPages] = useState(1)
  const isVariantView = catalogViewMode === "variantes"

  // Sincronizar filtro "Solo disponibles" con localStorage (default: true la primera vez)
  const [initialSoloDisponibles] = useState(
    () => typeof window !== "undefined" ? localStorage.getItem("pos_solo_disponibles") !== "0" : true
  )

  const {
    search: searchProductos,
    setSearch: setSearchProductos,
    idCategoriaFilter: idCategoriaFilterProductos,
    idColorFilter: idColorFilterProductos,
    soloDisponiblesFilter: soloDisponiblesFilterProductos,
    setIdCategoriaFilter: setIdCategoriaFilterProductos,
    setIdColorFilter: setIdColorFilterProductos,
    setSoloDisponiblesFilter: setSoloDisponiblesFilterProductos,
    displayedProductos,
    displayedLoading: displayedLoadingProductos,
    displayedTotalElements: displayedTotalElementsProductos,
    displayedTotalPages: displayedTotalPagesProductos,
    displayedPage: displayedPageProductos,
    setDisplayedPage: setDisplayedPageProductos,
    deleteProducto,
    refreshCurrentView: refreshProductosView,
  } = useProductos(!isVariantView && isSucursalResolved, resolvedSucursalId, initialSoloDisponibles)
  const {
    search: searchVariantes,
    setSearch: setSearchVariantes,
    idCategoriaFilter: idCategoriaFilterVariantes,
    idColorFilter: idColorFilterVariantes,
    soloDisponiblesFilter: soloDisponiblesFilterVariantes,
    setIdCategoriaFilter: setIdCategoriaFilterVariantes,
    setIdColorFilter: setIdColorFilterVariantes,
    setSoloDisponiblesFilter: setSoloDisponiblesFilterVariantes,
    displayedCatalogVariants,
    displayedLoading: displayedLoadingVariantes,
    displayedTotalElements: displayedTotalElementsVariantes,
    displayedTotalPages: displayedTotalPagesVariantes,
    displayedPage: displayedPageVariantes,
    setDisplayedPage: setDisplayedPageVariantes,
    updateVariante,
    deleteVariante,
    refreshCurrentView: refreshVariantesView,
    getImagenesForVariant,
  } = useCatalogoVariantes(isVariantView && isSucursalResolved, resolvedSucursalId, initialSoloDisponibles)

  useEffect(() => {
    const fetchCategorias = async () => {
      if (!isSucursalResolved) {
        setCategoriasDisponibles([])
        setCategoryTotalPages(1)
        return
      }

      try {
        const params = new URLSearchParams({ page: String(categoryPage) })
        if (resolvedSucursalId !== null) params.set("idSucursal", String(resolvedSucursalId))
        const response = await authFetch(`/api/categoria/listar?${params.toString()}`)
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
  }, [categoryPage, isSucursalResolved, resolvedSucursalId])

  useEffect(() => {
    const fetchColores = async () => {
      if (!isSucursalResolved) {
        setColoresDisponibles([])
        setColorTotalPages(1)
        return
      }

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
  }, [colorPage, isSucursalResolved, resolvedSucursalId])

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

  const handleDeleteProducto = useCallback((producto: ProductoResumen) => {
    setDeleteTarget(producto)
  }, [])

  const handleEditProducto = useCallback(
    (producto: ProductoResumen) => {
      router.push(`/productos/${producto.idProducto}/editar`)
    },
    [router]
  )

  const handleDeleteConfirmed = useCallback(
    async (idProducto: number) => {
      const success = await deleteProducto(idProducto)
      if (!success) return false
      return true
    },
    [deleteProducto]
  )

  const handleEditVariante = useCallback((variant: CatalogVariantItem) => {
    if (!variant.variantId) return
    setEditVariantTarget(variant)
  }, [])

  const handleDeleteVariante = useCallback((variant: CatalogVariantItem) => {
    if (!variant.variantId) return
    setDeleteVariantTarget(variant)
  }, [])

  const handleShowBarcode = useCallback((variant: CatalogVariantItem) => {
    if (!variant.codigoBarras) return
    setBarcodeTarget(variant)
  }, [])

  const handleVariantUpdateConfirmed = useCallback(
    async (idVariante: number, payload: VarianteUpdateRequest) => {
      const success = await updateVariante(idVariante, payload)
      if (!success) return false
      setEditVariantTarget(null)
      return true
    },
    [updateVariante]
  )

  const handleVariantDeleteConfirmed = useCallback(
    async (idVariante: number) => {
      const success = await deleteVariante(idVariante)
      if (!success) return false
      return true
    },
    [deleteVariante]
  )

  const [isGeneratingBarcode] = useState(false)

  const handleGenerateBarcodeForEdit = useCallback((): Promise<string | null> => {
    const codigoBarras = generateBarcode()
    toast.success("Código de barras generado")
    return Promise.resolve(codigoBarras)
  }, [])

  const search = isVariantView ? searchVariantes : searchProductos
  const idCategoriaFilter = isVariantView
    ? idCategoriaFilterVariantes
    : idCategoriaFilterProductos
  const idColorFilter = isVariantView ? idColorFilterVariantes : idColorFilterProductos
  const shouldShowCatalogFilters = isSucursalResolved
  const displayedLoading = isVariantView ? displayedLoadingVariantes : displayedLoadingProductos
  const displayedTotalElements = isVariantView
    ? displayedTotalElementsVariantes
    : displayedTotalElementsProductos
  const displayedTotalPages = isVariantView
    ? displayedTotalPagesVariantes
    : displayedTotalPagesProductos
  const displayedPage = isVariantView ? displayedPageVariantes : displayedPageProductos

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
    [isVariantView, setIdCategoriaFilterProductos, setIdCategoriaFilterVariantes]
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

  const soloDisponiblesFilter = isVariantView ? soloDisponiblesFilterVariantes : soloDisponiblesFilterProductos

  const handleSoloDisponiblesFilterChange = useCallback(
    (value: boolean) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("pos_solo_disponibles", value ? "1" : "0")
      }
      if (isVariantView) {
        setSoloDisponiblesFilterVariantes(value)
        return
      }
      setSoloDisponiblesFilterProductos(value)
    },
    [isVariantView, setSoloDisponiblesFilterProductos, setSoloDisponiblesFilterVariantes]
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        {/* ─── Row 1: search + sucursal (admin) ─── */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o categoria..."
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              disabled={!isSucursalResolved}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* ─── Row 2: sucursal (admin) + toggles ─── */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || isMultiSucursalNonAdmin) && (
            <div className="min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Combobox
                value={selectedSucursalId !== null ? String(selectedSucursalId) : isMultiSucursalNonAdmin ? (defaultSucursalId !== null ? String(defaultSucursalId) : "") : "todas"}
                options={sucursalComboboxOptions}
                onValueChange={(value) => {
                  if (isMultiSucursalNonAdmin) {
                    const parsed = parseInt(value, 10)
                    setSelectedSucursalId(
                      Number.isFinite(parsed) && parsed > 0 ? parsed : defaultSucursalId
                    )
                  } else {
                    const parsed = parseInt(value, 10)
                    setSelectedSucursalId(
                      value !== "todas" && Number.isFinite(parsed) && parsed > 0
                        ? parsed
                        : null
                    )
                  }
                  setCategoryPage(0)
                  setColorPage(0)
                  setIdCategoriaFilterProductos(null)
                  setIdColorFilterProductos(null)
                  setIdCategoriaFilterVariantes(null)
                  setIdColorFilterVariantes(null)
                }}
                placeholder={isMultiSucursalNonAdmin ? "Selecciona sucursal" : "Todas las sucursales"}
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="Sin resultados"
                loading={loadingSucursales}
                loadingMessage="Cargando sucursales..."
                searchValue={searchSucursal}
                onSearchValueChange={setSearchSucursal}
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSoloDisponiblesFilterChange(!soloDisponiblesFilter)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                soloDisponiblesFilter
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70"
              }`}
              title="Mostrar solo productos con stock disponible"
              aria-pressed={soloDisponiblesFilter}
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{soloDisponiblesFilter ? "Disponibles" : "Disponibles"}</span>
            </button>
            <CatalogViewToggle
              value={catalogViewMode}
              onChange={setCatalogViewMode}
              iconSet="productos"
            />
          </div>
        </div>

        {shouldShowCatalogFilters ? (
          <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
            <CategoryFilter
              categories={categoriasDisponibles}
              colors={coloresDisponibles}
              activeCategoryId={idCategoriaFilter}
              onCategoryChange={handleCategoriaFilterChange}
              categoryPage={safeCategoryPage}
              categoryTotalPages={categoryTotalPages}
              onCategoryNextPage={handleNextCategoryPage}
              onCategoryPrevPage={handlePrevCategoryPage}
              activeColorId={idColorFilter}
              onColorChange={handleColorFilterChange}
              colorPage={safeColorPage}
              colorTotalPages={colorTotalPages}
              onColorNextPage={handleNextColorPage}
              onColorPrevPage={handlePrevColorPage}
            />
          </div>
        ) : null}

        <ProductosHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewModeToggle
          reportLoading={isExporting}
          onDownloadExcel={() => {
            void exportReporteExcel()
          }}
          onOpenBarcodeList={
            isSucursalResolved
              ? () => setShowBarcodeList(true)
              : undefined
          }
        />
      </div>

      <section className="space-y-4">
        {!isSucursalResolved ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <BuildingStorefrontIcon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Selecciona una sucursal
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Elige una sucursal para ver y gestionar sus productos
            </p>
          </div>
        ) : isVariantView ? (
          viewMode === "cards" ? (
            <ProductosVariantesCards
              variants={displayedCatalogVariants}
              loading={displayedLoading}
              onEditVariante={handleEditVariante}
              onDeleteVariante={handleDeleteVariante}
              onShowBarcode={handleShowBarcode}
              onAddStock={canManageStock ? (variant) => {
                setStockModalDefaults({
                  idSucursal: resolvedSucursalId,
                  codigoBarras: variant.codigoBarras ?? null,
                  query: !variant.codigoBarras ? `${variant.productName} ${variant.tallaName}` : null,
                })
                setStockModalSession((prev) => prev + 1)
                setStockModalOpen(true)
              } : undefined}
            />
          ) : (
            <ProductosVariantesTable
              variants={displayedCatalogVariants}
              loading={displayedLoading}
              onEditVariante={handleEditVariante}
              onDeleteVariante={handleDeleteVariante}
              onShowBarcode={handleShowBarcode}
            />
          )
        ) : viewMode === "cards" ? (
          <ProductosCards
            productos={displayedProductos}
            loading={displayedLoading}
            activeColorId={idColorFilter}
            onEditProducto={handleEditProducto}
            onDeleteProducto={handleDeleteProducto}
          />
        ) : (
          <ProductosTable
            productos={displayedProductos}
            loading={displayedLoading}
            activeColorId={idColorFilter}
            onEditProducto={handleEditProducto}
            onDeleteProducto={handleDeleteProducto}
          />
        )}

        {isSucursalResolved && (
          <ProductosPagination
            totalElements={displayedTotalElements}
            totalPages={displayedTotalPages}
            page={displayedPage}
            onPageChange={handleDisplayedPageChange}
            itemLabel={isVariantView ? "variantes" : "productos"}
          />
        )}
      </section>

      <ProductoDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={handleDeleteConfirmed}
      />

      <ProductoVarianteEditDialog
        open={editVariantTarget !== null}
        target={editVariantTarget}
        initialImages={
          editVariantTarget
            ? getImagenesForVariant(editVariantTarget.productId, editVariantTarget.colorId)
                .filter((img): img is VarianteResumenImagen & { idColorImagen: number } =>
                  typeof img.idColorImagen === "number" && img.idColorImagen > 0
                )
                .map((img) => ({
                  idColorImagen: img.idColorImagen,
                  url: img.url,
                  urlThumb: img.urlThumb,
                  orden: img.orden,
                  esPrincipal: img.esPrincipal,
                }))
            : []
        }
        onOpenChange={(open) => {
          if (!open) setEditVariantTarget(null)
        }}
        onUpdate={handleVariantUpdateConfirmed}
        onGenerateBarcode={handleGenerateBarcodeForEdit}
        isGeneratingBarcode={isGeneratingBarcode}
        onStockMovementSuccess={() => {
          refreshVariantesView()
          refreshProductosView()
        }}
      />

      <ProductoVarianteDeleteDialog
        open={deleteVariantTarget !== null}
        target={deleteVariantTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteVariantTarget(null)
        }}
        onDelete={handleVariantDeleteConfirmed}
      />

      <VarianteBarcodeDialog
        open={barcodeTarget !== null}
        target={barcodeTarget}
        onOpenChange={(open) => {
          if (!open) setBarcodeTarget(null)
        }}
      />

      <BarcodeListDialog
        open={showBarcodeList}
        onOpenChange={setShowBarcodeList}
        idSucursal={resolvedSucursalId}
      />

      <AgregarStockModal
        key={`stock-modal-${stockModalSession}`}
        open={stockModalOpen}
        onOpenChange={setStockModalOpen}
        defaultIdSucursal={stockModalDefaults.idSucursal}
        defaultCodigoBarras={stockModalDefaults.codigoBarras}
        defaultQuery={stockModalDefaults.query}
        onSuccess={() => {
          if (isVariantView) {
            refreshVariantesView()
          } else {
            refreshProductosView()
          }
        }}
      />
    </div>
  )
}
