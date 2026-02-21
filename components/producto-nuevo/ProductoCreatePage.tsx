"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

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
    totalSelectedMedia,
    setFocusedColorId,
    handleSucursalChange,
    handleCategoriaChange,
    setSearchSucursal,
    setSearchCategoria,
    handleNombreChange,
    handleSkuChange,
    handleDescripcionChange,
    handleCodigoExternoChange,
    toggleColorSelection,
    toggleTallaSelection,
    handleVariantFieldChange,
    handleApplyVariantFieldToAll,
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
      form.sku.trim() !== "" ||
      form.descripcion.trim() !== "" ||
      form.codigoExterno.trim() !== ""

    const hasSelectInput =
      form.idCategoria !== null || (isAdmin && form.idSucursal !== null)

    const hasAttributesSelected =
      selectedColorIds.length > 0 || selectedTallaIds.length > 0

    const hasMediaSelected = Object.values(mediaByColor).some(
      (media) => media.length > 0
    )

    const hasVariantValues = variantRows.some(
      (variant) => variant.precio.trim() !== "" || variant.stock.trim() !== ""
    )

    return (
      hasTextInput ||
      hasSelectInput ||
      hasAttributesSelected ||
      hasMediaSelected ||
      hasVariantValues
    )
  }, [
    form.codigoExterno,
    form.descripcion,
    form.idCategoria,
    form.idSucursal,
    form.nombre,
    form.sku,
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
            onSkuChange={handleSkuChange}
            onCodigoExternoChange={handleCodigoExternoChange}
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
        visible={hasUnsavedChanges}
        isSaving={isSaving}
        onDiscard={handleCancelProducto}
        onSave={() => {
          void handleSaveProducto()
        }}
      />
    </div>
  )
}
