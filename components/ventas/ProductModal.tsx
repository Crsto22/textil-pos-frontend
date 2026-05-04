"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  CubeIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  ofertaEstaVigente,
  obtenerTextoExpiracionOferta,
  tienePrecioOfertaValido,
} from "@/lib/oferta-utils"
import { resolveBackendUrl } from "@/lib/resolve-backend-url"
import type { CatalogVariantSelection } from "@/lib/catalog-view"
import type {
  VentaLineaPrecioOption,
  VentaLineaPrecioTipo,
} from "@/lib/types/venta-price"
import type {
  ProductoDetalleResponse,
  ProductoResumen,
} from "@/lib/types/producto"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isDetalleResponse(payload: unknown): payload is ProductoDetalleResponse {
  if (!payload || typeof payload !== "object") return false
  if (!("producto" in payload) || !("variantes" in payload) || !("imagenes" in payload)) {
    return false
  }

  const detail = payload as ProductoDetalleResponse
  return Array.isArray(detail.variantes) && Array.isArray(detail.imagenes)
}

function normalizeHexColor(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

interface ColorOption {
  colorId: number
  nombre: string
  hex: string
}

function buildColorOptions(
  detalle: ProductoDetalleResponse | null,
  product: ProductoResumen
): ColorOption[] {
  const colorMap = new Map<number, ColorOption>()

  const pushColor = (colorId: number, nombre: string, hex: string | null | undefined) => {
    if (!Number.isFinite(colorId) || colorId <= 0) return

    const nextValue: ColorOption = {
      colorId,
      nombre: nombre.trim() || `Color #${colorId}`,
      hex: normalizeHexColor(hex),
    }

    const previous = colorMap.get(colorId)
    if (!previous) {
      colorMap.set(colorId, nextValue)
      return
    }

    colorMap.set(colorId, {
      colorId,
      nombre:
        previous.nombre.startsWith("Color #") && !nextValue.nombre.startsWith("Color #")
          ? nextValue.nombre
          : previous.nombre,
      hex: previous.hex === "#94a3b8" ? nextValue.hex : previous.hex,
    })
  }

  detalle?.variantes.forEach((variante) => {
    pushColor(variante.colorId, variante.colorNombre, variante.colorHex)
  })

  detalle?.imagenes.forEach((imagen) => {
    pushColor(imagen.colorId, imagen.colorNombre, imagen.colorHex)
  })

  product.colores.forEach((color) => {
    pushColor(color.colorId, color.nombre, color.hex)
  })

  return Array.from(colorMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

function buildGalleryImages(
  detalle: ProductoDetalleResponse | null,
  selectedColorId: number | null,
  product: ProductoResumen
): string[] {
  const urls: string[] = []
  const pushUrl = (rawUrl: string | null | undefined) => {
    const resolvedUrl = resolveBackendUrl(rawUrl)?.trim()
    if (resolvedUrl) urls.push(resolvedUrl)
  }

  if (detalle && selectedColorId !== null) {
    detalle.imagenes
      .filter((imagen) => imagen.colorId === selectedColorId)
      .sort((a, b) => {
        if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1
        return a.orden - b.orden
      })
      .forEach((imagen) => {
        pushUrl(imagen.url || imagen.urlThumb)
      })
  }

  if (selectedColorId !== null) {
    const summaryColor = product.colores.find((color) => color.colorId === selectedColorId)
    pushUrl(summaryColor?.imagenPrincipal?.url || summaryColor?.imagenPrincipal?.urlThumb)
  }

  product.colores.forEach((color) => {
    pushUrl(color.imagenPrincipal?.url || color.imagenPrincipal?.urlThumb)
  })

  return Array.from(new Set(urls))
}

function getStockLevelClass(stock: number): string {
  if (stock > 10) return "bg-emerald-500"
  if (stock > 0) return "bg-amber-500"
  return "bg-rose-500"
}

function getEffectiveStock(
  variante: ProductoDetalleResponse["variantes"][number],
  idSucursal: number | null
): number {
  if (!idSucursal) return variante.stock
  const entry = variante.stocksSucursales.find((s) => s.idSucursal === idSucursal)
  return entry?.cantidad ?? variante.stock
}

function buildVariantPriceOptions(
  variant: ProductoDetalleResponse["variantes"][number] | null,
  currentDate: Date
): VentaLineaPrecioOption[] {
  if (!variant) return []

  const options: VentaLineaPrecioOption[] = [
    {
      type: "normal",
      label: "Precio Unidad",
      precio: variant.precio,
      description: "Precio regular",
    },
  ]

  if (
    typeof variant.precioOferta === "number" &&
    tienePrecioOfertaValido(variant) &&
    ofertaEstaVigente(variant, currentDate)
  ) {
    options.push({
      type: "oferta",
      label: "Precio Oferta",
      precio: variant.precioOferta,
      description: obtenerTextoExpiracionOferta(variant, currentDate) ?? "Oferta vigente",
    })
  }

  if (
    typeof variant.precioMayor === "number" &&
    Number.isFinite(variant.precioMayor) &&
    variant.precioMayor > 0
  ) {
    options.push({
      type: "mayor",
      label: "Precio por Mayor",
      precio: variant.precioMayor,
      description: "Precio por mayor",
    })
  }

  return options
}

function getDefaultPriceType(options: VentaLineaPrecioOption[]): VentaLineaPrecioTipo {
  return options.some((option) => option.type === "oferta") ? "oferta" : "normal"
}

export interface SelectedVariant {
  id: number
  varianteId: number
  nombre: string
  precio: number
  precioSeleccionado: VentaLineaPrecioTipo
  preciosDisponibles: VentaLineaPrecioOption[]
  talla: string
  tallaId: number
  color: string
  colorId: number
  cantidad: number
  stockDisponible: number | null
  sku: string
  imageUrl?: string | null
}

interface ProductModalProps {
  product: ProductoResumen | null
  onClose: () => void
  onConfirm: (variant: SelectedVariant) => void
  initialSelection?: CatalogVariantSelection | null
  idSucursal?: number | null
}

export default function ProductModal({
  product,
  onClose,
  onConfirm,
  initialSelection = null,
  idSucursal = null,
}: ProductModalProps) {
  const [detalle, setDetalle] = useState<ProductoDetalleResponse | null>(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null)
  const [selectedTallaId, setSelectedTallaId] = useState<number | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [currentImgIdx, setCurrentImgIdx] = useState(0)
  const [offerClock, setOfferClock] = useState(() => Date.now())

  useEffect(() => {
    if (!product) return

    setOfferClock(Date.now())
    const intervalId = window.setInterval(() => {
      setOfferClock(Date.now())
    }, 15000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [product])

  useEffect(() => {
    if (!product) {
      setDetalle(null)
      setDetalleError(null)
      setDetalleLoading(false)
      setSelectedColorId(null)
      setSelectedTallaId(null)
      setCantidad(1)
      setCurrentImgIdx(0)
      return
    }

    const controller = new AbortController()

    setDetalle(null)
    setDetalleError(null)
    setDetalleLoading(true)
    setSelectedColorId(null)
    setSelectedTallaId(null)
    setCantidad(1)
    setCurrentImgIdx(0)

    const loadDetalle = async () => {
      try {
        const response = await authFetch(`/api/producto/detalle/${product.idProducto}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        const payload = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "No se pudo cargar el detalle del producto"

          setDetalleError(message)
          return
        }

        if (!isDetalleResponse(payload)) {
          setDetalleError("El detalle del producto no tiene el formato esperado")
          return
        }

        setDetalle(payload)
      } catch (error) {
        if (isAbortError(error)) return
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el detalle del producto"
        setDetalleError(message)
      } finally {
        if (!controller.signal.aborted) {
          setDetalleLoading(false)
        }
      }
    }

    void loadDetalle()

    return () => {
      controller.abort()
    }
  }, [product])

  const colorOptions = useMemo(() => {
    if (!product) return []
    return buildColorOptions(detalle, product)
  }, [detalle, product])

  useEffect(() => {
    if (!product) return

    if (colorOptions.length === 0) {
      setSelectedColorId(null)
      return
    }

    setSelectedColorId((previous) => {
      if (
        initialSelection &&
        colorOptions.some((color) => color.colorId === initialSelection.colorId)
      ) {
        return initialSelection.colorId
      }

      if (previous !== null && colorOptions.some((color) => color.colorId === previous)) {
        return previous
      }
      return colorOptions[0].colorId
    })
  }, [colorOptions, initialSelection, product])

  const variantesPorColor = useMemo(() => {
    if (!detalle || selectedColorId === null) return []

    return detalle.variantes
      .filter((variante) => variante.colorId === selectedColorId)
      .sort((a, b) => a.tallaNombre.localeCompare(b.tallaNombre))
  }, [detalle, selectedColorId])

  useEffect(() => {
    if (!product) return

    if (variantesPorColor.length === 0) {
      setSelectedTallaId(null)
      setCantidad(1)
      return
    }

    const preferredTallaId =
      initialSelection && selectedColorId === initialSelection.colorId
        ? initialSelection.tallaId
        : null

    setSelectedTallaId((previous) => {
      if (
        preferredTallaId !== null &&
        variantesPorColor.some((variante) => variante.tallaId === preferredTallaId)
      ) {
        return preferredTallaId
      }

      if (
        previous !== null &&
        variantesPorColor.some(
          (variante) =>
            variante.tallaId === previous &&
            variante.estado === "ACTIVO" &&
            getEffectiveStock(variante, idSucursal) > 0
        )
      ) {
        return previous
      }

      const firstAvailable = variantesPorColor.find(
        (variante) => variante.estado === "ACTIVO" && getEffectiveStock(variante, idSucursal) > 0
      )
      return firstAvailable?.tallaId ?? variantesPorColor[0].tallaId
    })
    setCantidad(1)
  }, [initialSelection, product, selectedColorId, variantesPorColor])

  const selectedColor = useMemo(
    () => colorOptions.find((color) => color.colorId === selectedColorId) ?? null,
    [colorOptions, selectedColorId]
  )

  const selectedVariante = useMemo(
    () =>
      variantesPorColor.find((variante) => variante.tallaId === selectedTallaId) ?? null,
    [selectedTallaId, variantesPorColor]
  )

  const currentOfferDate = useMemo(() => new Date(offerClock), [offerClock])

  const availablePriceOptions = useMemo(
    () => buildVariantPriceOptions(selectedVariante, currentOfferDate),
    [currentOfferDate, selectedVariante]
  )

  const defaultPriceType = useMemo(
    () => getDefaultPriceType(availablePriceOptions),
    [availablePriceOptions]
  )

  const selectedPriceOption = useMemo(
    () =>
      availablePriceOptions.find((option) => option.type === defaultPriceType) ??
      availablePriceOptions[0] ??
      null,
    [availablePriceOptions, defaultPriceType]
  )

  const galleryImages = useMemo(() => {
    if (!product) return []
    return buildGalleryImages(detalle, selectedColorId, product)
  }, [detalle, product, selectedColorId])

  useEffect(() => {
    setCurrentImgIdx(0)
  }, [selectedColorId, product?.idProducto])

  useEffect(() => {
    if (currentImgIdx < galleryImages.length) return
    setCurrentImgIdx(0)
  }, [currentImgIdx, galleryImages.length])

  const maxCantidad = useMemo(() => {
    if (!selectedVariante) return 1
    return Math.max(1, getEffectiveStock(selectedVariante, idSucursal))
  }, [selectedVariante, idSucursal])

  useEffect(() => {
    setCantidad((previous) => Math.min(Math.max(previous, 1), maxCantidad))
  }, [maxCantidad])

  useEffect(() => {
    if (!product) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowLeft" && galleryImages.length > 1) {
        setCurrentImgIdx((previous) =>
          previous === 0 ? galleryImages.length - 1 : previous - 1
        )
      }
      if (event.key === "ArrowRight" && galleryImages.length > 1) {
        setCurrentImgIdx((previous) => (previous + 1) % galleryImages.length)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [galleryImages.length, onClose, product])

  if (!product) return null

  const effectiveStock = selectedVariante ? getEffectiveStock(selectedVariante, idSucursal) : 0

  const canConfirm =
    selectedVariante !== null &&
    selectedVariante.estado === "ACTIVO" &&
    effectiveStock > 0 &&
    cantidad > 0 &&
    cantidad <= effectiveStock

  const displayPrice =
    selectedPriceOption?.precio ?? selectedVariante?.precio ?? product.precioMin ?? 0
  const showBasePriceReference =
    selectedVariante !== null &&
    selectedPriceOption !== null &&
    selectedPriceOption.type !== "normal" &&
    selectedVariante.precio > displayPrice
  const subtotal = displayPrice * cantidad

  const handleConfirm = () => {
    if (!canConfirm || !selectedVariante || !selectedColor || !selectedPriceOption) return

    const selectedImageUrl = galleryImages[currentImgIdx] ?? galleryImages[0] ?? null

    onConfirm({
      id: product.idProducto,
      varianteId: selectedVariante.idProductoVariante,
      nombre: detalle?.producto.nombre ?? product.nombre,
      precio: selectedPriceOption.precio,
      precioSeleccionado: selectedPriceOption.type,
      preciosDisponibles: availablePriceOptions,
      talla: selectedVariante.tallaNombre,
      tallaId: selectedVariante.tallaId,
      color: selectedColor.nombre,
      colorId: selectedColor.colorId,
      cantidad,
      stockDisponible: effectiveStock,
      sku: selectedVariante.sku,
      imageUrl: selectedImageUrl,
    })
    onClose()
  }

  const retryLoadDetalle = async () => {
    if (!product) return

    setDetalleError(null)
    setDetalleLoading(true)
    try {
      const response = await authFetch(`/api/producto/detalle/${product.idProducto}`, {
        cache: "no-store",
      })
      const payload = await parseJsonSafe(response)

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "No se pudo cargar el detalle del producto"
        setDetalleError(message)
        return
      }

      if (!isDetalleResponse(payload)) {
        setDetalleError("El detalle del producto no tiene el formato esperado")
        return
      }

      setDetalle(payload)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el detalle del producto"
      setDetalleError(message)
    } finally {
      setDetalleLoading(false)
    }
  }

  return (
    <Dialog
      open={Boolean(product)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="max-h-[92vh]  xl:max-w-[70rem] overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{detalle?.producto.nombre || product.nombre}</DialogTitle>
          <DialogDescription>Selecciona color, talla y cantidad para agregar al pedido.</DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border-slate-200 bg-white/90 text-slate-600 backdrop-blur-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-4 w-4" />
        </Button>

        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden sm:flex-row">
        <section className="relative h-[300px] w-full shrink-0 overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 sm:h-auto sm:w-[44%] sm:border-b-0 sm:border-r">
          {detalleLoading && !detalle ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
          ) : galleryImages.length > 0 ? (
            <Image
              src={galleryImages[currentImgIdx]}
              alt={detalle?.producto.nombre ?? product.nombre}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-contain p-6"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
              <CubeIcon className="h-11 w-11" />
            </div>
          )}

          {detalleLoading && detalle && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
              <ArrowPathIcon className="h-7 w-7 animate-spin text-white" />
            </div>
          )}

          {galleryImages.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 px-2">
              {galleryImages.map((image, idx) => (
                <Button
                  type="button"
                  key={`${image}-${idx}`}
                  onClick={() => setCurrentImgIdx(idx)}
                  variant="ghost"
                  size="icon-xs"
                  className={`h-1.5 rounded-full p-0 transition-all hover:bg-transparent ${
                    idx === currentImgIdx ? "w-5 bg-white" : "w-2 bg-white/60"
                  }`}
                  aria-label={`Imagen ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7">
          {detalleLoading && !detalle ? (
            <div className="space-y-5">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>

              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {detalle?.producto.nombreCategoria || product.nombreCategoria || "Sin categoria"}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {detalle?.producto.estado || product.estado}
                  </span>
                </div>

                <h3 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
                  {detalle?.producto.nombre || product.nombre}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {selectedVariante?.sku ? (
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 font-mono dark:border-slate-700">
                      SKU: {selectedVariante.sku}
                    </span>
                  ) : (
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 font-mono dark:border-slate-700">
                      SKU por variante
                    </span>
                  )}
                </div>

                {showBasePriceReference && selectedVariante && (
                  <p className="pt-1 text-sm font-semibold text-slate-500 line-through dark:text-slate-400">
                    {formatMonedaPen(selectedVariante.precio)}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-0.5">
                  <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatMonedaPen(displayPrice)}
                  </p>
                </div>
                {selectedPriceOption?.description ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {selectedPriceOption.description}
                  </p>
                ) : null}
              </div>

              {detalleError && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300">
                  <p className="font-semibold">No se pudo cargar el detalle completo.</p>
                  <p className="mt-1">{detalleError}</p>
                  <Button
                    type="button"
                    onClick={retryLoadDetalle}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-500/50 dark:text-amber-300 dark:hover:bg-amber-500/20"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" /> Reintentar
                  </Button>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.length === 0 ? (
                      <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Sin colores
                      </span>
                    ) : (
                      colorOptions.map((color) => (
                        <Button
                          type="button"
                          key={color.colorId}
                          onClick={() => setSelectedColorId(color.colorId)}
                          variant="outline"
                          size="sm"
                          className={`inline-flex items-center gap-2 text-xs font-semibold transition-colors ${
                            selectedColorId === color.colorId
                              ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/15 dark:text-blue-300"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/70"
                            style={{ backgroundColor: color.hex }}
                            aria-hidden="true"
                          />
                          {color.nombre}
                        </Button>
                      ))
                    )}
                  </div>
                </div>

                {selectedColor && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {selectedColor.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Stock color: {variantesPorColor.reduce((sum, item) => sum + getEffectiveStock(item, idSucursal), 0)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {variantesPorColor.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          Sin tallas registradas para este color
                        </div>
                      ) : (
                        variantesPorColor.map((variante) => {
                          const stockVariante = getEffectiveStock(variante, idSucursal)
                          const agotado = variante.estado !== "ACTIVO" || stockVariante <= 0
                          const selected = variante.tallaId === selectedTallaId
                          const showOfferPrice =
                            tienePrecioOfertaValido(variante) &&
                            ofertaEstaVigente(variante, currentOfferDate)
                          const offerCopy = showOfferPrice
                            ? obtenerTextoExpiracionOferta(variante, currentOfferDate)
                            : null

                          return (
                            <Button
                              type="button"
                              key={variante.idProductoVariante}
                              onClick={() => setSelectedTallaId(variante.tallaId)}
                              variant="outline"
                              className={`h-auto flex-col items-stretch justify-start rounded-xl px-3 py-2 text-left transition-colors ${
                                selected
                                  ? "border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/15"
                                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                              } ${agotado ? "opacity-60" : ""}`}
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  Talla {variante.tallaNombre}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span
                                    className={`h-2 w-2 rounded-full ${getStockLevelClass(stockVariante)}`}
                                  />
                                  {stockVariante} u.
                                </span>
                              </div>

                              <div className="mt-2">
                                {showOfferPrice ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium leading-none text-slate-500 line-through dark:text-slate-400">
                                      {formatMonedaPen(variante.precio)}
                                    </p>
                                    <p className="text-xl font-extrabold leading-none text-emerald-700 dark:text-emerald-300">
                                      {formatMonedaPen(variante.precioOferta)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xl font-extrabold leading-none text-blue-700 dark:text-blue-300">
                                    {formatMonedaPen(variante.precio)}
                                  </p>
                                )}
                              </div>
                              {offerCopy && (
                                <p className="mt-2 text-[11px] font-medium leading-snug text-emerald-600 dark:text-emerald-400">
                                  {offerCopy}
                                </p>
                              )}
                            </Button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cantidad</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                      <Button
                        type="button"
                        onClick={() => setCantidad((previous) => Math.max(1, previous - 1))}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <span className="w-9 text-center text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                        {cantidad}
                      </span>
                      <Button
                        type="button"
                        onClick={() =>
                          setCantidad((previous) => Math.min(maxCantidad, previous + 1))
                        }
                        disabled={!selectedVariante || effectiveStock <= 0}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Subtotal</p>
                      <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatMonedaPen(subtotal)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="mt-2 h-12 w-full rounded-2xl text-sm font-bold"
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  {canConfirm
                    ? `Agregar al pedido - ${formatMonedaPen(subtotal)}`
                    : !selectedColorId
                      ? "Selecciona un color"
                      : !selectedTallaId
                        ? "Selecciona una talla"
                        : "Sin stock disponible"}
                </Button>
              </div>
            </>
          )}
        </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
