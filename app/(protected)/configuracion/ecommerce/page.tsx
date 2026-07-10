"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react"
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  ShieldExclamationIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoaderSpinner } from "@/components/ui/loader-spinner"
import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { resolveBackendUrl } from "@/lib/resolve-backend-url"
import type { ProductoDetalleResponse, ProductoResumen } from "@/lib/types/producto"
import { toast } from "sonner"

interface EcommercePortada {
  idEcommercePortada: number
  desktopUrl: string
  desktopThumbUrl: string | null
  mobileUrl: string
  mobileThumbUrl: string | null
  orden: number
  estado: "ACTIVO" | "INACTIVO"
}

interface PromocionComboItem {
  idProducto: number
  nombreProducto: string
  productoNombre?: string
  cantidadRequerida: number
}

interface PromocionCombo {
  idPromocionCombo: number
  nombre: string
  regla: string
  precioCombo: number
  estado: "ACTIVO" | "INACTIVO"
  fechaInicio: string | null
  fechaFin: string | null
  items: PromocionComboItem[]
}

interface ComboFormState {
  nombre: string
  precioCombo: string
  fechaInicio: string
  fechaFin: string
  items: PromocionComboItem[]
}

interface ComboProductMeta {
  imageUrl: string | null
  priceMin: number | null
  priceMax: number | null
}

interface ComboPageData {
  content: PromocionCombo[]
  totalPages: number
  totalElements: number
}

type ComboVigencia = "TODAS" | "ACTIVAS" | "VENCIDAS"
type DurationMode = "HOY" | "3_DIAS" | "7_DIAS" | "PERSONALIZADO"

const EMPTY_COMBO_FORM: ComboFormState = {
  nombre: "",
  precioCombo: "",
  fechaInicio: "",
  fechaFin: "",
  items: [],
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_MB = 8
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const DESKTOP_TEMPLATE_URL = "https://canva.link/31yeqi6pa3bb9qm"
const MOBILE_TEMPLATE_URL = "https://canva.link/z8y57x1yc8jharh"

function validateImage(file: File | null): string | null {
  if (!file) return "Selecciona imagen desktop y mobile."
  if (!ACCEPTED_TYPES.includes(file.type)) return "Solo se permiten JPG, PNG o WEBP."
  if (file.size > MAX_SIZE_BYTES) return `Cada imagen debe pesar maximo ${MAX_SIZE_MB} MB.`
  return null
}

function FilePicker({
  label,
  dimensions,
  aspectClass,
  templateUrl,
  icon: Icon,
  file,
  onChange,
}: {
  label: string
  dimensions: string
  aspectClass: string
  templateUrl: string
  icon: typeof ComputerDesktopIcon
  file: File | null
  onChange: (file: File | null) => void
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null)
    event.target.value = ""
  }

  return (
    <label className="block rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <span className="mb-3 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" />
            {label}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">Medida: {dimensions}</span>
        </span>
        <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
          <a href={templateUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Plantilla
          </a>
        </Button>
      </span>
      <input type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleChange} className="sr-only" />
      <div className={`relative flex ${aspectClass} cursor-pointer items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground`}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs">
            <PhotoIcon className="h-7 w-7" />
            Seleccionar imagen
          </div>
        )}
      </div>
      {file && <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>}
    </label>
  )
}

function formatMoney(value: number) {
  return `S/ ${value.toFixed(2)}`
}

function formatTimeLeft(fechaFin: string | null) {
  if (!fechaFin) return "Sin vencimiento"
  const end = new Date(fechaFin).getTime()
  const now = Date.now()
  if (!Number.isFinite(end)) return "Sin vencimiento"
  if (end <= now) return "Vencido"
  const days = Math.ceil((end - now) / 86_400_000)
  if (days <= 1) return "Vence hoy"
  if (days < 30) return `Vence en ${days} dias`
  const months = Math.ceil(days / 30)
  return `Vence en ${months} mes${months === 1 ? "" : "es"}`
}

function priceLabel(meta: ComboProductMeta | undefined) {
  if (!meta || meta.priceMin === null) return "Precio no disponible"
  if (meta.priceMax !== null && meta.priceMax !== meta.priceMin) {
    return `${formatMoney(meta.priceMin)} - ${formatMoney(meta.priceMax)}`
  }
  return formatMoney(meta.priceMin)
}

function comboNormalTotal(combo: PromocionCombo, metaByProduct: Record<number, ComboProductMeta>) {
  const total = combo.items.reduce((sum, item) => {
    const price = metaByProduct[item.idProducto]?.priceMin
    return price === null || price === undefined ? sum : sum + price * item.cantidadRequerida
  }, 0)
  return total > 0 ? total : null
}

function discountPercent(combo: PromocionCombo, metaByProduct: Record<number, ComboProductMeta>) {
  const normalTotal = comboNormalTotal(combo, metaByProduct)
  if (!normalTotal || combo.precioCombo >= normalTotal) return null
  return Math.round(((normalTotal - combo.precioCombo) / normalTotal) * 100)
}

function normalizeDateTime(value: string) {
  return value ? value : null
}

function toDatetimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function comboPayload(form: ComboFormState) {
  return {
    nombre: form.nombre.trim(),
    precioCombo: Number(form.precioCombo),
    estado: "ACTIVO",
    fechaInicio: normalizeDateTime(form.fechaInicio),
    fechaFin: normalizeDateTime(form.fechaFin),
    items: form.items.map((item) => ({
      idProducto: item.idProducto,
      cantidadRequerida: item.cantidadRequerida,
    })),
  }
}

function formFromCombo(combo: PromocionCombo): ComboFormState {
  return {
    nombre: combo.nombre,
    precioCombo: String(combo.precioCombo),
    fechaInicio: combo.fechaInicio?.slice(0, 16) ?? "",
    fechaFin: combo.fechaFin?.slice(0, 16) ?? "",
    items: combo.items.map((item) => ({ ...item })),
  }
}

function normalizeCombo(combo: PromocionCombo): PromocionCombo {
  return {
    ...combo,
    items: combo.items.map((item) => ({
      ...item,
      nombreProducto: item.nombreProducto ?? item.productoNombre ?? "Producto",
    })),
  }
}

function validateComboForm(form: ComboFormState) {
  const total = form.items.reduce((sum, item) => sum + item.cantidadRequerida, 0)
  if (!form.nombre.trim()) return "Ingresa el nombre del combo"
  if (!Number.isFinite(Number(form.precioCombo)) || Number(form.precioCombo) <= 0) {
    return "Ingresa un precio combo valido"
  }
  if (total !== 2) return "El combo debe sumar exactamente 2 unidades"
  if (form.items.length === 0) return "Agrega al menos un producto"
  return null
}

function ComboPromocionesTab() {
  const [allCombos, setAllCombos] = useState<PromocionCombo[]>([])
  const [activeCombos, setActiveCombos] = useState<PromocionCombo[]>([])
  const [expiredCombos, setExpiredCombos] = useState<PromocionCombo[]>([])
  const [allPage, setAllPage] = useState(0)
  const [activePage, setActivePage] = useState(0)
  const [expiredPage, setExpiredPage] = useState(0)
  const [allTotalPages, setAllTotalPages] = useState(0)
  const [activeTotalPages, setActiveTotalPages] = useState(0)
  const [expiredTotalPages, setExpiredTotalPages] = useState(0)
  const [allTotalElements, setAllTotalElements] = useState(0)
  const [activeTotalElements, setActiveTotalElements] = useState(0)
  const [expiredTotalElements, setExpiredTotalElements] = useState(0)
  const [form, setForm] = useState<ComboFormState>(EMPTY_COMBO_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PromocionCombo | null>(null)
  const [durationMode, setDurationMode] = useState<DurationMode>("HOY")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<ProductoResumen[]>([])
  const [productPage, setProductPage] = useState(0)
  const [productTotalPages, setProductTotalPages] = useState(1)
  const [searching, setSearching] = useState(false)
  const [productMeta, setProductMeta] = useState<Record<number, ComboProductMeta>>({})

  const fetchProductMeta = useCallback(async (rows: PromocionCombo[]) => {
    const ids = [...new Set(rows.flatMap((combo) => combo.items.map((item) => item.idProducto)))]
    if (ids.length === 0) return

    const entries = await Promise.all(
      ids.map(async (id) => {
        const response = await authFetch(`/api/producto/detalle/${id}`)
        const data = (await response.json().catch(() => null)) as ProductoDetalleResponse | null
        if (!response.ok || !data?.producto) return null
        const prices = data.variantes.map((item) => item.precio).filter((price) => Number.isFinite(price))
        return [
          id,
          {
            imageUrl: data.producto.imagenGlobalThumbUrl ?? data.producto.imagenGlobalUrl ?? null,
            priceMin: prices.length ? Math.min(...prices) : null,
            priceMax: prices.length ? Math.max(...prices) : null,
          },
        ] as const
      })
    )

    setProductMeta((current) => ({
      ...current,
      ...Object.fromEntries(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null)),
    }))
  }, [])

  const fetchComboPage = useCallback(async (vigencia: ComboVigencia, page: number): Promise<ComboPageData | null> => {
    const params = new URLSearchParams({ page: String(page) })
    if (vigencia !== "TODAS") params.set("vigencia", vigencia)
    const response = await authFetch(`/api/ecommerce/promociones-combo?${params.toString()}`)
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudieron cargar los combos")
      return null
    }
    const rows = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []
    return {
      content: rows.map(normalizeCombo),
      totalPages: Math.max(Number(data?.totalPages) || 0, 0),
      totalElements: Math.max(Number(data?.totalElements) || rows.length, 0),
    }
  }, [])

  const fetchCombos = useCallback(async () => {
    setLoading(true)
    const [allData, activeData, expiredData] = await Promise.all([
      fetchComboPage("TODAS", allPage),
      fetchComboPage("ACTIVAS", activePage),
      fetchComboPage("VENCIDAS", expiredPage),
    ])
    if (allData) {
      setAllCombos(allData.content)
      setAllTotalPages(allData.totalPages)
      setAllTotalElements(allData.totalElements)
    }
    if (activeData) {
      setActiveCombos(activeData.content)
      setActiveTotalPages(activeData.totalPages)
      setActiveTotalElements(activeData.totalElements)
    }
    if (expiredData) {
      setExpiredCombos(expiredData.content)
      setExpiredTotalPages(expiredData.totalPages)
      setExpiredTotalElements(expiredData.totalElements)
    }
    setLoading(false)
    void fetchProductMeta([...(allData?.content ?? []), ...(activeData?.content ?? []), ...(expiredData?.content ?? [])])
  }, [allPage, activePage, expiredPage, fetchComboPage, fetchProductMeta])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void fetchCombos()
    })
    return () => {
      cancelled = true
    }
  }, [fetchCombos])

  useEffect(() => {
    if (!dialogOpen) return

    const timer = window.setTimeout(() => {
      setSearching(true)
      authFetch(`/api/producto/buscar?q=${encodeURIComponent(search.trim())}&page=${productPage}&publicarEcommerce=true`)
        .then(async (response) => {
          const data = await response.json().catch(() => null)
          if (!response.ok) throw new Error(data?.message ?? "No se pudo buscar productos")
          setProducts(Array.isArray(data?.content) ? data.content : [])
          setProductTotalPages(Math.max(Number(data?.totalPages) || 1, 1))
        })
        .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo buscar productos"))
        .finally(() => setSearching(false))
    }, 250)

    return () => window.clearTimeout(timer)
  }, [dialogOpen, productPage, search])

  const resetForm = () => {
    setForm(EMPTY_COMBO_FORM)
    setEditingId(null)
    setDurationMode("HOY")
    setSearch("")
    setProductPage(0)
    setProductTotalPages(1)
    setProducts([])
  }

  const applyDuration = (mode: DurationMode) => {
    setDurationMode(mode)
    if (mode === "PERSONALIZADO") return
    const start = new Date()
    const end = new Date(start)
    if (mode === "HOY") {
      end.setHours(23, 59, 0, 0)
    } else {
      end.setDate(end.getDate() + (mode === "3_DIAS" ? 3 : 7))
    }
    setForm((current) => ({
      ...current,
      fechaInicio: toDatetimeLocal(start),
      fechaFin: toDatetimeLocal(end),
    }))
  }

  const removeOneProduct = (idProducto: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.flatMap((item) =>
        item.idProducto === idProducto
          ? item.cantidadRequerida <= 1
            ? []
            : [{ ...item, cantidadRequerida: item.cantidadRequerida - 1 }]
          : [item]
      ),
    }))
  }

  const addProduct = (product: ProductoResumen) => {
    setProductMeta((current) => ({
      ...current,
      [product.idProducto]: {
        imageUrl: product.imagenGlobalThumbUrl ?? product.imagenGlobalUrl ?? null,
        priceMin: product.precioMin ?? null,
        priceMax: product.precioMax ?? null,
      },
    }))
    setForm((current) => {
      const existing = current.items.find((item) => item.idProducto === product.idProducto)
      const total = current.items.reduce((sum, item) => sum + item.cantidadRequerida, 0)
      if (!existing && total >= 2) return current
      if (existing) {
        if (total >= 2 || existing.cantidadRequerida >= 2) return current
        return {
          ...current,
          items: current.items.map((item) =>
            item.idProducto === product.idProducto
              ? { ...item, cantidadRequerida: Math.min(2, item.cantidadRequerida + 1) }
              : item
          ),
        }
      }
      return {
        ...current,
        items: [
          ...current.items,
          {
            idProducto: product.idProducto,
            nombreProducto: product.nombre,
            cantidadRequerida: 1,
          },
        ],
      }
    })
  }

  const saveCombo = async () => {
    const validation = validateComboForm(form)
    if (validation) {
      toast.error(validation)
      return
    }

    setSaving(true)
    const response = await authFetch(
      editingId ? `/api/ecommerce/promociones-combo/${editingId}` : "/api/ecommerce/promociones-combo",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comboPayload(form)),
      }
    )
    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo guardar el combo")
      return
    }

    toast.success(editingId ? "Combo actualizado" : "Combo creado")
    resetForm()
    setDialogOpen(false)
    await fetchCombos()
  }

  const changeEstado = async (combo: PromocionCombo) => {
    const estado = combo.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO"
    const response = await authFetch(`/api/ecommerce/promociones-combo/${combo.idPromocionCombo}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo cambiar el estado")
      return
    }
    toast.success(estado === "ACTIVO" ? "Combo activado" : "Combo desactivado")
    await fetchCombos()
  }

  const deleteCombo = async () => {
    if (!deleteTarget) {
      return
    }
    setDeleting(true)
    const response = await authFetch(`/api/ecommerce/promociones-combo/${deleteTarget.idPromocionCombo}`, {
      method: "DELETE",
    })
    const data = await response.json().catch(() => null)
    setDeleting(false)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo eliminar el combo")
      return
    }
    toast.success("Combo eliminado")
    if (editingId === deleteTarget.idPromocionCombo) resetForm()
    setDeleteTarget(null)
    await fetchCombos()
  }

  const totalItems = form.items.reduce((sum, item) => sum + item.cantidadRequerida, 0)
  const comboSlots = form.items.flatMap((item) =>
    Array.from({ length: item.cantidadRequerida }, (_, index) => ({ ...item, slotKey: `${item.idProducto}-${index}` }))
  )
  const normalPreviewTotal = comboSlots.reduce((sum, item) => sum + (productMeta[item.idProducto]?.priceMin ?? 0), 0)
  const comboPreviewPrice = Number(form.precioCombo) || 0
  const previewSavings = normalPreviewTotal > 0 && comboPreviewPrice > 0 ? normalPreviewTotal - comboPreviewPrice : 0
  const totalCombos = allTotalElements

  const renderComboSection = (
    title: string,
    description: string,
    rows: PromocionCombo[],
    page: number,
    totalPages: number,
    totalElements: number,
    onPageChange: (value: number | ((prev: number) => number)) => void
  ) => (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {rows.length === 0 ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border text-center text-sm text-muted-foreground">
          <TagIcon className="h-5 w-5" />
          <p>No hay promociones en esta seccion.</p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {rows.map((combo) => (
            <Card key={combo.idPromocionCombo}>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex shrink-0 -space-x-2">
                    {combo.items.map((item) => (
                      <div key={item.idProducto} className="h-12 w-12 overflow-hidden rounded-full border-2 border-background bg-muted">
                        {productMeta[item.idProducto]?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveBackendUrl(productMeta[item.idProducto].imageUrl) ?? ""}
                            alt={item.nombreProducto}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                            {item.nombreProducto.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold">{combo.nombre}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${combo.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {combo.estado}
                      </span>
                      {discountPercent(combo, productMeta) !== null && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          -{discountPercent(combo, productMeta)}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{combo.regla}</p>
                    <p className="mt-1 text-xs font-medium text-amber-600">{formatTimeLeft(combo.fechaFin)}</p>
                  </div>
                </div>
                <div className="lg:text-right">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Precio combo</p>
                  <p className="text-lg font-black">{formatMoney(combo.precioCombo)}</p>
                  {comboNormalTotal(combo, productMeta) !== null && (
                    <p className="text-xs text-muted-foreground">
                      Normal {formatMoney(comboNormalTotal(combo, productMeta) as number)}
                    </p>
                  )}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground lg:col-span-2">
                  {combo.items.map((item) => (
                    <div key={item.idProducto} className="min-w-0">
                      <p className="truncate font-medium text-foreground">{item.nombreProducto} x{item.cantidadRequerida}</p>
                      <p className="text-xs">{priceLabel(productMeta[item.idProducto])}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:col-span-2 lg:justify-end">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Switch
                      checked={combo.estado === "ACTIVO"}
                      onCheckedChange={() => void changeEstado(combo)}
                      aria-label={`${combo.estado === "ACTIVO" ? "Desactivar" : "Activar"} ${combo.nombre}`}
                    />
                    Activo
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                    setEditingId(combo.idPromocionCombo)
                    setDurationMode("PERSONALIZADO")
                    setForm(formFromCombo(combo))
                    setDialogOpen(true)
                  }}>
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(combo)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PaginationResponsive
        totalElements={totalElements}
        totalPages={totalPages}
        page={page}
        onPageChange={onPageChange}
        itemLabel="promociones"
      />
    </section>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            resetForm()
            applyDuration("HOY")
            setDialogOpen(true)
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Agregar combo
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar combo" : "Agregar combo"}</DialogTitle>
            <DialogDescription>Solo productos visibles en ecommerce. Las variantes no se configuran aqui.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Datos generales</p>
                <label className="grid gap-1 text-sm font-medium">
                  Nombre
                  <input
                    value={form.nombre}
                    onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    placeholder="2 Belinda S/160"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Precio combo
                  <span className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precioCombo}
                      onChange={(event) => setForm((current) => ({ ...current, precioCombo: event.target.value }))}
                      className="h-10 w-full rounded-md border bg-background px-3 pl-9 text-sm"
                      placeholder="160"
                    />
                  </span>
                </label>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Duracion de la oferta</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["HOY", "Hoy"],
                    ["3_DIAS", "3 dias"],
                    ["7_DIAS", "7 dias"],
                    ["PERSONALIZADO", "Personalizado"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      variant={durationMode === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyDuration(value as DurationMode)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                {durationMode === "PERSONALIZADO" && (
                  <div className="grid gap-3">
                    <label className="grid gap-1 text-sm font-medium">
                      Fecha inicio
                      <input
                        type="datetime-local"
                        value={form.fechaInicio}
                        onChange={(event) => setForm((current) => ({ ...current, fechaInicio: event.target.value }))}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Fecha fin
                      <input
                        type="datetime-local"
                        value={form.fechaFin}
                        onChange={(event) => setForm((current) => ({ ...current, fechaFin: event.target.value }))}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={() => void saveCombo()} disabled={saving} className="w-full gap-2">
                  {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TagIcon className="h-4 w-4" />}
                  {editingId ? "Guardar cambios" : "Crear combo"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full">
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Buscar productos visibles en ecommerce</p>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setProductPage(0)
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Belinda, Camila..."
                />
                <div className="max-h-72 overflow-y-auto rounded-md border bg-background p-2">
                  {searching ? (
                    <LoaderSpinner size="sm" className="py-8" />
                  ) : products.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No hay productos para mostrar.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {products.map((product) => {
                        const selected = form.items.find((item) => item.idProducto === product.idProducto)
                        const disabled = totalItems >= 2 && (!selected || selected.cantidadRequerida >= 2)
                        const imageUrl = resolveBackendUrl(product.imagenGlobalThumbUrl ?? product.imagenGlobalUrl)
                        return (
                          <button
                            key={product.idProducto}
                            type="button"
                            disabled={disabled}
                            onClick={() => addProduct(product)}
                            className="flex min-w-0 items-center gap-3 rounded-md border p-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt={product.nombre} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                                  {product.nombre.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{product.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {priceLabel({
                                  imageUrl: null,
                                  priceMin: product.precioMin ?? null,
                                  priceMax: product.precioMax ?? null,
                                })}
                              </p>
                            </div>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              {selected ? selected.cantidadRequerida : <PlusIcon className="h-4 w-4" />}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pag {productPage + 1} de {productTotalPages}</span>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" disabled={productPage <= 0} onClick={() => setProductPage((page) => Math.max(0, page - 1))}>
                      Anterior
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={productPage >= productTotalPages - 1} onClick={() => setProductPage((page) => page + 1)}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Incluidos en el combo</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{totalItems}</span>
                </div>
                <div className="flex flex-wrap items-start justify-center gap-3">
                  {[0, 1].map((index) => {
                    const item = comboSlots[index]
                    const meta = item ? productMeta[item.idProducto] : undefined
                    return (
                      <div key={item?.slotKey ?? `empty-${index}`} className="flex flex-col items-center gap-2">
                        <div className={`group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 ${item ? "border-primary bg-muted" : "border-dashed border-muted-foreground/40 bg-muted/20"}`}>
                          {item && meta?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resolveBackendUrl(meta.imageUrl) ?? ""} alt={item.nombreProducto} className="h-full w-full object-cover" />
                          ) : item ? (
                            <span className="text-lg font-bold text-muted-foreground">{item.nombreProducto.slice(0, 1).toUpperCase()}</span>
                          ) : (
                            <PlusIcon className="h-6 w-6 text-muted-foreground/60" />
                          )}
                          {item && (
                            <button
                              type="button"
                              aria-label={`Quitar ${item.nombreProducto}`}
                              onClick={() => removeOneProduct(item.idProducto)}
                              className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        <p className="max-w-28 truncate text-center text-xs font-medium">{item?.nombreProducto ?? "Producto"}</p>
                        <p className="text-xs text-muted-foreground">{item ? priceLabel(meta) : "S/ 0.00"}</p>
                      </div>
                    )
                  })}
                  <div className="flex min-w-32 flex-col items-center justify-center gap-1 rounded-lg border bg-muted/20 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total normal</p>
                    <p className="text-lg font-black">{formatMoney(normalPreviewTotal)}</p>
                    <p className="text-xs text-muted-foreground">Combo</p>
                    <p className="text-lg font-black text-primary">{formatMoney(comboPreviewPrice)}</p>
                  </div>
                </div>
                {previewSavings > 0 && (
                  <div className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    Ahorra {formatMoney(previewSavings)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar combo</DialogTitle>
            <DialogDescription>
              Esta accion eliminara el combo {deleteTarget ? `"${deleteTarget.nombre}"` : ""}. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void deleteCombo()}>
              {deleting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <LoaderSpinner size="sm" />
          </div>
        ) : totalCombos === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border text-center text-sm text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border">
              <TagIcon className="h-6 w-6" />
            </div>
            <p>No hay combos registrados.</p>
          </div>
        ) : (
          <Tabs defaultValue="todas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="activas">Promociones activas</TabsTrigger>
              <TabsTrigger value="vencidas">Promociones vencidas</TabsTrigger>
            </TabsList>
            <TabsContent value="todas">
              {renderComboSection(
                "Todas las promociones",
                "Combos activos, inactivos y vencidos. Desactivar no elimina el combo.",
                allCombos,
                allPage,
                allTotalPages,
                allTotalElements,
                setAllPage
              )}
            </TabsContent>
            <TabsContent value="activas">
              {renderComboSection(
                "Promociones activas",
                "Combos disponibles por estado y vigencia actual.",
                activeCombos,
                activePage,
                activeTotalPages,
                activeTotalElements,
                setActivePage
              )}
            </TabsContent>
            <TabsContent value="vencidas">
              {renderComboSection(
                "Promociones vencidas",
                "Combos con fecha fin anterior a hoy.",
                expiredCombos,
                expiredPage,
                expiredTotalPages,
                expiredTotalElements,
                setExpiredPage
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default function EcommercePage() {
  const { user, isLoading } = useAuth()
  const canManage = user?.rol === "ADMINISTRADOR" || user?.rol === "SISTEMA"
  const [portadas, setPortadas] = useState<EcommercePortada[]>([])
  const [desktop, setDesktop] = useState<File | null>(null)
  const [mobile, setMobile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchPortadas = async () => {
    setLoading(true)
    const response = await authFetch("/api/config/ecommerce/portadas")
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudieron cargar las portadas")
      setLoading(false)
      return
    }
    setPortadas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    if (!isLoading && canManage) {
      queueMicrotask(() => {
        if (!cancelled) void fetchPortadas()
      })
    } else if (!isLoading) {
      queueMicrotask(() => {
        if (!cancelled) setLoading(false)
      })
    }
    return () => {
      cancelled = true
    }
  }, [isLoading, canManage])

  const handleCreate = async () => {
    const validation = validateImage(desktop) ?? validateImage(mobile)
    if (validation) {
      toast.error(validation)
      return
    }

    setSaving(true)
    const formData = new FormData()
    formData.append("desktop", desktop as File)
    formData.append("mobile", mobile as File)

    const response = await authFetch("/api/config/ecommerce/portadas", {
      method: "POST",
      body: formData,
    })
    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo subir la portada")
      return
    }

    setDesktop(null)
    setMobile(null)
    toast.success("Portada subida correctamente")
    await fetchPortadas()
  }

  const handleEstado = async (portada: EcommercePortada) => {
    const estado = portada.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO"
    const response = await authFetch(`/api/config/ecommerce/portadas/${portada.idEcommercePortada}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo actualizar la portada")
      return
    }
    toast.success(estado === "ACTIVO" ? "Portada activada" : "Portada desactivada")
    setPortadas((items) =>
      items.map((item) => (item.idEcommercePortada === portada.idEcommercePortada ? data : item))
    )
  }

  const handleDelete = async (portada: EcommercePortada) => {
    const response = await authFetch(`/api/config/ecommerce/portadas/${portada.idEcommercePortada}`, {
      method: "DELETE",
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo eliminar la portada")
      return
    }
    toast.success("Portada eliminada")
    setPortadas((items) => items.filter((item) => item.idEcommercePortada !== portada.idEcommercePortada))
  }

  if (!isLoading && !canManage) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
          <ShieldExclamationIcon className="mx-auto h-9 w-9 text-amber-500" />
          <h1 className="mt-3 text-lg font-semibold">Acceso solo para administrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Esta pantalla administra portadas publicas del ecommerce.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Administracion ecommerce</h1>
      </div>

      <Tabs defaultValue="portadas" className="space-y-5">
        <TabsList>
          <TabsTrigger value="portadas">Portadas</TabsTrigger>
          <TabsTrigger value="combos">Combos ofertas</TabsTrigger>
        </TabsList>

        <TabsContent value="portadas" className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <FilePicker
                  label="Portada pantalla grande"
                  dimensions="1672 x 941 px"
                  aspectClass="aspect-[1672/941]"
                  templateUrl={DESKTOP_TEMPLATE_URL}
                  icon={ComputerDesktopIcon}
                  file={desktop}
                  onChange={setDesktop}
                />
                <FilePicker
                  label="Portada celular"
                  dimensions="1254 x 1254 px"
                  aspectClass="aspect-square"
                  templateUrl={MOBILE_TEMPLATE_URL}
                  icon={DevicePhoneMobileIcon}
                  file={mobile}
                  onChange={setMobile}
                />
              </div>
              <Button onClick={handleCreate} disabled={saving || loading} className="gap-2">
                {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowUpTrayIcon className="h-4 w-4" />}
                Subir portada
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">Cargando portadas...</CardContent>
              </Card>
            ) : portadas.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">No hay portadas registradas.</CardContent>
              </Card>
            ) : (
              portadas.map((portada) => (
                <Card key={portada.idEcommercePortada}>
                  <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_180px_auto] lg:items-center">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "Desktop",
                          dimensions: "1672 x 941 px",
                          aspectClass: "aspect-[1672/941]",
                          url: portada.desktopThumbUrl ?? portada.desktopUrl,
                        },
                        {
                          label: "Mobile",
                          dimensions: "1254 x 1254 px",
                          aspectClass: "aspect-square",
                          url: portada.mobileThumbUrl ?? portada.mobileUrl,
                        },
                      ].map((item) => (
                        <div key={item.label} className="overflow-hidden rounded-md border bg-muted">
                          <div className="border-b bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            {item.label} - {item.dimensions}
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveBackendUrl(item.url) ?? ""}
                            alt={`${item.label} portada`}
                            className={`${item.aspectClass} w-full object-cover`}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Portada #{portada.orden}</p>
                      <p className="text-xs text-muted-foreground">{portada.estado}</p>
                    </div>
                    <div className="flex gap-2 lg:justify-end">
                      <Button type="button" variant="outline" onClick={() => void handleEstado(portada)}>
                        {portada.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        aria-label="Eliminar portada"
                        onClick={() => void handleDelete(portada)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="combos">
          <ComboPromocionesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
