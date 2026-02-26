"use client"

import { useState, useEffect } from "react"
import {
    X, ChevronLeft, ChevronRight, Minus, Plus,
    ShoppingBag, Tag, Bookmark, Loader2
} from "lucide-react"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { ProductoResumen } from "@/lib/types/producto"

const ACTIVE_BLUE = "#3266E4"

/* ─── ProductoVariante — real backend shape from producto_variante table ─── */
interface TallaObj { idTalla: number; nombre: string }
interface ColorObj { idColor: number; nombre: string; hex?: string }

interface ProductoVariante {
    varianteId: number
    /* Nested objects — actual JSON from backend */
    talla: TallaObj
    color: ColorObj
    precio: number
    stock: number
    estado: string   // "ACTIVO" | "AGOTADO"
}

export interface SelectedVariant {
    id: number
    varianteId: number
    nombre: string
    precio: number
    talla: string
    tallaId: number
    color: string
    colorId: number
    cantidad: number
    sku: string
}

interface ProductModalProps {
    product: ProductoResumen | null
    onClose: () => void
    onConfirm: (variant: SelectedVariant) => void
}

/* ══════════════════════════════════════════════════════════
   ProductModal
══════════════════════════════════════════════════════════ */
export default function ProductModal({ product, onClose, onConfirm }: ProductModalProps) {
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null)
    const [selectedTallaId, setSelectedTallaId] = useState<number | null>(null)
    const [cantidad, setCantidad] = useState(1)
    const [variantes, setVariantes] = useState<ProductoVariante[]>([])
    const [loadingVariantes, setLoadingVariantes] = useState(false)
    const [variantesFailed, setVariantesFailed] = useState(false)
    /* Per-color image gallery */
    const [imagenesColor, setImagenesColor] = useState<string[]>([])
    const [currentImgIdx, setCurrentImgIdx] = useState(0)
    const [imgFading, setImgFading] = useState(false)
    const [isLoadingImagenes, setIsLoadingImagenes] = useState(false)

    /* ── Init + fetch variants (merged so firstColorId is in scope) ── */
    useEffect(() => {
        if (!product) {
            setVariantes([]); setVariantesFailed(false); return
        }
        /* Reset selections */
        setSelectedTallaId(null)
        setCantidad(1)
        setVariantesFailed(false)

        /* Auto-pick first color */
        const firstColorId = product.colores[0]?.colorId ?? null
        setSelectedColorId(firstColorId)

        /* Fetch per-product variants */
        setLoadingVariantes(true)
        authFetch(`/api/producto/variantes?productoId=${product.idProducto}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then((data: ProductoVariante[]) => {
                const list = Array.isArray(data) ? data : []
                setVariantes(list)
                setVariantesFailed(false)

                /* Auto-select first talla with stock > 0 for the first color */
                if (firstColorId && list.length > 0) {
                    const firstColor = product.colores.find(c => Number(c.colorId) === Number(firstColorId))
                    const firstAvailable = firstColor?.tallas.find(t => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const v = list.find((vv: any) => {
                            const vColorId = Number(vv.color?.idColor ?? vv.colorId ?? vv.color_id)
                            const vTallaId = Number(vv.talla?.idTalla ?? vv.tallaId ?? vv.talla_id)
                            return vColorId === Number(firstColorId) && vTallaId === Number(t.tallaId)
                        })
                        return v && v.stock > 0 && v.estado !== "AGOTADO"
                    })
                    if (firstAvailable) setSelectedTallaId(firstAvailable.tallaId)
                }
            })
            .catch(() => {
                setVariantes([])
                setVariantesFailed(true)
                /* Still auto-select first talla so the UI is usable */
                const firstTalla = product.colores[0]?.tallas[0]?.tallaId ?? null
                if (firstTalla) setSelectedTallaId(firstTalla)
            })
            .finally(() => setLoadingVariantes(false))
    }, [product])

    /* ── Fetch images for selected color ── */
    useEffect(() => {
        setCurrentImgIdx(0)
        setImagenesColor([])

        if (!product || !selectedColorId) {
            const fallback = product?.colores?.[0]?.imagenPrincipal?.url
            setImagenesColor(fallback ? [fallback] : [])
            return
        }
        const selColor = product.colores.find(c => Number(c.colorId) === Number(selectedColorId))
        const principalUrl = selColor?.imagenPrincipal?.url
        if (principalUrl) setImagenesColor([principalUrl])

        setIsLoadingImagenes(true)
        authFetch(`/api/producto/imagenes-color?productoId=${product.idProducto}&colorId=${selectedColorId}`)
            .then(r => r.json())
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((raw: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const arr: any[] = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.content) ? raw.content
                        : Array.isArray(raw?.data) ? raw.data
                            : []

                let urls: string[]
                if (arr.length > 0 && typeof arr[0] === "string") {
                    urls = arr.filter(Boolean)
                } else {
                    urls = arr
                        .sort((a, b) => (a.ordenSugerido ?? a.orden ?? 0) - (b.ordenSugerido ?? b.orden ?? 0))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((img: any) =>
                            img.url ?? img.urlImagen ?? img.imageUrl ?? img.s3Url ?? img.urlS3 ?? ""
                        )
                        .filter(Boolean)
                }

                setImagenesColor(urls.length > 0 ? urls : principalUrl ? [principalUrl] : [])
                setCurrentImgIdx(0)
            })
            .catch(() => {
                if (principalUrl) setImagenesColor([principalUrl])
            })
            .finally(() => setIsLoadingImagenes(false))
    }, [product, selectedColorId])

    /* ── Close handlers ── */
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [onClose])
    useEffect(() => {
        document.body.style.overflow = product ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [product])

    if (!product) return null

    const selectedColor = product.colores.find(c => c.colorId === selectedColorId) ?? product.colores[0] ?? null

    /* ── Images for carousel ── */
    const galleryImages: string[] = imagenesColor.length > 0
        ? imagenesColor
        : [`https://picsum.photos/seed/color-${selectedColorId ?? 0}-${product.idProducto}/480/640`]

    const handlePrev = () => {
        setImgFading(true)
        setTimeout(() => {
            setCurrentImgIdx(i => (i - 1 + galleryImages.length) % galleryImages.length)
            setImgFading(false)
        }, 180)
    }
    const handleNext = () => {
        setImgFading(true)
        setTimeout(() => {
            setCurrentImgIdx(i => (i + 1) % galleryImages.length)
            setImgFading(false)
        }, 180)
    }

    /* ── Variant lookup — handles nested {talla:{idTalla}, color:{idColor}} + flat fallbacks ── */
    const getVariante = (colorId: number, tallaId: number): ProductoVariante | undefined =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variantes.find((v: any) => {
            /* Nested structure (real backend): v.talla.idTalla, v.color.idColor */
            const vColorId = Number(v.color?.idColor ?? v.colorId ?? v.color_id)
            const vTallaId = Number(v.talla?.idTalla ?? v.tallaId ?? v.talla_id)
            return vColorId === Number(colorId) && vTallaId === Number(tallaId)
        }) as ProductoVariante | undefined

    const selectedVariante = selectedColorId && selectedTallaId
        ? getVariante(selectedColorId, selectedTallaId)
        : undefined

    const displayPrice = selectedVariante?.precio
        ?? (selectedColor
            ? (variantes.filter(v => Number(v.color.idColor) === Number(selectedColor.colorId))[0]?.precio ?? product.precioMin)
            : product.precioMin)
        ?? 0

    /* canConfirm:
       - If variants loaded successfully: need a valid variant with stock > 0
       - If variants failed to load (403/network): allow confirm so POS isn't blocked
    */
    const canConfirm = !!selectedColorId && !!selectedTallaId && (
        variantesFailed
            ? true
            : !!selectedVariante && selectedVariante.stock > 0 && selectedVariante.estado !== "AGOTADO"
    )

    const totalStock = selectedVariante?.stock ?? null

    const handleConfirm = () => {
        if (!canConfirm || !selectedColor || !selectedTallaId || !selectedColorId) return
        const talla = selectedColor.tallas.find(t => Number(t.tallaId) === Number(selectedTallaId))
        /* Use real variant price when available; fall back to precioMin when fetch failed */
        const precio = selectedVariante?.precio ?? product.precioMin ?? 0
        onConfirm({
            id: product.idProducto,
            varianteId: selectedVariante?.varianteId ?? 0,
            nombre: product.nombre,
            precio,
            talla: talla?.nombre ?? String(selectedTallaId),
            tallaId: selectedTallaId,
            color: selectedColor.nombre,
            colorId: selectedColorId,
            cantidad,
            sku: product.sku,
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative w-full max-w-5xl bg-white dark:bg-[#0f1117] rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row" style={{ maxHeight: "92vh" }}>

                {/* ─── LEFT: image carousel ─── */}
                <div className="sm:w-1/2 shrink-0 relative overflow-hidden bg-slate-100 dark:bg-slate-800 select-none" style={{ minHeight: 320 }}>
                    {/* Main image */}
                    <img
                        src={galleryImages[currentImgIdx] || galleryImages[0]}
                        alt={product.nombre}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgFading ? "opacity-0" : "opacity-100"}`}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                    {/* Loading skeleton overlay */}
                    {isLoadingImagenes && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-[2px]">
                            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                        </div>
                    )}

                    {/* Navigation arrows */}
                    {galleryImages.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                aria-label="Imagen anterior"
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleNext}
                                aria-label="Imagen siguiente"
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            {/* Dot indicators */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                                {galleryImages.map((_, i) => (
                                    <button key={i} onClick={() => { setImgFading(true); setTimeout(() => { setCurrentImgIdx(i); setImgFading(false) }, 150) }}
                                        className={`h-1.5 rounded-full transition-all duration-200 ${i === currentImgIdx ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ─── RIGHT: action pane ─── */}
                <div className="sm:w-1/2 flex flex-col p-8 gap-5 overflow-y-auto">

                    {/* Close */}
                    <button onClick={onClose}
                        className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-slate-100/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                        <X className="h-4 w-4" />
                    </button>

                    {/* Header */}
                    <div className="pt-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
                                {product.nombreCategoria}
                            </p>
                            {/* SKU — discrete, for seller reference */}
                            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                <Tag className="h-2.5 w-2.5" />{product.sku}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                            {product.nombre}
                        </h2>
                        <p className="text-2xl font-extrabold tabular-nums" style={{ color: ACTIVE_BLUE }}>
                            {displayPrice > 0 ? `S/ ${displayPrice.toFixed(2)}` : "—"}
                        </p>
                    </div>

                    {/* Descripción — structured technical details */}
                    {product.descripcion && (
                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Descripción
                                </p>
                            </div>
                            {product.descripcion.split(/[·\-\n]/).filter(Boolean).map((line, i) => (
                                <p key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex gap-1.5">
                                    <span className="text-blue-400 font-bold mt-0.5">›</span>
                                    {line.trim()}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* ── Color selector ── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Color</p>
                            {selectedColor && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                    {selectedColor.nombre}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {product.colores.map(color => {
                                const isActive = selectedColorId === color.colorId
                                return (
                                    <button key={color.colorId} title={color.nombre}
                                        onClick={() => { setSelectedColorId(color.colorId); setSelectedTallaId(null) }}
                                        style={{
                                            backgroundColor: color.hex ?? "#888",
                                            borderColor: isActive ? ACTIVE_BLUE : "transparent",
                                            boxShadow: isActive ? `0 0 0 3px ${ACTIVE_BLUE}40` : undefined,
                                        }}
                                        className={`h-9 w-9 rounded-full border-[3px] transition-all duration-150 ${isActive ? "scale-110" : "hover:scale-110"}`}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    {/* ── Talla selector — grid-cols-4, h-16, real stock ── */}
                    <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Talla</p>
                        {loadingVariantes ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando stock...
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {(selectedColor?.tallas ?? []).map(talla => {
                                    const variante = selectedColorId ? getVariante(selectedColorId, talla.tallaId) : undefined
                                    const stock = variante?.stock ?? 0
                                    /* disabled only when we have confirmed stock=0 — never when fetch failed */
                                    const agotado = !variantesFailed && (!variante || stock <= 0 || variante.estado === "AGOTADO")
                                    const isActive = Number(selectedTallaId) === Number(talla.tallaId)
                                    return (
                                        <button key={talla.tallaId}
                                            disabled={agotado}
                                            onClick={() => { if (!agotado) setSelectedTallaId(talla.tallaId) }}
                                            style={isActive ? { backgroundColor: ACTIVE_BLUE, borderColor: ACTIVE_BLUE } : undefined}
                                            className={[
                                                "h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all duration-150 select-none",
                                                agotado
                                                    ? "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 cursor-not-allowed opacity-35"
                                                    : isActive
                                                        ? "text-white shadow-md"
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400/60",
                                            ].join(" ")}
                                        >
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className={`text-sm font-bold leading-none ${isActive ? "text-white" : ""}`}>{talla.nombre}</span>
                                                <span className={`text-[10px] opacity-70 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                                                    {loadingVariantes
                                                        ? "..."
                                                        : variante
                                                            ? (agotado ? "Agotado" : `${variante.stock} u.`)
                                                            : "—"
                                                    }
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Cantidad ── */}
                    <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Cantidad</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
                                <button onClick={() => setCantidad(q => Math.max(1, q - 1))}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-10 text-center text-lg font-bold text-slate-900 dark:text-white tabular-nums">{cantidad}</span>
                                <button onClick={() => setCantidad(q => Math.min(Math.max(1, totalStock ?? 99), q + 1))}
                                    disabled={!canConfirm}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-xs text-slate-400">Subtotal</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                                    {displayPrice > 0 ? `S/ ${(displayPrice * cantidad).toFixed(2)}` : "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── CTA ── */}
                    <button onClick={handleConfirm} disabled={!canConfirm}
                        style={canConfirm ? { background: `linear-gradient(135deg, ${ACTIVE_BLUE}, #4f46e5)` } : undefined}
                        className={[
                            "w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 transition-all duration-200",
                            canConfirm
                                ? "text-white shadow-lg active:scale-[0.98]"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
                        ].join(" ")}>
                        <ShoppingBag className="h-5 w-5" />
                        {canConfirm
                            ? `Agregar al Pedido — S/ ${(displayPrice * cantidad).toFixed(2)}`
                            : !selectedColorId ? "Selecciona color"
                                : !selectedTallaId ? "Selecciona talla"
                                    : "Sin stock disponible"}
                    </button>

                    {/* Stock note */}
                    {selectedVariante && (
                        <div className="flex items-center gap-1.5 -mt-2">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${(totalStock ?? 0) > 5 ? "bg-emerald-400" : (totalStock ?? 0) > 0 ? "bg-amber-400" : "bg-red-400"}`} />
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {(totalStock ?? 0) > 0 ? `${totalStock} unidades disponibles` : "Sin stock para esta variante"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
