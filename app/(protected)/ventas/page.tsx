"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { ProductosPagination } from "@/components/productos/ProductosPagination"
import CategoryFilter from "@/components/ventas/CategoryFilter"
import CartItem, { type CartItemData } from "@/components/ventas/CartItem"
import ClientSelect, { type ClientSelection } from "@/components/ventas/ClientSelect"
import PaymentMethod, {
  type MetodoPagoActivo,
  type PaymentKey,
} from "@/components/ventas/PaymentMethod"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useAuth } from "@/lib/auth/auth-context"
import ProductCard from "@/components/ventas/ProductCard"
import ProductModal, { type SelectedVariant } from "@/components/ventas/ProductModal"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useProductos } from "@/lib/hooks/useProductos"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { ProductoResumen } from "@/lib/types/producto"

const DEFAULT_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Generico" }
const TIPO_COMPROBANTE_TICKET = "TICKET"
const IGV_PORCENTAJE_SIN_APLICAR = 0

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

function isEstadoActivo(value: unknown): boolean {
  if (value === true) return true
  if (value === false) return false
  return typeof value === "string" ? value.trim().toUpperCase() === "ACTIVO" : false
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

interface ColorFilterOption {
  name: string
  hex: string | null | undefined
}

function buildColorFilters(productos: ProductoResumen[]): ColorFilterOption[] {
  const colorMap = new Map<string, ColorFilterOption>()

  productos.forEach((producto) => {
    producto.colores.forEach((color) => {
      const name = color.nombre?.trim() ?? ""
      if (!name) return

      const key = name.toLowerCase()
      const previous = colorMap.get(key)
      if (!previous) {
        colorMap.set(key, { name, hex: color.hex })
        return
      }

      if ((previous.hex === null || previous.hex === undefined || previous.hex === "") && color.hex) {
        colorMap.set(key, { name: previous.name, hex: color.hex })
      }
    })
  })

  return Array.from(colorMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function extractVentaId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null

  const source = payload as Record<string, unknown>
  const nestedCandidates = [source.data, source.venta].filter(
    (value): value is Record<string, unknown> => typeof value === "object" && value !== null
  )

  const candidates = [
    source.idVenta,
    source.id_venta,
    source.id,
    ...nestedCandidates.flatMap((candidate) => [
      candidate.idVenta,
      candidate.id_venta,
      candidate.id,
    ]),
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

export default function VentasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)

  const {
    search,
    setSearch,
    displayedProductos,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    error: errorProductos,
    refreshCurrentView,
  } = useProductos()

  const [activeCategory, setActiveCategory] = useState("Todos")
  const [activeColor, setActiveColor] = useState<string | null>(null)

  const [cart, setCart] = useState<CartItemData[]>([])
  const [selectedPayment, setSelectedPayment] = useState<PaymentKey | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientSelection>(DEFAULT_CLIENT)
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [modalProduct, setModalProduct] = useState<ProductoResumen | null>(null)
  const [submittingVenta, setSubmittingVenta] = useState(false)
  const [ventaError, setVentaError] = useState<string | null>(null)
  const [activeMetodosPago, setActiveMetodosPago] = useState<MetodoPagoActivo[] | undefined>(
    undefined
  )

  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

  const categoriasDisponibles = useMemo(() => {
    const values = new Set<string>()
    displayedProductos.forEach((producto) => {
      const categoria = producto.nombreCategoria?.trim()
      if (categoria) values.add(categoria)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [displayedProductos])

  const coloresDisponibles = useMemo(
    () => buildColorFilters(displayedProductos),
    [displayedProductos]
  )

  useEffect(() => {
    if (activeCategory === "Todos") return
    if (categoriasDisponibles.includes(activeCategory)) return
    setActiveCategory("Todos")
  }, [activeCategory, categoriasDisponibles])

  useEffect(() => {
    if (activeColor === null) return
    if (coloresDisponibles.some((color) => color.name.toLowerCase() === activeColor.toLowerCase())) {
      return
    }
    setActiveColor(null)
  }, [activeColor, coloresDisponibles])

  useEffect(() => {
    if (!isAdmin) {
      setSelectedSucursalId(null)
      return
    }

    if (hasValidSucursalId(selectedSucursalId)) return
    if (hasValidSucursalId(user?.idSucursal)) {
      setSelectedSucursalId(user.idSucursal)
    }
  }, [isAdmin, selectedSucursalId, user?.idSucursal])

  const hasSelectedSucursal = hasValidSucursalId(selectedSucursalId)

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasSelectedSucursal &&
      !sucursalOptions.some((option) => option.value === String(selectedSucursalId))
        ? [
            {
              value: String(selectedSucursalId),
              label: `Sucursal #${selectedSucursalId}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [hasSelectedSucursal, selectedSucursalId, sucursalOptions]
  )

  const resolvedSucursalId = isAdmin
    ? hasSelectedSucursal
      ? selectedSucursalId
      : null
    : userHasSucursal
      ? user?.idSucursal ?? null
      : null

  const filteredProductos = useMemo(() => {
    return displayedProductos.filter((producto) => {
      const sameCategory =
        activeCategory === "Todos" || producto.nombreCategoria === activeCategory
      const hasColor =
        activeColor === null ||
        producto.colores.some(
          (color) => color.nombre.trim().toLowerCase() === activeColor.toLowerCase()
        )
      return sameCategory && hasColor
    })
  }, [activeCategory, activeColor, displayedProductos])

  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)
  const selectedMetodoPago = useMemo(() => {
    if (!selectedPayment || !activeMetodosPago) return null
    return activeMetodosPago.find((method) => method.nombre === selectedPayment) ?? null
  }, [activeMetodosPago, selectedPayment])
  const canConfirm =
    cart.length > 0 &&
    selectedPayment !== null &&
    selectedMetodoPago !== null &&
    resolvedSucursalId !== null

  const confirmHint = useMemo(() => {
    if (cart.length === 0) return "Agrega al menos un producto"
    if (resolvedSucursalId === null) {
      return isAdmin
        ? "Selecciona una sucursal"
        : "Tu usuario no tiene sucursal asignada"
    }
    if (selectedPayment === null) return "Selecciona un metodo de pago"
    if (selectedMetodoPago === null) return "Selecciona un metodo de pago valido"
    return ""
  }, [cart.length, isAdmin, resolvedSucursalId, selectedMetodoPago, selectedPayment])

  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const response = await authFetch("/api/config/metodos-pago")
        if (!response.ok) {
          setActiveMetodosPago([])
          return
        }

        const payload = await response.json()
        const pageContent =
          typeof payload === "object" && payload !== null && "content" in payload
            ? (payload as { content?: unknown }).content
            : undefined

        const rawData =
          Array.isArray(payload) ? payload : Array.isArray(pageContent) ? pageContent : []

        const methods: MetodoPagoActivo[] = rawData
          .map((value: unknown): MetodoPagoActivo | null => {
            const item =
              typeof value === "object" && value !== null
                ? (value as Record<string, unknown>)
                : {}
            const idMetodoPago = Number(item.idMetodoPago ?? item.id_metodo_pago ?? item.id)
            const nombre = typeof item.nombre === "string" ? item.nombre : ""
            const estado = item.estado ?? item.activo
            if (estado !== undefined && !isEstadoActivo(estado)) return null
            if (!Number.isFinite(idMetodoPago) || idMetodoPago <= 0 || !nombre) return null
            return { idMetodoPago, nombre }
          })
          .filter((item): item is MetodoPagoActivo => item !== null)

        setActiveMetodosPago(methods)
      } catch {
        setActiveMetodosPago([])
      }
    }

    void fetchMetodos()
  }, [])

  const openModal = useCallback((producto: ProductoResumen) => {
    setModalProduct(producto)
  }, [])

  const handleEditItem = useCallback(
    (item: CartItemData) => {
      const producto = displayedProductos.find((candidate) => candidate.idProducto === item.id)
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

      setModalProduct(producto)
    },
    [displayedProductos]
  )

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
  }, [])

  const updateQty = useCallback(
    (id: number, talla: string, color: string, delta: number, varianteId?: number) => {
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

  const resetVentaDraft = useCallback(() => {
    setCart([])
    setSelectedPayment(null)
    setSelectedClient(DEFAULT_CLIENT)
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

    setSubmittingVenta(true)
    setVentaError(null)
    const ventaPromise = (async () => {
      const body = {
        idSucursal: resolvedSucursalId,
        idCliente: selectedClient.idCliente,
        tipoComprobante: TIPO_COMPROBANTE_TICKET,
        igvPorcentaje: IGV_PORCENTAJE_SIN_APLICAR,
        descuentoTotal: 0,
        tipoDescuento: null,
        detalles: cart.map((item) => ({
          idProductoVariante: item.varianteId as number,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          descuento: 0,
        })),
        pagos: [
          {
            idMetodoPago: selectedMetodoPago.idMetodoPago,
            monto: total,
            referencia: selectedMetodoPago.nombre,
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

      return { ventaId: extractVentaId(data) }
    })()

    toast.promise(ventaPromise, {
      loading: "Registrando venta...",
      success: ({ ventaId }) => ({
        message: "Venta completada",
        action: {
          label: "Ver recibo",
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
      .then(() => {
        resetVentaDraft()
        void refreshCurrentView()
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
    refreshCurrentView,
    resolvedSucursalId,
    resetVentaDraft,
    router,
    selectedClient.idCliente,
    selectedMetodoPago,
    selectedPayment,
    submittingVenta,
    total,
  ])

  return (
    <>
      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onConfirm={addVariantToCart}
      />

      <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-5">
        <div className="flex min-h-0 min-w-0 flex-[7] flex-col gap-3">
          <div className="flex shrink-0 flex-col gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o categoria..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
              <CategoryFilter
                categories={categoriasDisponibles}
                colors={coloresDisponibles}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                activeColor={activeColor}
                onColorChange={setActiveColor}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {filteredProductos.length} producto(s) de {displayedProductos.length} en esta
              pagina.
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
            ) : filteredProductos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {filteredProductos.map((producto) => (
                  <ProductCard key={producto.idProducto} product={producto} onAdd={openModal} />
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
                onPageChange={setDisplayedPage}
              />
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-[300px] max-w-[360px] flex-[3] flex-col gap-2">
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
                    value={hasSelectedSucursal ? String(selectedSucursalId) : ""}
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
              <SectionLabel>Cliente</SectionLabel>
              <div className="flex-1">
                <ClientSelect selected={selectedClient} onSelect={setSelectedClient} />
              </div>
            </div>
          </div>

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

            <div className="min-h-0 flex-1 overflow-y-auto px-4" style={{ scrollbarWidth: "none" }}>
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                  <ShoppingBagIcon className="h-9 w-9 text-slate-200 dark:text-slate-700" />
                  <p className="max-w-[150px] text-xs font-medium leading-snug text-slate-400 dark:text-slate-600">
                    Haz click en un producto para agregar
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
                    onEdit={handleEditItem}
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
                  S/ {total.toFixed(2)}
                </span>
              </div>
            )}
          </Card>

          <div className="flex shrink-0 flex-col gap-2">
            <Card className="p-3.5">
              <SectionLabel>Metodo de Pago</SectionLabel>
              <div className="mt-2.5">
                <PaymentMethod
                  selected={selectedPayment}
                  onSelect={setSelectedPayment}
                  methods={activeMetodosPago}
                />
              </div>
            </Card>

            <div className="flex items-center justify-end">
              <div className="shrink-0 text-right">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Total
                </span>
                <p className="text-2xl font-extrabold leading-tight tabular-nums text-blue-600 dark:text-blue-400">
                  S/ {total.toFixed(2)}
                </p>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                selectedPayment ? "max-h-14 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 rounded-lg border border-amber-300/50 bg-amber-400/10 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-400/5">
                <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-[11px] font-medium leading-tight text-amber-700 dark:text-amber-400">
                  Verifica el pago antes de registrar la venta
                </p>
              </div>
            </div>

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

            <button
              onClick={() => {
                void handleFinalizarVenta()
              }}
              disabled={!canConfirm || submittingVenta}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all duration-200",
                canConfirm && !submittingVenta
                  ? "bg-gradient-to-r from-[#3266E4] to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
              ].join(" ")}
            >
              {submittingVenta ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" /> Registrar Venta
                </>
              )}
            </button>

            {!canConfirm && (
              <p className="-mt-1 text-center text-[11px] text-slate-400 dark:text-slate-600">
                {confirmHint}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
