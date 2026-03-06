"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"

import { ProductoColorsCard } from "@/components/producto-nuevo/ProductoColorsCard"
import { ProductoGeneralInfoCard } from "@/components/producto-nuevo/ProductoGeneralInfoCard"
import { ProductoTallasCard } from "@/components/producto-nuevo/ProductoTallasCard"
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

  const {
    user,
    isAdmin,
    isEditing,
    loadingDetalle,
    errorDetalle,
    form,
    isSaving,
    sucursalComboboxOptions,
    searchSucursal,
    loadingSucursales,
    errorSucursales,
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
    totalSelectedMedia,
    setFocusedColorId,
    handleSucursalChange,
    handleCategoriaChange,
    setSearchSucursal,
    setSearchCategoria,
    handleNombreChange,
    handleDescripcionChange,
    toggleColorSelection,
    toggleTallaSelection,
    handleVariantFieldChange,
    handleApplyVariantFieldToAll,
    handleVariantOfferToggle,
    handleToggleOfferForAll,
    handleRemoveVariant,
    saveProducto,
  } = useProductoCreate({ productoId })

  const activePreviewColorId =
    focusedColorId && selectedColors.some((color) => color.idColor === focusedColorId)
      ? focusedColorId
      : (selectedColors[0]?.idColor ?? null)

  const activePreviewImageUrl = activePreviewColorId
    ? (mediaByColor[activePreviewColorId]?.at(-1)?.previewUrl ?? null)
    : null

  const hasUnsavedChanges = useMemo(() => {
    const hasTextInput =
      form.nombre.trim() !== "" ||
      form.descripcion.trim() !== ""

    const hasSelectInput =
      form.idCategoria !== null || (isAdmin && form.idSucursal !== null)

    const hasAttributesSelected =
      selectedColorIds.length > 0 || selectedTallaIds.length > 0

    const hasMediaSelected = Object.values(mediaByColor).some(
      (media) => media.length > 0
    )

    const hasVariantValues = variantRows.some(
      (variant) =>
        variant.ofertaActiva ||
        variant.sku.trim() !== "" ||
        variant.precio.trim() !== "" ||
        variant.precioOferta.trim() !== "" ||
        variant.stock.trim() !== ""
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
    form.idSucursal,
    form.nombre,
    isAdmin,
    mediaByColor,
    selectedColorIds.length,
    selectedTallaIds.length,
    variantRows,
  ])

  const handleCancelProducto = useCallback(() => {
    router.push("/productos")
    router.refresh()
  }, [router])

  const handleSaveProducto = useCallback(async () => {
    const created = await saveProducto()
    if (!created) return

    router.push("/productos")
    router.refresh()
  }, [router, saveProducto])

  if (loadingDetalle) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando detalle del producto...
        </div>
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
      <div className="grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <ProductoGeneralInfoCard
            isAdmin={isAdmin}
            nombreSucursal={user?.nombreSucursal}
            form={form}
            sucursalOptions={sucursalComboboxOptions}
            categoriaOptions={categoriaComboboxOptions}
            searchSucursal={searchSucursal}
            searchCategoria={searchCategoria}
            loadingSucursales={loadingSucursales}
            errorSucursales={errorSucursales}
            loadingCategorias={loadingCategorias}
            errorCategorias={errorCategorias}
            selectedCategoriaName={selectedCategoriaName}
            selectedColorsCount={selectedColors.length}
            selectedTallasCount={selectedTallas.length}
            variantRowsCount={variantRows.length}
            totalSelectedMedia={totalSelectedMedia}
            selectedColors={selectedColors}
            activePreviewColorId={activePreviewColorId}
            activePreviewImageUrl={activePreviewImageUrl}
            onOpenImages={() => {
              setMediaSidebarSession((previous) => previous + 1)
              setIsMediaSidebarOpen(true)
            }}
            onPreviewColorChange={setFocusedColorId}
            onSucursalChange={handleSucursalChange}
            onCategoriaChange={handleCategoriaChange}
            onSearchSucursalChange={setSearchSucursal}
            onSearchCategoriaChange={setSearchCategoria}
            onNombreChange={handleNombreChange}
            onDescripcionChange={handleDescripcionChange}
          />
        </div>

        <div className="min-w-0">
          <ProductoVariantMatrixCard
            hasSelectedColors={selectedColors.length > 0}
            hasSelectedTallas={selectedTallas.length > 0}
            variantRows={variantRows}
            onVariantFieldChange={handleVariantFieldChange}
            onApplyVariantFieldToAll={handleApplyVariantFieldToAll}
            onVariantOfferToggle={handleVariantOfferToggle}
            onToggleOfferForAll={handleToggleOfferForAll}
            deletingVariantKeys={deletingVariantKeys}
            onRemoveVariant={handleRemoveVariant}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <ProductoColorsCard
            availableColors={availableColors}
            selectedColors={selectedColors}
            selectedColorIds={selectedColorIds}
            loadingColores={loadingColores}
            errorColores={errorColores}
            searchColor={searchColor}
            onSearchColorChange={setSearchColor}
            colorTotalElements={colorTotalElements}
            colorTotalPages={colorTotalPages}
            colorPage={colorPage}
            onColorPageChange={setColorPage}
            onToggleColorSelection={toggleColorSelection}
          />

          <ProductoTallasCard
            availableTallas={availableTallas}
            selectedTallas={selectedTallas}
            selectedTallaIds={selectedTallaIds}
            loadingTallas={loadingTallas}
            errorTallas={errorTallas}
            searchTalla={searchTalla}
            onSearchTallaChange={setSearchTalla}
            tallaTotalElements={tallaTotalElements}
            tallaTotalPages={tallaTotalPages}
            tallaPage={tallaPage}
            onTallaPageChange={setTallaPage}
            onToggleTallaSelection={toggleTallaSelection}
          />
        </div>
      </div>

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
