import { ofertaEstaVigente, obtenerTextoExpiracionOferta, tienePrecioOfertaValido } from "@/lib/oferta-utils"
import type {
  ProductoResumen,
  ProductoResumenTalla,
  StockSucursalVenta,
} from "@/lib/types/producto"
import type { VentaLineaPrecioOption, VentaLineaPrecioTipo } from "@/lib/types/venta-price"

export type CatalogViewMode = "productos" | "variantes"

export interface CatalogVariantSelection {
  colorId: number
  tallaId: number
}

export interface CatalogEditableItem {
  id: number
  varianteId?: number
  talla: string
  color: string
}

export interface CatalogVariantItem {
  key: string
  variantId: number | null
  productId: number
  productName: string
  productStatus: string
  categoryName: string
  colorId: number
  colorName: string
  colorHex: string | null
  tallaId: number
  tallaName: string
  sku: string | null
  codigoBarras: string | null
  stock: number | null
  stocksSucursalesVenta: StockSucursalVenta[]
  estado: string
  imageUrl: string | null
  regularPrice: number
  wholesalePrice: number | null
  offerPrice: number | null
  offerStart: string | null
  offerEnd: string | null
  displayPrice: number
  priceOptions: VentaLineaPrecioOption[]
  defaultPriceType: VentaLineaPrecioTipo
  offerCopy: string | null
  product: ProductoResumen
  selection: CatalogVariantSelection
}

export interface CatalogVariantCartSelection {
  id: number
  varianteId: number
  nombre: string
  precio: number
  precioSeleccionado: VentaLineaPrecioTipo
  preciosDisponibles: VentaLineaPrecioOption[]
  cantidad: number
  stockDisponible: number | null
  talla: string
  color: string
  imageUrl: string | null
}

function normalizeLabel(value: string | null | undefined, fallback: string) {
  const trimmed = String(value ?? "").trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizeSearchText(value: string | null | undefined) {
  return normalizeLabel(value, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function isActiveStatus(value: string | null | undefined) {
  return normalizeLabel(value, "ACTIVO").toUpperCase() === "ACTIVO"
}

function buildVariantPriceOptions(
  talla: ProductoResumenTalla,
  currentDate: Date
): VentaLineaPrecioOption[] {
  const regularPrice = typeof talla.precio === "number" ? talla.precio : 0
  const options: VentaLineaPrecioOption[] = [
    {
      type: "normal",
      label: "Precio Unidad",
      precio: regularPrice,
      description: "Precio regular",
    },
  ]

  if (
    typeof talla.precioOferta === "number" &&
    tienePrecioOfertaValido(talla) &&
    ofertaEstaVigente(talla, currentDate)
  ) {
    options.push({
      type: "oferta",
      label: "Precio Oferta",
      precio: talla.precioOferta,
      description: obtenerTextoExpiracionOferta(talla, currentDate) ?? "Oferta vigente",
    })
  }

  if (
    typeof talla.precioMayor === "number" &&
    Number.isFinite(talla.precioMayor) &&
    talla.precioMayor > 0
  ) {
    options.push({
      type: "mayor",
      label: "Precio por Mayor",
      precio: talla.precioMayor,
      description: "Precio por mayor",
    })
  }

  return options
}

function getDefaultPriceType(options: VentaLineaPrecioOption[]): VentaLineaPrecioTipo {
  return options.some((option) => option.type === "oferta") ? "oferta" : "normal"
}

export function isCatalogVariantAvailable(
  item: Pick<CatalogVariantItem, "productStatus" | "estado" | "stock">
) {
  const stockDisponible = item.stock === null || item.stock > 0
  return isActiveStatus(item.productStatus) && isActiveStatus(item.estado) && stockDisponible
}

export function matchesCatalogVariantItem(
  item: CatalogEditableItem,
  variant: CatalogVariantItem
) {
  if (typeof item.varianteId === "number" && item.varianteId > 0 && variant.variantId !== null) {
    return item.varianteId === variant.variantId
  }

  return (
    item.id === variant.productId &&
    normalizeLabel(item.color, "").toUpperCase() === normalizeLabel(variant.colorName, "").toUpperCase() &&
    normalizeLabel(item.talla, "").toUpperCase() === normalizeLabel(variant.tallaName, "").toUpperCase()
  )
}

export function matchesCatalogVariantQuery(
  item: CatalogVariantItem,
  query: string
) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const searchableText = [
    item.productName,
    item.categoryName,
    item.colorName,
    item.tallaName,
    item.sku ?? "",
    item.product.descripcion,
    item.product.nombreSucursal,
    item.stocksSucursalesVenta.map((stockItem) => stockItem.nombreSucursal).join(" "),
  ]
    .map((value) => normalizeSearchText(value))
    .join(" ")

  return searchableText.includes(normalizedQuery)
}

export function buildCatalogVariantCartSelection(
  variant: CatalogVariantItem,
  cantidad = 1
): CatalogVariantCartSelection {
  const selectedOption =
    variant.priceOptions.find((option) => option.type === variant.defaultPriceType) ??
    variant.priceOptions[0] ??
    null

  return {
    id: variant.productId,
    varianteId: variant.variantId ?? 0,
    nombre: variant.productName,
    precio: selectedOption?.precio ?? variant.displayPrice,
    precioSeleccionado: selectedOption?.type ?? variant.defaultPriceType,
    preciosDisponibles: variant.priceOptions,
    cantidad,
    stockDisponible: variant.stock,
    talla: variant.tallaName,
    color: variant.colorName,
    imageUrl: variant.imageUrl,
  }
}

export function buildCatalogVariantItems(
  products: ProductoResumen[],
  currentDate: Date = new Date()
): CatalogVariantItem[] {
  const items: CatalogVariantItem[] = []

  products.forEach((product) => {
    product.colores.forEach((color) => {
      color.tallas.forEach((talla) => {
        const priceOptions = buildVariantPriceOptions(talla, currentDate)
        const defaultPriceType = getDefaultPriceType(priceOptions)
        const selectedPrice =
          priceOptions.find((option) => option.type === defaultPriceType)?.precio ??
          priceOptions[0]?.precio ??
          0

        items.push({
          key: `${product.idProducto}-${color.colorId}-${talla.tallaId}-${talla.idProductoVariante ?? "variant"}`,
          variantId:
            typeof talla.idProductoVariante === "number" && talla.idProductoVariante > 0
              ? talla.idProductoVariante
              : null,
          productId: product.idProducto,
          productName: normalizeLabel(product.nombre, "Producto sin nombre"),
          productStatus: normalizeLabel(product.estado, "ACTIVO"),
          categoryName: normalizeLabel(product.nombreCategoria, "Sin categoria"),
          colorId: color.colorId,
          colorName: normalizeLabel(color.nombre, `Color #${color.colorId}`),
          colorHex: color.hex,
          tallaId: talla.tallaId,
          tallaName: normalizeLabel(talla.nombre, `Talla #${talla.tallaId}`),
          sku: normalizeLabel(talla.sku, "") || null,
          codigoBarras: normalizeLabel(talla.codigoBarras, "") || null,
          stock: typeof talla.stock === "number" ? talla.stock : null,
          stocksSucursalesVenta: Array.isArray(talla.stocksSucursalesVenta)
            ? talla.stocksSucursalesVenta
            : [],
          estado: normalizeLabel(talla.estado, "ACTIVO"),
          imageUrl: color.imagenPrincipal?.url || color.imagenPrincipal?.urlThumb || null,
          regularPrice: typeof talla.precio === "number" ? talla.precio : 0,
          wholesalePrice:
            typeof talla.precioMayor === "number" && Number.isFinite(talla.precioMayor)
              ? talla.precioMayor
              : null,
          offerPrice:
            typeof talla.precioOferta === "number" && Number.isFinite(talla.precioOferta)
              ? talla.precioOferta
              : null,
          offerStart: typeof talla.ofertaInicio === "string" ? talla.ofertaInicio : null,
          offerEnd: typeof talla.ofertaFin === "string" ? talla.ofertaFin : null,
          displayPrice: selectedPrice,
          priceOptions,
          defaultPriceType,
          offerCopy:
            priceOptions.find((option) => option.type === "oferta")?.description ?? null,
          product,
          selection: {
            colorId: color.colorId,
            tallaId: talla.tallaId,
          },
        })
      })
    })
  })

  return items.sort((a, b) => {
    const availabilityDiff =
      Number(isCatalogVariantAvailable(b)) - Number(isCatalogVariantAvailable(a))
    if (availabilityDiff !== 0) return availabilityDiff

    const productDiff = a.productName.localeCompare(b.productName)
    if (productDiff !== 0) return productDiff

    const colorDiff = a.colorName.localeCompare(b.colorName)
    if (colorDiff !== 0) return colorDiff

    const tallaDiff = a.tallaName.localeCompare(b.tallaName)
    if (tallaDiff !== 0) return tallaDiff

    return (a.variantId ?? 0) - (b.variantId ?? 0)
  })
}
