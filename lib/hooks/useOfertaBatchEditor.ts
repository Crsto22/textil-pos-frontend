"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  buildOfertaBatchDraftItem,
  createOfertaBulkFormDraft,
  createOfertaFormDraft,
  patchOfertasLote,
  patchOfertasSucursalLote,
  resolveOfertaPriceFromMode,
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
import type {
  OfertaBatchSchedulePreset,
  OfertaBulkFormDraft,
  OfertaFormDraft,
} from "@/lib/types/oferta"
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

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function toDateTimeLocalInputValue(value: Date): string {
  return [
    value.getFullYear(),
    pad2(value.getMonth() + 1),
    pad2(value.getDate()),
  ].join("-") + `T${pad2(value.getHours())}:${pad2(value.getMinutes())}`
}

function buildDateRangeFromPreset(
  preset: OfertaBatchSchedulePreset
): Pick<OfertaFormDraft, "ofertaInicioInput" | "ofertaFinInput"> {
  const now = new Date()
  now.setSeconds(0, 0)

  const end = new Date(now)

  switch (preset) {
    case "HOY":
      end.setHours(23, 59, 0, 0)
      break
    case "TRES_DIAS":
      end.setDate(end.getDate() + 3)
      end.setHours(23, 59, 0, 0)
      break
    case "SIETE_DIAS":
      end.setDate(end.getDate() + 7)
      end.setHours(23, 59, 0, 0)
      break
    default:
      return {
        ofertaInicioInput: "",
        ofertaFinInput: "",
      }
  }

  return {
    ofertaInicioInput: toDateTimeLocalInputValue(now),
    ofertaFinInput: toDateTimeLocalInputValue(end),
  }
}

function getVariantContextLabel(variant: ProductoDetalleVariante) {
  return `${variant.colorNombre} / ${variant.tallaNombre}`
}

function parseDraftPrice(value: string): number | null {
  const normalizedValue = value.trim().replace(",", ".")
  if (normalizedValue === "") return null

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function calculateDiscountPercent(
  precioBase: number,
  precioOferta: number | null
): number | null {
  if (
    !Number.isFinite(precioBase) ||
    precioBase <= 0 ||
    precioOferta === null ||
    precioOferta <= 0 ||
    precioOferta >= precioBase
  ) {
    return null
  }

  return Math.max(0, Math.round(((precioBase - precioOferta) / precioBase) * 100))
}

type DraftValidationResult = ReturnType<typeof buildOfertaBatchDraftItem>

interface OfertaBatchPreviewItem {
  variant: ProductoDetalleVariante
  imageUrl: string | null
  draft: OfertaFormDraft
  validationResult: DraftValidationResult
  previewOfferPrice: number | null
}

interface OfertaBatchTableItem {
  variant: ProductoDetalleVariante
  imageUrl: string | null
  draft: OfertaFormDraft
  selected: boolean
  previewOfferPrice: number | null
  discountPercent: number | null
  validationResult: DraftValidationResult | null
}

function ensureDraftMapEntry(
  previous: Record<number, OfertaFormDraft>,
  variant: ProductoDetalleVariante
) {
  if (previous[variant.idProductoVariante]) {
    return previous
  }

  return {
    ...previous,
    [variant.idProductoVariante]: createOfertaFormDraft(),
  }
}

function buildEffectiveDraft(
  draft: OfertaFormDraft,
  bulkForm: OfertaBulkFormDraft
): OfertaFormDraft {
  return {
    precioOfertaInput:
      draft.precioOfertaInput.trim() !== ""
        ? draft.precioOfertaInput
        : bulkForm.priceInput,
    ofertaInicioInput:
      draft.ofertaInicioInput.trim() !== ""
        ? draft.ofertaInicioInput
        : bulkForm.ofertaInicioInput,
    ofertaFinInput:
      draft.ofertaFinInput.trim() !== ""
        ? draft.ofertaFinInput
        : bulkForm.ofertaFinInput,
  }
}

export function useOfertaBatchEditor(idSucursal: number | null = null) {
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
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([])
  const [draftsByVariantId, setDraftsByVariantId] = useState<
    Record<number, OfertaFormDraft>
  >({})
  const [bulkForm, setBulkForm] = useState<OfertaBulkFormDraft>(() =>
    createOfertaBulkFormDraft()
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showValidationFeedback, setShowValidationFeedback] = useState(false)
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
      setSelectedVariantIds([])
      setDraftsByVariantId({})
      setShowValidationFeedback(false)
      return
    }

    variantAbortRef.current?.abort()
    const controller = new AbortController()
    variantAbortRef.current = controller

    const loadVariants = async () => {
      setLoadingVariants(true)
      setVariantsError(null)
      setSelectedVariantIds([])
      setDraftsByVariantId({})
      setShowValidationFeedback(false)
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

  useEffect(() => {
    return () => {
      productAbortRef.current?.abort()
      variantAbortRef.current?.abort()
    }
  }, [])

  const variants = useMemo<ProductoDetalleVariante[]>(
    () => sortProductoDetalleVariantes(productDetail?.variantes ?? []),
    [productDetail]
  )

  const selectedVariantIdSet = useMemo(
    () => new Set(selectedVariantIds),
    [selectedVariantIds]
  )

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

  const allFilteredSelected = useMemo(
    () =>
      filteredVariants.length > 0 &&
      filteredVariants.every((variant) =>
        selectedVariantIdSet.has(variant.idProductoVariante)
      ),
    [filteredVariants, selectedVariantIdSet]
  )

  const selectedVariants = useMemo(
    () =>
      variants.filter((variant) =>
        selectedVariantIdSet.has(variant.idProductoVariante)
      ),
    [selectedVariantIdSet, variants]
  )

  const tableItems = useMemo<OfertaBatchTableItem[]>(() => {
    return filteredVariants.map((variant) => {
      const rawDraft =
        draftsByVariantId[variant.idProductoVariante] ?? createOfertaFormDraft()
      const draft = buildEffectiveDraft(rawDraft, bulkForm)
      const selected = selectedVariantIdSet.has(variant.idProductoVariante)
      const imageUrl = getPrimaryImageUrlForVariant(productDetail?.imagenes ?? [], variant)
      const validationResult =
        selectedProduct && selected
          ? buildOfertaBatchDraftItem({
              productoId: selectedProduct.idProducto,
              productoNombre: selectedProduct.nombre,
              variante: variant,
              form: draft,
              imageUrl,
            })
          : null
      const previewOfferPrice =
        selected && draft.precioOfertaInput.trim() !== ""
          ? parseDraftPrice(draft.precioOfertaInput)
          : null

      return {
        variant,
        imageUrl,
        draft,
        selected,
        previewOfferPrice,
        discountPercent: calculateDiscountPercent(variant.precio, previewOfferPrice),
        validationResult,
      }
    })
  }, [
    bulkForm,
    draftsByVariantId,
    filteredVariants,
    productDetail,
    selectedProduct,
    selectedVariantIdSet,
  ])

  const previewItems = useMemo<OfertaBatchPreviewItem[]>(() => {
    if (!selectedProduct) return []

    return tableItems.flatMap((tableItem) => {
      if (!tableItem.selected || !tableItem.validationResult) {
        return []
      }

      const imageUrl = getPrimaryImageUrlForVariant(
        productDetail?.imagenes ?? [],
        tableItem.variant
      )

      return [
        {
          variant: tableItem.variant,
          imageUrl,
          draft: tableItem.draft,
          validationResult: tableItem.validationResult,
          previewOfferPrice: tableItem.previewOfferPrice,
        },
      ]
    })
  }, [productDetail, selectedProduct, tableItems])

  const previewStats = useMemo(() => {
    let invalid = 0
    let create = 0
    let update = 0

    for (const previewItem of previewItems) {
      if (!previewItem.validationResult.ok) {
        invalid += 1
        continue
      }

      if (previewItem.validationResult.item.modo === "ACTUALIZAR") {
        update += 1
      } else {
        create += 1
      }
    }

    return {
      total: previewItems.length,
      invalid,
      create,
      update,
      valid: previewItems.length - invalid,
    }
  }, [previewItems])

  const handleProductSelect = useCallback(
    (value: string) => {
      const nextProduct =
        products.find((product) => String(product.idProducto) === value) ??
        (selectedProduct && String(selectedProduct.idProducto) === value
          ? selectedProduct
          : null)

      setSelectedProduct(nextProduct)
      setVariantQuery("")
      setSelectedVariantIds([])
      setDraftsByVariantId({})
      setShowValidationFeedback(false)
      setSubmitError(null)
    },
    [products, selectedProduct]
  )

  const toggleVariantSelection = useCallback(
    (idProductoVariante: number) => {
      const targetVariant =
        variants.find(
          (variant) => variant.idProductoVariante === idProductoVariante
        ) ?? null
      if (!targetVariant) return

      setSelectedVariantIds((previous) =>
        previous.includes(idProductoVariante)
          ? previous.filter((id) => id !== idProductoVariante)
          : [...previous, idProductoVariante]
      )
      setDraftsByVariantId((previous) => ensureDraftMapEntry(previous, targetVariant))
      setShowValidationFeedback(false)
      setSubmitError(null)
    },
    [variants]
  )

  const setVariantSelectionForIds = useCallback(
    (idsProductoVariante: number[], nextSelected: boolean) => {
      if (idsProductoVariante.length === 0) return

      const idSet = new Set(idsProductoVariante)
      const targetVariants = variants.filter((variant) =>
        idSet.has(variant.idProductoVariante)
      )
      if (targetVariants.length === 0) return

      setSelectedVariantIds((previous) => {
        if (!nextSelected) {
          return previous.filter((id) => !idSet.has(id))
        }

        const nextIds = new Set(previous)
        targetVariants.forEach((variant) => {
          nextIds.add(variant.idProductoVariante)
        })
        return Array.from(nextIds)
      })

      if (nextSelected) {
        setDraftsByVariantId((previous) => {
          let next = previous

          targetVariants.forEach((variant) => {
            next = ensureDraftMapEntry(next, variant)
          })

          return next
        })
      }

      setShowValidationFeedback(false)
      setSubmitError(null)
    },
    [variants]
  )

  const toggleSelectAllFilteredVariants = useCallback(() => {
    if (filteredVariants.length === 0) return
    const shouldSelect = !filteredVariants.every((variant) =>
      selectedVariantIdSet.has(variant.idProductoVariante)
    )

    setVariantSelectionForIds(
      filteredVariants.map((variant) => variant.idProductoVariante),
      shouldSelect
    )
  }, [filteredVariants, selectedVariantIdSet, setVariantSelectionForIds])

  const clearSelectedVariants = useCallback(() => {
    setSelectedVariantIds([])
    setShowValidationFeedback(false)
    setSubmitError(null)
  }, [])

  const updateBulkFormField = useCallback(
    (field: keyof OfertaBulkFormDraft, value: string) => {
      setBulkForm((previous) => ({
        ...previous,
        [field]: value,
        ...(field === "ofertaInicioInput" || field === "ofertaFinInput"
          ? { schedulePreset: "PERSONALIZADO" as const }
          : {}),
      }))
      setSubmitError(null)
    },
    []
  )

  const applySchedulePreset = useCallback((preset: OfertaBatchSchedulePreset) => {
    setBulkForm((previous) => ({
      ...previous,
      schedulePreset: preset,
      ...(preset === "PERSONALIZADO" ? {} : buildDateRangeFromPreset(preset)),
    }))
    setShowValidationFeedback(false)
    setSubmitError(null)
  }, [])

  const updateVariantDraftField = useCallback(
    (
      idProductoVariante: number,
      field: keyof OfertaFormDraft,
      value: string
    ) => {
      const targetVariant =
        variants.find(
          (variant) => variant.idProductoVariante === idProductoVariante
        ) ?? null
      if (!targetVariant) return

      setDraftsByVariantId((previous) => ({
        ...(ensureDraftMapEntry(previous, targetVariant) ?? previous),
        [idProductoVariante]: {
          ...(previous[idProductoVariante] ?? createOfertaFormDraft()),
          [field]: value,
        },
      }))
      setSubmitError(null)
    },
    [variants]
  )

  const applyBulkToSelected = useCallback(() => {
    if (!selectedProduct) {
      const message = "Debe seleccionar un producto."
      setSubmitError(message)
      toast.error(message)
      return false
    }

    if (selectedVariants.length === 0) {
      const message = "Debe seleccionar al menos una variante."
      setSubmitError(message)
      toast.error(message)
      return false
    }

    const nextDrafts: Record<number, OfertaFormDraft> = {}

    for (const variant of selectedVariants) {
      const priceResult = resolveOfertaPriceFromMode(
        variant.precio,
        bulkForm.priceMode,
        bulkForm.priceInput
      )

      if (!priceResult.ok) {
        const message = `${priceResult.message} (${getVariantContextLabel(variant)}).`
        setSubmitError(message)
        toast.error(message)
        return false
      }

      nextDrafts[variant.idProductoVariante] = {
        precioOfertaInput: String(priceResult.value),
        ofertaInicioInput: bulkForm.ofertaInicioInput,
        ofertaFinInput: bulkForm.ofertaFinInput,
      }
    }

    setDraftsByVariantId((previous) => ({
      ...previous,
      ...nextDrafts,
    }))
    setShowValidationFeedback(false)
    setSubmitError(null)
    toast.success(
      selectedVariants.length === 1
        ? "Regla aplicada a 1 variante."
        : `Regla aplicada a ${selectedVariants.length} variantes.`
    )
    return true
  }, [bulkForm, selectedProduct, selectedVariants])

  const saveOffers = useCallback(async () => {
    if (!selectedProduct) {
      const message = "Debe seleccionar un producto."
      setSubmitError(message)
      toast.error(message)
      return false
    }

    if (previewItems.length === 0) {
      const message = "Debe seleccionar al menos una variante para guardar."
      setSubmitError(message)
      toast.error(message)
      return false
    }

    setShowValidationFeedback(true)

    const invalidPreviews = previewItems.filter(
      (
        previewItem
      ): previewItem is OfertaBatchPreviewItem & {
        validationResult: Extract<DraftValidationResult, { ok: false }>
      } => !previewItem.validationResult.ok
    )

    if (invalidPreviews.length > 0) {
      const onlyDateErrors = invalidPreviews.every((previewItem) =>
        previewItem.validationResult.message.includes(
          "Debe completar fecha de inicio y fecha de fin"
        )
      )
      const sampleLabels = invalidPreviews
        .slice(0, 3)
        .map((previewItem) => getVariantContextLabel(previewItem.variant))
        .join(", ")
      const message =
        onlyDateErrors
          ? "Antes de publicar, completa la fecha de inicio y fin para las variantes seleccionadas."
          : invalidPreviews.length === 1
          ? invalidPreviews[0].validationResult.message
          : `Hay ${invalidPreviews.length} variantes con errores. Revisa: ${sampleLabels}.`

      setSubmitError(message)
      toast.error(message)
      return false
    }

    const validItems = previewItems.flatMap((previewItem) => {
      if (!previewItem.validationResult.ok) return []
      return [
        {
          idProductoVariante: previewItem.variant.idProductoVariante,
          precioOferta: previewItem.validationResult.item.precioOferta,
          ofertaInicio: previewItem.validationResult.item.ofertaInicio,
          ofertaFin: previewItem.validationResult.item.ofertaFin,
        },
      ]
    })

    setSaving(true)
    setSubmitError(null)

    const patchResult =
      idSucursal !== null
        ? await patchOfertasSucursalLote(
            validItems.map((item) => ({ ...item, idSucursal }))
          )
        : await patchOfertasLote(validItems)

    setSaving(false)

    if (!patchResult.ok) {
      setSubmitError(patchResult.message)
      toast.error(patchResult.message)
      return false
    }

    const itemMap = new Map(
      validItems.map((item) => [item.idProductoVariante, item] as const)
    )

    setProductDetail((previous) => {
      if (!previous) return previous

      return {
        ...previous,
        variantes: previous.variantes.map((variant) => {
          const appliedOffer = itemMap.get(variant.idProductoVariante)
          if (!appliedOffer) return variant

          return {
            ...variant,
            precioOferta: appliedOffer.precioOferta,
            ofertaInicio: appliedOffer.ofertaInicio,
            ofertaFin: appliedOffer.ofertaFin,
          }
        }),
      }
    })

    setProductQuery("")
    setProducts([])
    setSelectedProduct(null)
    setVariantQuery("")
    setBulkForm(createOfertaBulkFormDraft())
    setSelectedVariantIds([])
    setDraftsByVariantId({})
    setShowValidationFeedback(false)
    setSubmitError(null)
    toast.success(
      validItems.length === 1
        ? "Oferta guardada correctamente."
        : `${validItems.length} ofertas guardadas correctamente.`
    )
    return true
  }, [idSucursal, previewItems, selectedProduct])

  return {
    productQuery,
    products,
    loadingProducts,
    productsError,
    selectedProduct,
    filteredVariants,
    loadingVariants,
    variantsError,
    variantQuery,
    selectedVariantIds,
    selectedVariantIdSet,
    selectedVariants,
    allFilteredSelected,
    bulkForm,
    tableItems,
    previewItems,
    previewStats,
    showValidationFeedback,
    submitError,
    saving,
    setProductQuery,
    setVariantQuery,
    handleProductSelect,
    toggleVariantSelection,
    setVariantSelectionForIds,
    toggleSelectAllFilteredVariants,
    clearSelectedVariants,
    updateBulkFormField,
    applySchedulePreset,
    updateVariantDraftField,
    applyBulkToSelected,
    saveOffers,
  }
}
