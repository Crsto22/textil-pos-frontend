"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Search, CheckCircle, ShoppingBag, FileText,
    Clock, Hash, Package, MessageCircle, AlertTriangle, Loader2
} from "lucide-react"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ProductoResumen, PageResponse } from "@/lib/types/producto"
import CategoryFilter from "@/components/ventas/CategoryFilter"
import ProductCard from "@/components/ventas/ProductCard"
import CartItem, { type CartItemData } from "@/components/ventas/CartItem"
import PaymentMethod, { type PaymentKey, type MetodoPagoActivo, PAYMENT_BACKEND_MAP } from "@/components/ventas/PaymentMethod"
import ClientSelect, { type ClientSelection } from "@/components/ventas/ClientSelect"
import ProductModal, { type SelectedVariant } from "@/components/ventas/ProductModal"

const DEFAULT_CLIENT: ClientSelection = { idCliente: null, nombre: "Cliente Genérico" }

/* ─── Live clock ─────────────────────────────────────────── */
function LiveClock() {
    const [time, setTime] = useState("")
    useEffect(() => {
        const tick = () =>
            setTime(new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])
    return (
        <span className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />{time}
        </span>
    )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm ${className}`}>
            {children}
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{children}</p>
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function VentasPage() {
    /* ── catalog state ── */
    const [productos, setProductos] = useState<ProductoResumen[]>([])
    const [loadingProductos, setLoadingProductos] = useState(true)
    const [errorProductos, setErrorProductos] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState("Todos")
    const [activeColor, setActiveColor] = useState<string | null>(null)

    /* ── order state ── */
    const [cart, setCart] = useState<CartItemData[]>([])
    const [selectedPayment, setSelectedPayment] = useState<PaymentKey | null>(null)
    const [showInvoice, setShowInvoice] = useState(false)
    const [voucherNum, setVoucherNum] = useState("")
    const [selectedClient, setSelectedClient] = useState<ClientSelection>(DEFAULT_CLIENT)
    const [modalProduct, setModalProduct] = useState<ProductoResumen | null>(null)
    const [submittingVenta, setSubmittingVenta] = useState(false)
    const [ventaError, setVentaError] = useState<string | null>(null)
    const [activeMetodosPago, setActiveMetodosPago] = useState<MetodoPagoActivo[] | undefined>(undefined)

    /* ── fetch products from backend ── */
    const loadProductos = useCallback(async () => {
        setLoadingProductos(true)
        setErrorProductos(null)
        try {
            const res = await authFetch("/api/producto/listar-resumen?page=0")
            if (!res.ok) throw new Error("Error al cargar productos")
            const data: PageResponse<ProductoResumen> = await res.json()
            setProductos(Array.isArray(data.content) ? data.content : [])
        } catch (e) {
            setErrorProductos(e instanceof Error ? e.message : "Error inesperado")
        } finally {
            setLoadingProductos(false)
        }
    }, [])

    useEffect(() => { loadProductos() }, [loadProductos])

    /* ── fetch active payment methods ── */
    useEffect(() => {
        const fetchMetodos = async () => {
            try {
                /* Try /activos first, fall back to all methods */
                let res = await authFetch("/api/config/metodos-pago/activos")
                let filterActive = false
                if (!res.ok) {
                    res = await authFetch("/api/config/metodos-pago")
                    filterActive = true
                }
                if (!res.ok) { setActiveMetodosPago([]); return }

                const data = await res.json()
                const raw = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []

                let methods: MetodoPagoActivo[] = raw.map((item: any) => ({
                    idMetodoPago: item.idMetodoPago ?? item.id_metodo_pago ?? item.id ?? 0,
                    nombre: item.nombre ?? "",
                }))

                if (filterActive) {
                    methods = methods.filter((_, i) => {
                        const src = raw[i]
                        return src.activo === "ACTIVO" || src.activo === true || src.estado === "ACTIVO"
                    })
                }

                setActiveMetodosPago(methods)
            } catch {
                setActiveMetodosPago([])
            }
        }
        fetchMetodos()
    }, [])

    /* ── filter ── */
    const filteredProductos = productos.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
        const matchCategory = activeCategory === "Todos" || p.nombreCategoria === activeCategory
        const matchColor = !activeColor || p.colores.some(c => c.nombre.toLowerCase() === activeColor.toLowerCase())
        return matchSearch && matchCategory && matchColor
    })

    const total = cart.reduce((sum, c) => sum + c.precio * c.cantidad, 0)
    const totalItems = cart.reduce((s, c) => s + c.cantidad, 0)
    const canConfirm = cart.length > 0 && selectedPayment !== null

    /* ── handlers ── */
    const openModal = useCallback((p: ProductoResumen) => setModalProduct(p), [])

    const handleEditItem = useCallback((item: CartItemData) => {
        const p = productos.find(x => x.idProducto === item.id)
        if (!p) return
        setCart(prev => prev.filter(c => !(c.id === item.id && c.talla === item.talla && c.color === item.color)))
        setModalProduct(p)
    }, [productos])

    const addVariantToCart = useCallback((variant: SelectedVariant) => {
        setCart(prev => {
            const key = (c: CartItemData) => c.id === variant.id && c.color === variant.color && c.talla === variant.talla
            return prev.find(key)
                ? prev.map(c => key(c) ? { ...c, cantidad: c.cantidad + variant.cantidad } : c)
                : [...prev, {
                    id: variant.id,
                    varianteId: variant.varianteId,
                    nombre: variant.nombre,
                    precio: variant.precio,
                    cantidad: variant.cantidad,
                    talla: variant.talla,
                    color: variant.color,
                }]
        })
    }, [])

    const updateQty = useCallback((id: number, talla: string, color: string, delta: number) => {
        setCart(prev => prev.map(c =>
            c.id === id && c.talla === talla && c.color === color
                ? { ...c, cantidad: Math.max(1, c.cantidad + delta) } : c
        ))
    }, [])

    const removeFromCart = useCallback((id: number, talla: string, color: string) => {
        setCart(prev => prev.filter(c => !(c.id === id && c.talla === talla && c.color === color)))
    }, [])

    const handleNewSale = () => {
        setCart([]); setShowInvoice(false); setSelectedPayment(null); setVoucherNum(""); setSelectedClient(DEFAULT_CLIENT); setVentaError(null)
    }

    /* ── Finalize sale → POST /api/venta/crear ── */
    const handleFinalizarVenta = async () => {
        if (!canConfirm || submittingVenta || !selectedPayment) return
        setSubmittingVenta(true)
        setVentaError(null)

        const body = {
            idCliente: selectedClient.idCliente,
            detalles: cart.map(item => ({
                idProductoVariante: item.varianteId ?? 0,
                cantidad: item.cantidad,
                precioUnitario: item.precio,
            })),
            pagos: [{
                metodoPago: PAYMENT_BACKEND_MAP[selectedPayment],
                monto: total,
            }],
        }

        try {
            const res = await authFetch("/api/venta/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                setShowInvoice(true)
            } else {
                const data = await res.json().catch(() => null)
                const msg = data?.message ?? data?.error ?? `Error ${res.status} al registrar la venta`
                setVentaError(msg)
            }
        } catch {
            setVentaError("No se pudo conectar con el servidor. Intente nuevamente.")
        } finally {
            setSubmittingVenta(false)
        }
    }

    const whatsappMsg = encodeURIComponent(
        `✅ Venta Cordex\nCliente: ${selectedClient.nombre}\nTotal: S/ ${total.toFixed(2)}\nMétodo: ${selectedPayment ?? ""}${voucherNum ? `\nNro. Op.: ${voucherNum}` : ""}`
    )

    /* ══ INVOICE ══════════════════════════════════════════ */
    if (showInvoice) {
        const subtotal = total / 1.18; const igv = total - subtotal
        return (
            <div className="max-w-lg mx-auto mt-10">
                <Card className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Venta registrada!</h2>
                        <p className="text-sm text-slate-500">{selectedClient.nombre}</p>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                        {cart.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-300">{item.cantidad}× {item.nombre} <span className="text-xs text-slate-400">({item.talla}/{item.color})</span></span>
                                <span className="font-semibold">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5">
                        <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm text-slate-400"><span>IGV (18%)</span><span>S/ {igv.toFixed(2)}</span></div>
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Total</span>
                            <span className="text-2xl font-bold text-blue-600 tabular-nums">S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-bold shadow-md transition-all active:scale-[0.98]">
                            <MessageCircle className="h-5 w-5" /> Enviar Voucher por WhatsApp
                        </a>
                        <div className="flex gap-3">
                            <button className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                <FileText className="h-4 w-4" /> PDF
                            </button>
                            <button onClick={handleNewSale} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                                Nueva Venta
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    /* ══ MAIN POS ══════════════════════════════════════════ */
    return (
        <>
            <ProductModal
                product={modalProduct}
                onClose={() => setModalProduct(null)}
                onConfirm={addVariantToCart}
            />

            <div className="flex gap-5 h-[calc(100vh-7rem)] min-h-0">

                {/* ═══ LEFT – Catalog ════════════════════════════ */}
                <div className="flex-[7] min-w-0 flex flex-col gap-3 min-h-0">
                    <div className="flex-shrink-0 flex flex-col gap-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder="Buscar producto..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                        </div>
                        <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 px-3.5 py-3 shadow-sm">
                            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory}
                                activeColor={activeColor} onColorChange={setActiveColor} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto pb-4">
                        {loadingProductos ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                <p className="text-sm text-slate-400">Cargando catálogo...</p>
                            </div>
                        ) : errorProductos ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                <Package className="h-12 w-12 text-rose-200 dark:text-rose-800" />
                                <p className="text-sm font-semibold text-slate-500">{errorProductos}</p>
                                <button onClick={loadProductos} className="text-xs text-blue-500 hover:underline">Reintentar</button>
                            </div>
                        ) : filteredProductos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProductos.map(p => <ProductCard key={p.idProducto} product={p} onAdd={openModal} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                                <Package className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" />
                                <p className="text-sm font-semibold text-slate-400">Sin resultados</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT – Panel ═════════════════════════════ */}
                <div className="flex-[3] min-w-[300px] max-w-[360px] flex flex-col min-h-0 gap-2">

                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between py-1">
                        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Panel de Venta</h2>
                        <LiveClock />
                    </div>

                    {/* Cliente — ghost row */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-1">
                        <SectionLabel>Cliente</SectionLabel>
                        <div className="flex-1"><ClientSelect selected={selectedClient} onSelect={setSelectedClient} /></div>
                    </div>

                    {/* Pedido Actual — flex-1, fills height */}
                    <Card className="flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
                            <SectionLabel>Pedido Actual</SectionLabel>
                            <span className={[
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                totalItems > 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400",
                            ].join(" ")}>
                                {totalItems} {totalItems === 1 ? "item" : "items"}
                            </span>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-4" style={{ scrollbarWidth: "none" }}>
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                                    <ShoppingBag className="h-9 w-9 text-slate-200 dark:text-slate-700" />
                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-600 max-w-[150px] leading-snug">
                                        Haz click en un producto para agregar
                                    </p>
                                </div>
                            ) : (
                                cart.map((item, i) => (
                                    <CartItem
                                        key={`${item.id}-${item.talla}-${item.color}-${i}`}
                                        item={item}
                                        onIncrease={id => updateQty(id, item.talla, item.color, 1)}
                                        onDecrease={id => updateQty(id, item.talla, item.color, -1)}
                                        onRemove={id => removeFromCart(id, item.talla, item.color)}
                                        onEdit={handleEditItem}
                                    />
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/60 flex-shrink-0 flex justify-between text-xs text-slate-400">
                                <span>{totalItems} artículo{totalItems !== 1 ? "s" : ""}</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">S/ {total.toFixed(2)}</span>
                            </div>
                        )}
                    </Card>

                    {/* Bottom zone — always visible */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                        <Card className="p-3.5">
                            <SectionLabel>Método de Pago</SectionLabel>
                            <div className="mt-2.5">
                                <PaymentMethod selected={selectedPayment} onSelect={setSelectedPayment} methods={activeMetodosPago} />
                            </div>
                        </Card>

                        {/* Voucher + Total */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 flex-1 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-2.5 py-1.5">
                                <Hash className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0" />
                                <input type="text" placeholder="Nro. Op." value={voucherNum}
                                    onChange={e => setVoucherNum(e.target.value)}
                                    className="flex-1 bg-transparent text-[11px] text-slate-500 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none min-w-0" />
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums leading-tight">
                                    S/ {total.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Warning banner */}
                        <div className={`overflow-hidden transition-all duration-300 ${selectedPayment ? "max-h-14 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="flex items-center gap-2 rounded-lg bg-amber-400/10 dark:bg-amber-400/5 border border-amber-300/50 dark:border-amber-500/20 px-3 py-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 leading-tight">
                                    Verifica el pago antes de registrar la venta
                                </p>
                            </div>
                        </div>

                        {/* Error banner */}
                        {ventaError && (
                            <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 px-3 py-2.5">
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 leading-snug">{ventaError}</p>
                                    <button onClick={() => setVentaError(null)} className="text-[10px] text-red-400 hover:text-red-600 mt-0.5">Cerrar</button>
                                </div>
                            </div>
                        )}

                        {/* Register button */}
                        <button onClick={handleFinalizarVenta} disabled={!canConfirm || submittingVenta}
                            className={[
                                "w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all duration-200",
                                canConfirm && !submittingVenta
                                    ? "bg-gradient-to-r from-[#3266E4] to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-[0.98]"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
                            ].join(" ")}>
                            {submittingVenta ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Registrando...</>
                            ) : (
                                <><CheckCircle className="h-5 w-5" /> Registrar Venta</>
                            )}
                        </button>
                        {!canConfirm && (
                            <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 -mt-1">
                                {cart.length === 0 ? "Agrega al menos un producto" : "Selecciona un método de pago"}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
