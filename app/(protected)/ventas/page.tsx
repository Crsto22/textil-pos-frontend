"use client"

import { useState } from "react"
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ShoppingCartIcon,
    CreditCardIcon,
    BanknotesIcon,
    DevicePhoneMobileIcon,
    TrashIcon,
    DocumentTextIcon,
    MinusIcon,
    CheckIcon,
} from "@heroicons/react/24/outline"

interface CartItem {
    id: number
    nombre: string
    precio: number
    cantidad: number
    talla: string
    color: string
}

const demoProducts = [
    { id: 1, nombre: "Polo Algodón Básico", precio: 35.00, tallas: ["S", "M", "L", "XL"], colores: ["Negro", "Blanco", "Azul"] },
    { id: 2, nombre: "Jean Slim Fit", precio: 89.90, tallas: ["28", "30", "32", "34"], colores: ["Azul", "Negro"] },
    { id: 3, nombre: "Camisa Formal Slim", precio: 65.00, tallas: ["S", "M", "L"], colores: ["Blanco", "Celeste"] },
    { id: 4, nombre: "Short Deportivo", precio: 29.90, tallas: ["S", "M", "L", "XL"], colores: ["Negro", "Gris"] },
    { id: 5, nombre: "Blusa Estampada", precio: 45.00, tallas: ["S", "M", "L"], colores: ["Rojo", "Floral"] },
    { id: 6, nombre: "Chaqueta Denim", precio: 120.00, tallas: ["M", "L", "XL"], colores: ["Azul", "Negro"] },
]

const paymentMethods = [
    { key: "efectivo", label: "Efectivo", icon: BanknotesIcon },
    { key: "yape", label: "Yape", icon: DevicePhoneMobileIcon },
    { key: "plin", label: "Plin", icon: DevicePhoneMobileIcon },
    { key: "transferencia", label: "Transferencia", icon: CreditCardIcon },
    { key: "tarjeta", label: "Tarjeta", icon: CreditCardIcon },
]

export default function VentasPage() {
    const [search, setSearch] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedPayment, setSelectedPayment] = useState("efectivo")
    const [showInvoice, setShowInvoice] = useState(false)

    const filteredProducts = demoProducts.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase())
    )

    const addToCart = (product: typeof demoProducts[0]) => {
        const existing = cart.find((c) => c.id === product.id)
        if (existing) {
            setCart(cart.map((c) => c.id === product.id ? { ...c, cantidad: c.cantidad + 1 } : c))
        } else {
            setCart([...cart, {
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                cantidad: 1,
                talla: product.tallas[0],
                color: product.colores[0],
            }])
        }
    }

    const updateQty = (id: number, delta: number) => {
        setCart(cart.map((c) => {
            if (c.id === id) {
                const newQty = c.cantidad + delta
                return newQty > 0 ? { ...c, cantidad: newQty } : c
            }
            return c
        }))
    }

    const removeFromCart = (id: number) => {
        setCart(cart.filter((c) => c.id !== id))
    }

    const total = cart.reduce((sum, c) => sum + c.precio * c.cantidad, 0)

    const handleConfirm = () => {
        if (cart.length === 0) return
        setShowInvoice(true)
    }

    const handleNewSale = () => {
        setCart([])
        setShowInvoice(false)
        setSelectedPayment("efectivo")
    }

    return (
        <div className="space-y-6">
            {!showInvoice ? (
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Product selector — left */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                            />
                        </div>

                        {/* Products grid */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] p-4 flex justify-between items-start hover:shadow-md transition-shadow"
                                >
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.nombre}</h3>
                                        <p className="text-lg font-bold text-[#3266E4]">S/ {p.precio.toFixed(2)}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {p.tallas.map((t) => (
                                                <span key={t} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(p)}
                                        className="ml-2 shrink-0 h-9 w-9 rounded-lg bg-[#3266E4] text-white flex items-center justify-center hover:bg-[#2755c7] transition-colors"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart — right */}
                    <div className="lg:col-span-2 bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm flex flex-col h-fit lg:sticky lg:top-6">
                        <div className="p-4 border-b border-gray-100 dark:border-[oklch(0.3_0_0)] flex items-center gap-2">
                            <ShoppingCartIcon className="h-5 w-5 text-[#3266E4]" />
                            <h2 className="font-bold text-gray-900 dark:text-white">Carrito ({cart.length})</h2>
                        </div>

                        {cart.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                                Agrega productos para iniciar una venta
                            </div>
                        ) : (
                            <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-gray-50 dark:border-[oklch(0.2_0_0)] last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{item.nombre}</p>
                                            <p className="text-xs text-gray-400">{item.talla} • {item.color}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                                                <MinusIcon className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                                                <PlusIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white w-20 text-right">
                                            S/ {(item.precio * item.cantidad).toFixed(2)}
                                        </p>
                                        <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 rounded flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Payment method */}
                        {cart.length > 0 && (
                            <div className="p-4 border-t border-gray-100 dark:border-[oklch(0.3_0_0)] space-y-3">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Método de pago</p>
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map((pm) => {
                                        const Icon = pm.icon
                                        return (
                                            <button
                                                key={pm.key}
                                                onClick={() => setSelectedPayment(pm.key)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedPayment === pm.key
                                                        ? "bg-[#3266E4] text-white"
                                                        : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15"
                                                    }`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {pm.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Total + Confirm */}
                        <div className="p-4 border-t border-gray-100 dark:border-[oklch(0.3_0_0)] space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">S/ {total.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={cart.length === 0}
                                className="w-full py-3 rounded-lg bg-[#3266E4] text-white font-bold text-sm hover:bg-[#2755c7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckIcon className="h-4 w-4" />
                                Confirmar Venta
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Invoice preview */
                <div className="max-w-lg mx-auto bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm p-6 space-y-5">
                    <div className="text-center space-y-1">
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                            <CheckIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">¡Venta registrada!</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Factura generada correctamente</p>
                    </div>

                    <div className="border-t border-gray-100 dark:border-[oklch(0.3_0_0)] pt-4 space-y-2">
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">{item.cantidad}x {item.nombre}</span>
                                <span className="font-medium text-gray-900 dark:text-white">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-[oklch(0.3_0_0)] pt-3 flex justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                        <span className="font-bold text-xl text-[#3266E4]">S/ {total.toFixed(2)}</span>
                    </div>

                    <div className="text-xs text-gray-400 text-center">
                        Método: {paymentMethods.find((p) => p.key === selectedPayment)?.label}
                    </div>

                    <div className="flex gap-3">
                        <button className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                            <DocumentTextIcon className="h-4 w-4" />
                            Descargar PDF
                        </button>
                        <button
                            onClick={handleNewSale}
                            className="flex-1 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-bold hover:bg-[#2755c7] transition-colors"
                        >
                            Nueva Venta
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
