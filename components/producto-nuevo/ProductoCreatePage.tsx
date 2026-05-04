"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import {
  ProductoAttributesSidebar,
  type ProductoAttributeSidebarSection,
} from "@/components/producto-nuevo/ProductoAttributesSidebar"
import { CategoriaCreateDialog } from "@/components/categorias/modals/CategoriaCreateDialog"
import { ProductoGeneralInfoCard } from "@/components/producto-nuevo/ProductoGeneralInfoCard"
import { ProductoUnsavedChangesToast } from "@/components/producto-nuevo/ProductoUnsavedChangesToast"
import { ProductoVariantMatrixCard } from "@/components/producto-nuevo/ProductoVariantMatrixCard"
import { ProductoMediaSidebar } from "@/components/producto-nuevo/media/ProductoMediaSidebar"
import { useProductoCreate } from "@/lib/hooks/useProductoCreate"

interface ProductoCreatePageProps {
  productoId?: number | null
}

export function ProductoCreatePage({ productoId = null }: ProductoCreatePageProps) {
  const router = useRouter()
  const [isMediaSidebarOpen, setIsMediaSidebarOpen] = useState(false)
  const [mediaSidebarSession, setMediaSidebarSession] = useState(0)
  const [isAttributesSidebarOpen, setIsAttributesSidebarOpen] = useState(false)
  const [isCategoriaCreateDialogOpen, setIsCategoriaCreateDialogOpen] = useState(false)
  const [attributeSidebarSection, setAttributeSidebarSection] =
    useState<ProductoAttributeSidebarSection>("colors")

  const {
    isEditing,
    loadingDetalle,
    errorDetalle,
    form,
    isSaving,
    activeStockSucursales,
    categoriaComboboxOptions,
    searchCategoria,
    loadingCategorias,
    errorCategorias,
    selectedCategoriaName,
    availableColors,
    availableTallas,
    loadingColores,
    errorColores,
    searchColor,
    setSearchColor,
    colorPage,
    setColorPage,
    colorTotalPages,
    colorTotalElements,
    loadingTallas,
    errorTallas,
    searchTalla,
    setSearchTalla,
    tallaPage,
    setTallaPage,
    tallaTotalPages,
    tallaTotalElements,
    selectedColorIds,
    selectedTallaIds,
    selectedColors,
    selectedTallas,
    focusedColorId,
    mediaByColor,
    replaceMediaByColor,
    variantRows,
    deletingVariantKeys,
    isAutoSkuEnabled,
    isAutoBarcodeEnabled,
    totalSelectedMedia,
    setFocusedColorId,
    handleCategoriaChange,
    setSearchCategoria,
    handleNombreChange,
    handleDescripcionChange,
    handleCreateCategoria,
    handleCreateColor,
    handleCreateTalla,
    toggleColorSelection,
    toggleTallaSelection,
    handleAutoSkuToggle,
    handleAutoBarcodeToggle,
    handleVariantFieldChange,
    handleApplyVariantFieldToAll,
    handleVariantSucursalStockChange,
    handleApplyVariantSucursalStockToAll,
    handleRemoveVariant,
    handleSetVariantStatus,
    saveProducto,
  } = useProductoCreate({ productoId })

  const activePreviewColorId =
    focusedColorId && selectedColors.some((color) => color.idColor === focusedColorId)
      ? focusedColorId
      : (selectedColors[0]?.idColor ?? null)

  const activePreviewImageUrl = activePreviewColorId
    ? (mediaByColor[activePreviewColorId]?.at(-1)?.previewUrl ?? null)
    : null

  const canCreateCategoria = true

  const hasUnsavedChanges = useMemo(() => {
    const hasTextInput =
      form.nombre.trim() !== "" ||
      form.descripcion.trim() !== ""

    const hasSelectInput = form.idCategoria !== null

    const hasAttributesSelected =
      selectedColorIds.length > 0 || selectedTallaIds.length > 0

    const hasMediaSelected = Object.values(mediaByColor).some(
      (media) => media.length > 0
    )

    const hasVariantValues = variantRows.some(
      (variant) =>
        variant.sku.trim() !== "" ||
        variant.precio.trim() !== "" ||
        variant.precioMayor.trim() !== "" ||
        Object.values(variant.stocksSucursales).some((value) => value.trim() !== "")
    )

    return (
      hasTextInput ||
      hasSelectInput ||
      hasAttributesSelected ||
      hasMediaSelected ||
      hasVariantValues
    )
  }, [
    form.descripcion,
    form.idCategoria,
    form.nombre,
    mediaByColor,
    selectedColorIds.length,
    selectedTallaIds.length,
    variantRows,
  ])

  const handleCancelProducto = useCallback(() => {
    router.push("/productos")
    router.refresh()
  }, [router])

  const handleOpenMediaSidebar = useCallback(() => {
    setIsAttributesSidebarOpen(false)
    setMediaSidebarSession((previous) => previous + 1)
    setIsMediaSidebarOpen(true)
  }, [])

  const handleOpenAttributesSidebar = useCallback(
    (section: ProductoAttributeSidebarSection) => {
      setIsMediaSidebarOpen(false)
      setAttributeSidebarSection(section)
      setIsAttributesSidebarOpen(true)
    },
    []
  )

  const handleSaveProducto = useCallback(async () => {
    const created = await saveProducto()
    if (!created) return

    router.push("/productos")
    router.refresh()
  }, [router, saveProducto])

  if (loadingDetalle) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderSpinner text="Cargando detalle del producto..." />
      </div>
    )
  }

  if (errorDetalle) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
        <div className="mb-3 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorDetalle}</p>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <ProductoGeneralInfoCard
            form={form}
            categoriaOptions={categoriaComboboxOptions}
            searchCategoria={searchCategoria}
            loadingCategorias={loadingCategorias}
            errorCategorias={errorCategorias}
            selectedCategoriaName={selectedCategoriaName}
            selectedColorsCount={selectedColors.length}
            selectedTallasCount={selectedTallas.length}
            variantRowsCount={variantRows.length}
            totalSelectedMedia={totalSelectedMedia}
            selectedColors={selectedColors}
            selectedTallas={selectedTallas}
            activePreviewColorId={activePreviewColorId}
            activePreviewImageUrl={activePreviewImageUrl}
            onOpenImages={handleOpenMediaSidebar}
            onOpenColors={() => {
              handleOpenAttributesSidebar("colors")
            }}
            onOpenTallas={() => {
              handleOpenAttributesSidebar("tallas")
            }}
            onPreviewColorChange={setFocusedColorId}
            onCategoriaChange={handleCategoriaChange}
            onOpenCategoriaCreate={() => setIsCategoriaCreateDialogOpen(true)}
            onSearchCategoriaChange={setSearchCategoria}
            onNombreChange={handleNombreChange}
            onDescripcionChange={handleDescripcionChange}
            canCreateCategoria={canCreateCategoria}
          />
        </div>

        <div className="min-w-0">
          <ProductoVariantMatrixCard
            hasSelectedColors={selectedColors.length > 0}
            hasSelectedTallas={selectedTallas.length > 0}
            stockSucursales={activeStockSucursales}
            variantRows={variantRows}
            mediaByColor={mediaByColor}
            isAutoSkuEnabled={isAutoSkuEnabled}
            isAutoBarcodeEnabled={isAutoBarcodeEnabled}
            onAutoSkuToggle={handleAutoSkuToggle}
            onAutoBarcodeToggle={handleAutoBarcodeToggle}
            onVariantFieldChange={handleVariantFieldChange}
            onApplyVariantFieldToAll={handleApplyVariantFieldToAll}
            onVariantSucursalStockChange={handleVariantSucursalStockChange}
            onApplyVariantSucursalStockToAll={handleApplyVariantSucursalStockToAll}
            deletingVariantKeys={deletingVariantKeys}
            onRemoveVariant={handleRemoveVariant}
            onSetVariantStatus={handleSetVariantStatus}
          />
        </div>
      </div>

      <ProductoAttributesSidebar
        open={isAttributesSidebarOpen}
        activeSection={attributeSidebarSection}
        selectedColorsCount={selectedColors.length}
        selectedTallasCount={selectedTallas.length}
        onOpenChange={setIsAttributesSidebarOpen}
        onSectionChange={setAttributeSidebarSection}
        colorPanelProps={{
          availableColors,
          selectedColors,
          selectedColorIds,
          loadingColores,
          errorColores,
          searchColor,
          onSearchColorChange: setSearchColor,
          colorTotalElements,
          colorTotalPages,
          colorPage,
          onColorPageChange: setColorPage,
          onCreateColor: handleCreateColor,
          onToggleColorSelection: toggleColorSelection,
        }}
        tallaPanelProps={{
          availableTallas,
          selectedTallas,
          selectedTallaIds,
          loadingTallas,
          errorTallas,
          searchTalla,
          onSearchTallaChange: setSearchTalla,
          tallaTotalElements,
          tallaTotalPages,
          tallaPage,
          onTallaPageChange: setTallaPage,
          onCreateTalla: handleCreateTalla,
          onToggleTallaSelection: toggleTallaSelection,
        }}
      />

      <ProductoMediaSidebar
        key={`producto-media-sidebar-${mediaSidebarSession}`}
        open={isMediaSidebarOpen}
        selectedColors={selectedColors}
        mediaByColor={mediaByColor}
        focusedColorId={focusedColorId}
        onOpenChange={setIsMediaSidebarOpen}
        onFocusedColorChange={setFocusedColorId}
        onSaveMediaByColor={replaceMediaByColor}
      />

      <CategoriaCreateDialog
        open={isCategoriaCreateDialogOpen}
        onOpenChange={setIsCategoriaCreateDialogOpen}
        onCreate={handleCreateCategoria}
        initialNombreCategoria={searchCategoria.trim()}
      />

      <ProductoUnsavedChangesToast
        visible={isEditing || hasUnsavedChanges}
        isSaving={isSaving}
        onDiscard={handleCancelProducto}
        onSave={() => {
          void handleSaveProducto()
        }}
      />
    </div>
  )
}
