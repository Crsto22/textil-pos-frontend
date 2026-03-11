"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  buildOfertaBatchDraftItem,
  createOfertaFormDraft,
  patchOfertasLote,
} from "@/lib/oferta-batch"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import {
  getPrimaryImageUrlForVariant,
  parseProductoDetalleResponse,
  sortProductoDetalleVariantes,
} from "@/lib/producto-detalle"
import type { OfertaFormDraft } from "@/lib/types/oferta"
import type {
  PageResponse,
  ProductoDetalleResponse,
  ProductoDetalleVariante,
  ProductoResumen,
} from "@/lib/types/producto"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function toProductoResumenList(payload: unknown): ProductoResumen[] {
  const pageData = payload as PageResponse<ProductoResumen> | null
  return Array.isArray(pageData?.content) ? pageData.content : []
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }

  return fallbackMessage
}

export function useOfertaBatchEditor() {
  const [productQuery, setProductQuery] = useState("")
  const debouncedProductQuery = useDebouncedValue(productQuery, SEARCH_DEBOUNCE_MS)
  const [products, setProducts] = useState<ProductoResumen[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<ProductoResumen | null>(null)
  const [productDetail, setProductDetail] = useState<ProductoDetalleResponse | null>(null)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [variantsError, setVariantsError] = useState<string | null>(null)
  const [variantQuery, setVariantQuery] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")

  const [form, setForm] = useState<OfertaFormDraft>(() => createOfertaFormDraft())
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const productAbortRef = useRef<AbortController | null>(null)
  const variantAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const normalizedQuery = debouncedProductQuery.trim()

    if (!normalizedQuery) {
      productAbortRef.current?.abort()
      setProducts([])
      setProductsError(null)
      setLoadingProducts(false)
      return
    }

    productAbortRef.current?.abort()
    const controller = new AbortController()
    productAbortRef.current = controller

    const searchProducts = async () => {
      setLoadingProducts(true)
      setProductsError(null)

      try {
        const response = await authFetch(
          `/api/producto/buscar?q=${encodeURIComponent(normalizedQuery)}&page=0`,
          {
            signal: controller.signal,
          }
        )
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          setProducts([])
          setProductsError(getErrorMessage(data, "No se pudieron buscar productos."))
          return
        }

        setProducts(toProductoResumenList(data))
      } catch (requestError) {
        if (isAbortError(requestError)) return
        setProducts([])
        setProductsError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron buscar productos."
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false)
        }
      }
    }

    void searchProducts()

    return () => {
      controller.abort()
    }
  }, [debouncedProductQuery])

  useEffect(() => {
    if (!selectedProduct) {
      variantAbortRef.current?.abort()
      setProductDetail(null)
      setVariantsError(null)
      setLoadingVariants(false)
      setSelectedVariantId("")
      return
    }

    variantAbortRef.current?.abort()
    const controller = new AbortController()
    variantAbortRef.current = controller

    const loadVariants = async () => {
      setLoadingVariants(true)
      setVariantsError(null)
      setSelectedVariantId("")
      setProductDetail(null)

      try {
        const response = await authFetch(
          `/api/producto/detalle/${selectedProduct.idProducto}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        )
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          setProductDetail(null)
          setVariantsError(
            getErrorMessage(data, "No se pudieron cargar las variantes del producto.")
          )
          return
        }

        const detail = parseProductoDetalleResponse(data)
        if (!detail) {
          setVariantsError("El detalle del producto no tiene el formato esperado.")
          return
        }

        setProductDetail(detail)
      } catch (requestError) {
        if (isAbortError(requestError)) return
        setProductDetail(null)
        setVariantsError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar las variantes del producto."
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVariants(false)
        }
      }
    }

    void loadVariants()

    return () => {
      controller.abort()
    }
  }, [selectedProduct])

  const variants = useMemo<ProductoDetalleVariante[]>(
    () => sortProductoDetalleVariantes(productDetail?.variantes ?? []),
    [productDetail]
  )

  useEffect(() => {
    return () => {
      productAbortRef.current?.abort()
      variantAbortRef.current?.abort()
    }
  }, [])

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) => variant.idProductoVariante === Number(selectedVariantId)
      ) ?? null,
    [selectedVariantId, variants]
  )

  const selectedVariantImageUrl = useMemo(
    () => getPrimaryImageUrlForVariant(productDetail?.imagenes ?? [], selectedVariant),
    [productDetail, selectedVariant]
  )

  useEffect(() => {
    if (selectedVariant) {
      setForm(createOfertaFormDraft(selectedVariant))
      return
    }

    setForm(createOfertaFormDraft())
  }, [selectedVariant])

  const filteredVariants = useMemo(() => {
    const normalizedQuery = variantQuery.trim().toLowerCase()
    if (!normalizedQuery) return variants

    return variants.filter((variant) =>
      [
        variant.sku,
        variant.colorNombre,
        variant.tallaNombre,
        variant.estado,
        String(variant.idProductoVariante),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [variantQuery, variants])

  const handleProductSelect = useCallback(
    (value: string) => {
      const nextProduct =
        products.find((product) => String(product.idProducto) === value) ??
        (selectedProduct && String(selectedProduct.idProducto) === value
          ? selectedProduct
          : null)

      setSelectedProduct(nextProduct)
      setVariantQuery("")
      setSubmitError(null)
    },
    [products, selectedProduct]
  )

  const handleVariantSelect = useCallback((value: string) => {
    setSelectedVariantId(value)
    setSubmitError(null)
  }, [])

  const updateFormField = useCallback(
    (field: keyof OfertaFormDraft, value: string) => {
      setForm((previous) => ({
        ...previous,
        [field]: value,
      }))
      setSubmitError(null)
    },
    []
  )

  const saveOffer = useCallback(async () => {
    if (!selectedProduct) {
      const message = "Debe seleccionar un producto."
      setSubmitError(message)
      toast.error(message)
      return false
    }

    if (!selectedVariant) {
      const message = "Debe seleccionar una variante."
      setSubmitError(message)
      toast.error(message)
      return false
    }

    const result = buildOfertaBatchDraftItem({
      productoId: selectedProduct.idProducto,
      productoNombre: selectedProduct.nombre,
      variante: selectedVariant,
      form,
      imageUrl: selectedVariantImageUrl,
    })

    if (!result.ok) {
      setSubmitError(result.message)
      toast.error(result.message)
      return false
    }

    setSaving(true)
    setSubmitError(null)

    const patchResult = await patchOfertasLote([
      {
        idProductoVariante: result.item.idProductoVariante,
        precioOferta: result.item.precioOferta,
        ofertaInicio: result.item.ofertaInicio,
        ofertaFin: result.item.ofertaFin,
      },
    ])

    setSaving(false)

    if (!patchResult.ok) {
      setSubmitError(patchResult.message)
      toast.error(patchResult.message)
      return false
    }

    setProductDetail((previous) => {
      if (!previous) return previous

      return {
        ...previous,
        variantes: previous.variantes.map((variant) =>
          variant.idProductoVariante === result.item.idProductoVariante
            ? {
                ...variant,
                precioOferta: result.item.precioOferta,
                ofertaInicio: result.item.ofertaInicio,
                ofertaFin: result.item.ofertaFin,
              }
            : variant
        ),
      }
    })

    setSelectedVariantId("")
    setVariantQuery("")
    setForm(createOfertaFormDraft())
    setSubmitError(null)
    toast.success(
      result.item.modo === "ACTUALIZAR"
        ? "Oferta actualizada correctamente."
        : "Oferta creada correctamente."
    )
    return true
  }, [form, selectedProduct, selectedVariant, selectedVariantImageUrl])

  return {
    productQuery,
    products,
    loadingProducts,
    productsError,
    selectedProduct,
    variants,
    filteredVariants,
    loadingVariants,
    variantsError,
    variantQuery,
    selectedVariantId,
    selectedVariant,
    selectedVariantImageUrl,
    form,
    submitError,
    saving,
    setProductQuery,
    setVariantQuery,
    handleProductSelect,
    handleVariantSelect,
    updateFormField,
    saveOffer,
  }
}
