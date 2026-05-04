"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingBagIcon,
  TagIcon,
  TicketIcon,
  UserCircleIcon,
  XMarkIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { LoaderSpinner } from "@/components/ui/loader-spinner";
import { toast } from "sonner";

import { ProductosPagination } from "@/components/productos/ProductosPagination";
import { ClienteCreateDialog } from "@/components/clientes/modals/ClienteCreateDialog";
import { formatMonedaPen } from "@/components/productos/productos.utils";
import CatalogViewToggle from "@/components/ventas/CatalogViewToggle";
import CategoryFilter from "@/components/ventas/CategoryFilter";
import CartItem, { type CartItemData } from "@/components/ventas/CartItem";
import ClientSelect, {
  type ClientSelection,
} from "@/components/ventas/ClientSelect";
import ClientSelectSheetContent from "@/components/ventas/ClientSelectSheetContent";
import ProductCard from "@/components/ventas/ProductCard";
import ProductModal, {
  type SelectedVariant,
} from "@/components/ventas/ProductModal";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { roleCanManageStock } from "@/lib/auth/roles";
import { authFetch } from "@/lib/auth/auth-fetch";
import {
  getCotizacionErrorMessage,
  normalizeCotizacionResponse,
} from "@/lib/cotizacion";
import {
  buildCatalogVariantItems,
  buildCatalogVariantCartSelection,
  matchesCatalogVariantItem,
  type CatalogVariantItem,
  type CatalogVariantSelection,
} from "@/lib/catalog-view";
import { useCatalogoVariantes } from "@/lib/hooks/useCatalogoVariantes";
import { useCatalogViewMode } from "@/lib/hooks/useCatalogViewMode";
import { useClienteCreate } from "@/lib/hooks/useClienteCreate";
import { useComprobanteOptions } from "@/lib/hooks/useComprobanteOptions";
import { useProductos } from "@/lib/hooks/useProductos";
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions";
import {
  useBarcodeScan,
  type BarcodeScanErrorContext,
} from "@/lib/hooks/useBarcodeScan";
import { useGlobalBarcodeScanner } from "@/lib/hooks/useGlobalBarcodeScanner";
import { AgregarStockModal } from "@/components/stock/AgregarStockModal";
import { buildSucursalComboboxOption } from "@/lib/sucursal";
import type {
  CotizacionCreateRequest,
  CotizacionResponse,
  CotizacionWriteResponse,
} from "@/lib/types/cotizacion";
import type {
  Categoria,
  PageResponse as CategoriaPageResponse,
} from "@/lib/types/categoria";
import type { Cliente, ClienteCreatePrefill } from "@/lib/types/cliente";
import type {
  Color,
  PageResponse as ColorPageResponse,
} from "@/lib/types/color";
import type { ProductoResumen } from "@/lib/types/producto";
import type { VarianteEscanearResponse } from "@/lib/types/variante";
import type {
  VentaLineaPrecioTipo,
  VentaLineaPrecioOption,
} from "@/lib/types/venta-price";

const DEFAULT_CLIENT: ClientSelection = {
  idCliente: null,
  nombre: "Cliente Generico",
};

type DiscountMode = "none" | "percent" | "amount";
type DiscountTypeOption = { value: DiscountMode; label: string };

interface DiscountState {
  mode: DiscountMode;
  value: string;
}

const DISCOUNT_MODE_OPTIONS: DiscountTypeOption[] = [
  { value: "percent", label: "%" },
  { value: "amount", label: "S/" },
];

function createEmptyDiscountState(): DiscountState {
  return { mode: "none", value: "" };
}

interface CategoryFilterOption {
  id: number;
  name: string;
}

interface ColorFilterOption {
  id: number;
  name: string;
  hex: string | null | undefined;
}

interface CotizacionPageProps {
  cotizacionId?: number;
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0;
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null);
}

function parseDiscountValue(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNormalizedDiscountValue(
  mode: DiscountMode,
  rawValue: number,
  subtotal: number,
) {
  if (mode === "percent") return Math.min(100, Math.max(0, rawValue));
  if (mode === "amount") return Math.min(subtotal, Math.max(0, rawValue));
  return 0;
}

function getDiscountAmount(
  mode: DiscountMode,
  normalizedValue: number,
  subtotal: number,
) {
  if (mode === "percent") return subtotal * (normalizedValue / 100);
  if (mode === "amount") return normalizedValue;
  return 0;
}

function getDiscountType(mode: DiscountMode) {
  if (mode === "percent") return "PORCENTAJE" as const;
  if (mode === "amount") return "MONTO" as const;
  return null;
}

function formatRegisteredQuoteCode(
  serie: string | null | undefined,
  correlativo: number | null | undefined,
) {
  const safeSerie =
    typeof serie === "string" && serie.trim().length > 0 ? serie.trim() : "COT";
  const safeCorrelativo =
    typeof correlativo === "number" &&
    Number.isFinite(correlativo) &&
    correlativo > 0
      ? String(Math.trunc(correlativo)).padStart(4, "0")
      : "----";
  return `${safeSerie}-${safeCorrelativo}`;
}

function mapColorFilters(payload: unknown): ColorFilterOption[] {
  const pageData = payload as ColorPageResponse<Color> | null;
  const content = Array.isArray(pageData?.content) ? pageData.content : [];
  return content
    .filter((color) => {
      if (typeof color?.idColor !== "number" || color.idColor <= 0)
        return false;
      const estado = String(color?.estado ?? "")
        .trim()
        .toUpperCase();
      return !estado || estado === "ACTIVO";
    })
    .map((color) => ({
      id: color.idColor,
      name: color.nombre?.trim() || `Color #${color.idColor}`,
      hex: color.codigo,
    }));
}

function mapCategoryFilters(payload: unknown): CategoryFilterOption[] {
  const pageData = payload as CategoriaPageResponse<Categoria> | null;
  const content = Array.isArray(pageData?.content) ? pageData.content : [];
  return content
    .filter((categoria) => {
      if (
        typeof categoria?.idCategoria !== "number" ||
        categoria.idCategoria <= 0
      )
        return false;
      const estado = String(categoria?.estado ?? "")
        .trim()
        .toUpperCase();
      return !estado || estado === "ACTIVO";
    })
    .map((categoria) => ({
      id: categoria.idCategoria,
      name:
        categoria.nombreCategoria?.trim() ||
        `Categoria #${categoria.idCategoria}`,
    }));
}

function resolveDiscountState(cotizacion: CotizacionResponse): DiscountState {
  if (cotizacion.descuentoTotal <= 0) return createEmptyDiscountState();
  if (cotizacion.tipoDescuento === "MONTO")
    return { mode: "amount", value: String(cotizacion.descuentoTotal) };
  if (cotizacion.tipoDescuento === "PORCENTAJE") {
    const baseSubtotal = cotizacion.detalles.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    if (baseSubtotal <= 0) return createEmptyDiscountState();
    const percentage = Number(
      ((cotizacion.descuentoTotal / baseSubtotal) * 100).toFixed(2),
    );
    return percentage > 0
      ? { mode: "percent", value: String(percentage) }
      : createEmptyDiscountState();
  }
  return createEmptyDiscountState();
}

function mapCotizacionToCart(cotizacion: CotizacionResponse): CartItemData[] {
  return cotizacion.detalles.map((item) => ({
    id: item.idProducto,
    varianteId: item.idProductoVariante,
    nombre: item.nombreProducto,
    precio: item.precioUnitario,
    cantidad: item.cantidad,
    talla: item.talla || "-",
    color: item.color || "-",
    imageUrl: null,
  }));
}

export function CotizacionPage({ cotizacionId }: CotizacionPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.rol === "ADMINISTRADOR";
  const canManageStock = roleCanManageStock(user?.rol);
  const userHasSucursal = hasValidSucursalId(user?.idSucursal);
  const userSucursales = user?.sucursalesPermitidas ?? [];
  const hasMultipleSucursales = !isAdmin && userSucursales.length > 1;
  const isEditing = typeof cotizacionId === "number" && cotizacionId > 0;
  const [catalogViewMode, setCatalogViewMode] = useCatalogViewMode();
  const isVariantView = catalogViewMode === "variantes";

  const [initialSoloDisponibles] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("pos_solo_disponibles") !== "0"
      : true,
  );

  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(
    hasValidSucursalId(user?.idSucursal) ? user.idSucursal : null,
  );
  const [pendingSucursalChange, setPendingSucursalChange] = useState<
    string | null
  >(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalSession, setStockModalSession] = useState(0);
  const [stockModalDefaults, setStockModalDefaults] = useState<{
    idSucursal?: number | null;
    codigoBarras?: string | null;
    query?: string | null;
  }>({});

  // Mobile sheet states
  const [addProductSheetOpen, setAddProductSheetOpen] = useState(false);
  const [sucursalSheetOpen, setSucursalSheetOpen] = useState(false);
  const [clienteSheetOpen, setClienteSheetOpen] = useState(false);
  const [sheetSearchSucursal, setSheetSearchSucursal] = useState("");

  const {
    sucursales,
    getSucursalById,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin);

  const nonAdminSucursalVentaOptions = useMemo<ComboboxOption[]>(
    () =>
      hasMultipleSucursales
        ? userSucursales
            .filter((s) => !s.tipoSucursal || s.tipoSucursal === "VENTA")
            .map((s) => ({ value: String(s.idSucursal), label: s.nombreSucursal }))
        : [],
    [hasMultipleSucursales, userSucursales],
  );

  const sucursalesVenta = useMemo(
    () => sucursales.filter((sucursal) => sucursal.tipo === "VENTA"),
    [sucursales],
  );

  const sucursalesVentaIds = useMemo(
    () => new Set(sucursalesVenta.map((sucursal) => sucursal.idSucursal)),
    [sucursalesVenta],
  );

  const defaultAdminSucursalId = useMemo(
    () =>
      isAdmin &&
      hasValidSucursalId(user?.idSucursal) &&
      sucursalesVentaIds.has(user.idSucursal)
        ? user.idSucursal
        : null,
    [isAdmin, sucursalesVentaIds, user],
  );

  const effectiveSelectedSucursalId =
    hasValidSucursalId(selectedSucursalId) &&
    (isAdmin ? sucursalesVentaIds.has(selectedSucursalId) : true)
      ? selectedSucursalId
      : isAdmin
        ? defaultAdminSucursalId
        : userHasSucursal
          ? user.idSucursal
          : null;

  const hasSelectedSucursal = hasValidSucursalId(effectiveSelectedSucursalId);
  const resolvedSucursalId = isAdmin
    ? hasSelectedSucursal
      ? effectiveSelectedSucursalId
      : null
    : hasMultipleSucursales
      ? hasSelectedSucursal
        ? effectiveSelectedSucursalId
        : null
      : userHasSucursal
        ? (user?.idSucursal ?? null)
        : null;

  const { comprobantes: allComprobantes } = useComprobanteOptions({
    enabled: true,
  });

  const cotizacionSeries = useMemo(
    () => allComprobantes.filter((c) => c.tipoComprobante === "COTIZACION"),
    [allComprobantes],
  );

  const selectedCotizacionSerie = useMemo(() => {
    if (cotizacionSeries.length === 0) return null;
    return cotizacionSeries[0].serie;
  }, [cotizacionSeries]);

  const {
    search: searchProductos,
    setSearch: setSearchProductos,
    idCategoriaFilter: idCategoriaFilterProductos,
    idColorFilter: idColorFilterProductos,
    conOfertaFilter: conOfertaFilterProductos,
    soloDisponiblesFilter: soloDisponiblesFilterProductos,
    setIdCategoriaFilter: setIdCategoriaFilterProductos,
    setIdColorFilter: setIdColorFilterProductos,
    setConOfertaFilter: setConOfertaFilterProductos,
    setSoloDisponiblesFilter: setSoloDisponiblesFilterProductos,
    displayedProductos,
    displayedTotalElements: displayedTotalElementsProductos,
    displayedTotalPages: displayedTotalPagesProductos,
    displayedPage: displayedPageProductos,
    displayedLoading: displayedLoadingProductos,
    setDisplayedPage: setDisplayedPageProductos,
    error: errorProductosListado,
    refreshCurrentView: refreshProductosView,
  } = useProductos(
    !isVariantView && resolvedSucursalId !== null,
    resolvedSucursalId,
    initialSoloDisponibles,
  );

  const {
    search: searchVariantes,
    setSearch: setSearchVariantes,
    idCategoriaFilter: idCategoriaFilterVariantes,
    idColorFilter: idColorFilterVariantes,
    conOfertaFilter: conOfertaFilterVariantes,
    soloDisponiblesFilter: soloDisponiblesFilterVariantes,
    setIdCategoriaFilter: setIdCategoriaFilterVariantes,
    setIdColorFilter: setIdColorFilterVariantes,
    setConOfertaFilter: setConOfertaFilterVariantes,
    setSoloDisponiblesFilter: setSoloDisponiblesFilterVariantes,
    displayedCatalogVariants,
    displayedTotalElements: displayedTotalElementsVariantes,
    displayedTotalPages: displayedTotalPagesVariantes,
    displayedPage: displayedPageVariantes,
    displayedLoading: displayedLoadingVariantes,
    setDisplayedPage: setDisplayedPageVariantes,
    error: errorVariantesListado,
    refreshCurrentView: refreshVariantesView,
  } = useCatalogoVariantes(
    isVariantView && resolvedSucursalId !== null,
    resolvedSucursalId,
    initialSoloDisponibles,
  );

  // Independent sheet catalog (variant-only, always active when sheet is open)
  const {
    search: sheetSearch,
    setSearch: setSheetSearch,
    idCategoriaFilter: sheetIdCategoriaFilter,
    idColorFilter: sheetIdColorFilter,
    conOfertaFilter: sheetConOfertaFilter,
    soloDisponiblesFilter: sheetSoloDisponiblesFilter,
    setIdCategoriaFilter: setSheetIdCategoriaFilter,
    setIdColorFilter: setSheetIdColorFilter,
    setConOfertaFilter: setSheetConOfertaFilter,
    setSoloDisponiblesFilter: setSheetSoloDisponiblesFilter,
    displayedCatalogVariants: sheetCatalogVariants,
    displayedTotalElements: sheetTotalElements,
    displayedTotalPages: sheetTotalPages,
    displayedPage: sheetPage,
    displayedLoading: sheetLoading,
    setDisplayedPage: setSheetPage,
    error: sheetError,
    refreshCurrentView: refreshSheetView,
  } = useCatalogoVariantes(
    addProductSheetOpen && resolvedSucursalId !== null,
    resolvedSucursalId,
    initialSoloDisponibles,
  );

  const [cart, setCart] = useState<CartItemData[]>([]);
  const [selectedClient, setSelectedClient] =
    useState<ClientSelection>(DEFAULT_CLIENT);
  const [clientCreatePrefill, setClientCreatePrefill] =
    useState<ClienteCreatePrefill | null>(null);
  const [isClientCreateOpen, setIsClientCreateOpen] = useState(false);
  const [discount, setDiscount] = useState<DiscountState>(() =>
    createEmptyDiscountState(),
  );
  const [discountDraft, setDiscountDraft] = useState<DiscountState>(() =>
    createEmptyDiscountState(),
  );
  const [isDiscountEditorActive, setIsDiscountEditorActive] = useState(false);
  const [notes, setNotes] = useState("")
  const [notesOpen, setNotesOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<ProductoResumen | null>(
    null,
  );
  const [modalVariantSelection, setModalVariantSelection] =
    useState<CatalogVariantSelection | null>(null);
  const [cotizacionError, setCotizacionError] = useState<string | null>(null);
  const [submittingCotizacion, setSubmittingCotizacion] = useState(false);
  const [loadingCotizacion, setLoadingCotizacion] = useState(isEditing);
  const [editingLocked, setEditingLocked] = useState(false);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    CategoryFilterOption[]
  >([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [coloresDisponibles, setColoresDisponibles] = useState<
    ColorFilterOption[]
  >([]);
  const [colorPage, setColorPage] = useState(0);
  const [colorTotalPages, setColorTotalPages] = useState(1);

  const handleBarcodeScanSuccess = useCallback(
    (data: VarianteEscanearResponse) => {
      const priceOptions: VentaLineaPrecioOption[] = [
        {
          type: "normal",
          label: "Precio Unidad",
          precio: data.precio,
          description: "Precio regular",
        },
      ];
      if (
        typeof data.precioOferta === "number" &&
        data.precioOferta > 0 &&
        data.precioOferta < data.precio &&
        data.precioVigente === data.precioOferta
      ) {
        const expDesc = data.ofertaFin
          ? `Hasta ${new Date(data.ofertaFin).toLocaleDateString("es-PE")}`
          : "Oferta vigente";
        priceOptions.push({
          type: "oferta",
          label: "Precio Oferta",
          precio: data.precioOferta,
          description: expDesc,
        });
      }
      if (typeof data.precioMayor === "number" && data.precioMayor > 0) {
        priceOptions.push({
          type: "mayor",
          label: "Precio por Mayor",
          precio: data.precioMayor,
          description: "Precio por mayor",
        });
      }
      const defaultType = priceOptions.some((o) => o.type === "oferta")
        ? ("oferta" as const)
        : ("normal" as const);
      const selectedPrice =
        priceOptions.find((o) => o.type === defaultType)?.precio ??
        data.precioVigente;
      const imageUrl =
        data.imagenPrincipal?.url ?? data.imagenPrincipal?.urlThumb ?? null;
      setCart((previous) => {
        const index = previous.findIndex(
          (item) => item.varianteId === data.idProductoVariante,
        );
        if (index >= 0) {
          return previous.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  precio: selectedPrice,
                  precioSeleccionado: item.precioSeleccionado ?? defaultType,
                  preciosDisponibles: priceOptions,
                  imageUrl: imageUrl ?? item.imageUrl ?? null,
                }
              : item,
          );
        }
        return [
          ...previous,
          {
            id: data.producto.idProducto,
            varianteId: data.idProductoVariante,
            nombre: data.producto.nombre,
            precio: selectedPrice,
            precioSeleccionado: defaultType,
            preciosDisponibles: priceOptions,
            cantidad: 1,
            talla: data.talla.nombre,
            color: data.color.nombre,
            imageUrl,
          },
        ];
      });
      setCotizacionError(null);
      toast.success(
        `${data.producto.nombre} - ${data.color.nombre} ${data.talla.nombre} agregado`,
      );
    },
    [],
  );

  const openStockModal = useCallback(
    (defaults: {
      idSucursal?: number | null;
      codigoBarras?: string | null;
      query?: string | null;
    }) => {
      setStockModalDefaults(defaults);
      setStockModalSession((prev) => prev + 1);
      setStockModalOpen(true);
    },
    [],
  );

  const handleBarcodeScanError = useCallback(
    (message: string, context?: BarcodeScanErrorContext) => {
      const isStockError = /no tiene stock disponible/i.test(message);
      if (isStockError && context && canManageStock) {
        toast.error(message, {
          description: "Puedes registrar una entrada de stock.",
          action: {
            label: "Agregar stock",
            onClick: () =>
              openStockModal({
                idSucursal: context.idSucursal,
                codigoBarras: context.codigoBarras,
              }),
          },
        });
      } else {
        toast.error(message);
      }
    },
    [canManageStock, openStockModal],
  );

  const { scan: scanBarcode, scanning: scanningBarcode } = useBarcodeScan({
    idSucursal: resolvedSucursalId,
    onSuccess: handleBarcodeScanSuccess,
    onError: handleBarcodeScanError,
  });

  const { active: scannerActive, toggle: toggleScanner } =
    useGlobalBarcodeScanner({ onScan: scanBarcode });
  const { createCliente } = useClienteCreate({
    successMessage: "Cliente creado y seleccionado",
  });

  const sucursalVentaOptions = useMemo<ComboboxOption[]>(
    () =>
      sucursalesVenta.map((sucursal) => buildSucursalComboboxOption(sucursal)),
    [sucursalesVenta],
  );

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(() => {
    if (!hasSelectedSucursal) return sucursalVentaOptions;
    const selectedSucursal = getSucursalById(effectiveSelectedSucursalId);
    const selectedOption =
      selectedSucursal?.tipo === "VENTA"
        ? buildSucursalComboboxOption(selectedSucursal)
        : getSucursalOptionById(effectiveSelectedSucursalId);
    return !sucursalVentaOptions.some(
      (option) => option.value === String(effectiveSelectedSucursalId),
    )
      ? [selectedOption, ...sucursalVentaOptions]
      : sucursalVentaOptions;
  }, [
    effectiveSelectedSucursalId,
    getSucursalById,
    getSucursalOptionById,
    hasSelectedSucursal,
    sucursalVentaOptions,
  ]);

  const currentSucursalDisplayName = useMemo(() => {
    if (isAdmin) {
      if (!hasSelectedSucursal) return "Seleccionar sucursal";
      const option = sucursalComboboxOptions.find(
        (o) => o.value === String(effectiveSelectedSucursalId),
      );
      return option?.label ?? `Sucursal #${effectiveSelectedSucursalId}`;
    }
    if (hasMultipleSucursales) {
      if (!hasSelectedSucursal) return "Seleccionar sucursal";
      const option = nonAdminSucursalVentaOptions.find(
        (o) => o.value === String(effectiveSelectedSucursalId),
      );
      return option?.label ?? user?.nombreSucursal ?? `Sucursal #${effectiveSelectedSucursalId}`;
    }
    return userHasSucursal
      ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
      : "Sin sucursal asignada";
  }, [
    isAdmin,
    hasMultipleSucursales,
    userHasSucursal,
    user,
    hasSelectedSucursal,
    sucursalComboboxOptions,
    effectiveSelectedSucursalId,
    nonAdminSucursalVentaOptions,
  ]);

  const sucursalSheetOptions = isAdmin
    ? sucursalComboboxOptions
    : hasMultipleSucursales
      ? nonAdminSucursalVentaOptions
      : [];

  const filteredSucursalSheetOptions = useMemo(() => {
    if (!sheetSearchSucursal.trim()) return sucursalSheetOptions;
    const lower = sheetSearchSucursal.toLowerCase();
    return sucursalSheetOptions.filter((o) =>
      o.label.toLowerCase().includes(lower),
    );
  }, [sucursalSheetOptions, sheetSearchSucursal]);

  useEffect(() => {
    if (!isEditing || !cotizacionId) {
      setLoadingCotizacion(false);
      setEditingLocked(false);
      return;
    }
    const controller = new AbortController();
    const fetchCotizacion = async () => {
      setLoadingCotizacion(true);
      setCotizacionError(null);
      try {
        const response = await authFetch(
          `/api/cotizacion/detalle/${cotizacionId}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await parseJsonSafe(response);
        if (controller.signal.aborted) return;
        if (!response.ok) {
          const message = getCotizacionErrorMessage(
            data,
            `Error ${response.status} al cargar la cotizacion`,
          );
          setCotizacionError(message);
          setEditingLocked(false);
          return;
        }
        const cotizacion = normalizeCotizacionResponse(data);
        if (!cotizacion) {
          setCotizacionError("La cotizacion no tiene el formato esperado.");
          setEditingLocked(false);
          return;
        }
        const locked = cotizacion.estado.trim().toUpperCase() === "CONVERTIDA";
        setEditingLocked(locked);
        setSelectedClient({
          idCliente: cotizacion.idCliente,
          nombre: cotizacion.nombreCliente?.trim() || DEFAULT_CLIENT.nombre,
        });
        setSelectedSucursalId(cotizacion.idSucursal ?? null);
        const resolvedDiscount = resolveDiscountState(cotizacion);
        setDiscount(resolvedDiscount);
        setDiscountDraft(resolvedDiscount);
        setIsDiscountEditorActive(false);
        setNotes(cotizacion.observacion ?? "")
        if (cotizacion.observacion && cotizacion.observacion.trim().length > 0) setNotesOpen(true)
        setCart(mapCotizacionToCart(cotizacion));
        setCotizacionError(
          locked ? "La cotizacion convertida no se puede editar." : null,
        );
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setEditingLocked(false);
        setCotizacionError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la cotizacion",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingCotizacion(false);
      }
    };
    void fetchCotizacion();
    return () => {
      controller.abort();
    };
  }, [cotizacionId, isEditing]);

  useEffect(() => {
    const fetchCategorias = async () => {
      if (resolvedSucursalId === null) {
        setCategoriasDisponibles([]);
        setCategoryTotalPages(1);
        return;
      }
      try {
        const params = new URLSearchParams({ page: String(categoryPage) });
        if (resolvedSucursalId)
          params.set("idSucursal", String(resolvedSucursalId));
        const response = await authFetch(
          `/api/categoria/listar?${params.toString()}`,
        );
        const data = await parseJsonSafe(response);
        if (!response.ok) {
          setCategoriasDisponibles([]);
          setCategoryTotalPages(1);
          return;
        }
        const pageData = data as CategoriaPageResponse<Categoria> | null;
        const totalPages =
          typeof pageData?.totalPages === "number" && pageData.totalPages > 0
            ? pageData.totalPages
            : 1;
        if (categoryPage > totalPages - 1) {
          setCategoryPage(Math.max(0, totalPages - 1));
          return;
        }
        setCategoriasDisponibles(mapCategoryFilters(data));
        setCategoryTotalPages(totalPages);
      } catch {
        setCategoriasDisponibles([]);
        setCategoryTotalPages(1);
      }
    };
    void fetchCategorias();
  }, [categoryPage, resolvedSucursalId]);

  useEffect(() => {
    const fetchColores = async () => {
      if (resolvedSucursalId === null) {
        setColoresDisponibles([]);
        setColorTotalPages(1);
        return;
      }
      try {
        const response = await authFetch(`/api/color/listar?page=${colorPage}`);
        const data = await parseJsonSafe(response);
        if (!response.ok) {
          setColoresDisponibles([]);
          setColorTotalPages(1);
          return;
        }
        const pageData = data as ColorPageResponse<Color> | null;
        const totalPages =
          typeof pageData?.totalPages === "number" && pageData.totalPages > 0
            ? pageData.totalPages
            : 1;
        if (colorPage > totalPages - 1) {
          setColorPage(Math.max(0, totalPages - 1));
          return;
        }
        setColoresDisponibles(mapColorFilters(data));
        setColorTotalPages(totalPages);
      } catch {
        setColoresDisponibles([]);
        setColorTotalPages(1);
      }
    };
    void fetchColores();
  }, [colorPage, resolvedSucursalId]);

  const safeCategoryPage = Math.max(
    0,
    Math.min(categoryPage, Math.max(0, categoryTotalPages - 1)),
  );
  const safeColorPage = Math.max(
    0,
    Math.min(colorPage, Math.max(0, colorTotalPages - 1)),
  );
  const search = isVariantView ? searchVariantes : searchProductos;
  const idCategoriaFilter = isVariantView
    ? idCategoriaFilterVariantes
    : idCategoriaFilterProductos;
  const idColorFilter = isVariantView
    ? idColorFilterVariantes
    : idColorFilterProductos;
  const conOfertaFilter = isVariantView
    ? conOfertaFilterVariantes
    : conOfertaFilterProductos;
  const soloDisponiblesFilter = isVariantView
    ? soloDisponiblesFilterVariantes
    : soloDisponiblesFilterProductos;
  const shouldShowCatalogFilters = resolvedSucursalId !== null;
  const displayedTotalElements = isVariantView
    ? displayedTotalElementsVariantes
    : displayedTotalElementsProductos;
  const displayedTotalPages = isVariantView
    ? displayedTotalPagesVariantes
    : displayedTotalPagesProductos;
  const displayedPage = isVariantView
    ? displayedPageVariantes
    : displayedPageProductos;
  const displayedLoading = isVariantView
    ? displayedLoadingVariantes
    : displayedLoadingProductos;
  const errorProductos = isVariantView
    ? errorVariantesListado
    : errorProductosListado;
  const refreshCurrentView = isVariantView
    ? refreshVariantesView
    : refreshProductosView;
  const visibleCatalogCount = isVariantView
    ? displayedCatalogVariants.length
    : displayedProductos.length;
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  const parsedDiscountValue = parseDiscountValue(discount.value);
  const normalizedDiscountValue = useMemo(
    () =>
      getNormalizedDiscountValue(discount.mode, parsedDiscountValue, subtotal),
    [discount.mode, parsedDiscountValue, subtotal],
  );
  const discountAmount = useMemo(
    () => getDiscountAmount(discount.mode, normalizedDiscountValue, subtotal),
    [discount.mode, normalizedDiscountValue, subtotal],
  );
  const total = Math.max(0, subtotal - discountAmount);
  const payloadDiscountValue = normalizedDiscountValue;
  const payloadDiscountType = useMemo(
    () => (payloadDiscountValue > 0 ? getDiscountType(discount.mode) : null),
    [discount.mode, payloadDiscountValue],
  );
  const parsedDiscountDraftValue = parseDiscountValue(discountDraft.value);
  const normalizedDiscountDraftValue = useMemo(
    () =>
      getNormalizedDiscountValue(
        discountDraft.mode,
        parsedDiscountDraftValue,
        subtotal,
      ),
    [discountDraft.mode, parsedDiscountDraftValue, subtotal],
  );
  const discountDraftAmount = useMemo(
    () =>
      getDiscountAmount(
        discountDraft.mode,
        normalizedDiscountDraftValue,
        subtotal,
      ),
    [discountDraft.mode, normalizedDiscountDraftValue, subtotal],
  );
  const visibleDiscountAmount = isDiscountEditorActive
    ? discountDraftAmount
    : discountAmount;
  const quoteDisplayedTotal = isDiscountEditorActive
    ? Math.max(0, subtotal - discountDraftAmount)
    : total;
  const generationIssues = useMemo(
    () => [
      ...(loadingCotizacion ? ["Cargando cotizacion..."] : []),
      ...(editingLocked ? ["La cotizacion convertida no se puede editar"] : []),
      ...(cart.length === 0
        ? ["Agrega al menos una variante a la cotizacion"]
        : []),
      ...(resolvedSucursalId === null
        ? [
            isAdmin || hasMultipleSucursales
              ? "Selecciona una sucursal"
              : "Tu usuario no tiene sucursal asignada",
          ]
        : []),
      ...(selectedClient.idCliente === null
        ? ["Selecciona un cliente real"]
        : []),
    ],
    [
      cart.length,
      editingLocked,
      isAdmin,
      loadingCotizacion,
      resolvedSucursalId,
      selectedClient.idCliente,
    ],
  );
  const canGenerate = generationIssues.length === 0;

  const clearCotizacionError = useCallback(() => {
    setCotizacionError(null);
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (isVariantView) {
        setSearchVariantes(value);
        return;
      }
      setSearchProductos(value);
    },
    [isVariantView, setSearchProductos, setSearchVariantes],
  );

  const handleCategoriaFilterChange = useCallback(
    (value: number | null) => {
      if (isVariantView) {
        setIdCategoriaFilterVariantes(value);
        return;
      }
      setIdCategoriaFilterProductos(value);
    },
    [
      isVariantView,
      setIdCategoriaFilterProductos,
      setIdCategoriaFilterVariantes,
    ],
  );

  const handleColorFilterChange = useCallback(
    (value: number | null) => {
      if (isVariantView) {
        setIdColorFilterVariantes(value);
        return;
      }
      setIdColorFilterProductos(value);
    },
    [isVariantView, setIdColorFilterProductos, setIdColorFilterVariantes],
  );

  const handleConOfertaFilterChange = useCallback(
    (value: boolean) => {
      if (isVariantView) {
        setConOfertaFilterVariantes(value);
        return;
      }
      setConOfertaFilterProductos(value);
    },
    [isVariantView, setConOfertaFilterProductos, setConOfertaFilterVariantes],
  );

  const handleSoloDisponiblesFilterChange = useCallback(
    (value: boolean) => {
      if (typeof window !== "undefined")
        localStorage.setItem("pos_solo_disponibles", value ? "1" : "0");
      if (isVariantView) {
        setSoloDisponiblesFilterVariantes(value);
        return;
      }
      setSoloDisponiblesFilterProductos(value);
    },
    [
      isVariantView,
      setSoloDisponiblesFilterProductos,
      setSoloDisponiblesFilterVariantes,
    ],
  );

  const handleDisplayedPageChange = useCallback(
    (value: number | ((previous: number) => number)) => {
      if (isVariantView) {
        setDisplayedPageVariantes(value);
        return;
      }
      setDisplayedPageProductos(value);
    },
    [isVariantView, setDisplayedPageProductos, setDisplayedPageVariantes],
  );

  const handleNextCategoryPage = useCallback(() => {
    if (safeCategoryPage < categoryTotalPages - 1)
      setCategoryPage((p) => p + 1);
  }, [safeCategoryPage, categoryTotalPages]);

  const handlePrevCategoryPage = useCallback(() => {
    if (safeCategoryPage > 0) setCategoryPage((p) => Math.max(0, p - 1));
  }, [safeCategoryPage]);

  const handleNextColorPage = useCallback(() => {
    if (safeColorPage < colorTotalPages - 1) setColorPage((p) => p + 1);
  }, [safeColorPage, colorTotalPages]);

  const handlePrevColorPage = useCallback(() => {
    if (safeColorPage > 0) setColorPage((p) => Math.max(0, p - 1));
  }, [safeColorPage]);

  const resetQuoteForm = useCallback(() => {
    setCart([]);
    setSelectedClient(DEFAULT_CLIENT);
    setSelectedSucursalId(null);
    setDiscount(createEmptyDiscountState());
    setDiscountDraft(createEmptyDiscountState());
    setIsDiscountEditorActive(false);
    setNotes("");
    setCotizacionError(null);
  }, []);

  const handleClientSelect = useCallback(
    (client: ClientSelection) => {
      setSelectedClient(client);
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleSelectClientAndClose = useCallback(
    (client: ClientSelection) => {
      setSelectedClient(client);
      setClienteSheetOpen(false);
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleClientCreateOpenChange = useCallback((open: boolean) => {
    setIsClientCreateOpen(open);
    if (!open) setClientCreatePrefill(null);
  }, []);

  const handleClientCreateRequest = useCallback(
    (prefill: ClienteCreatePrefill) => {
      setClientCreatePrefill(prefill);
      setIsClientCreateOpen(true);
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleClientCreated = useCallback(
    (client: Cliente) => {
      setSelectedClient({
        idCliente: client.idCliente,
        nombre: client.nombres,
      });
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const applySucursalChange = useCallback(
    (value: string) => {
      const parsedValue = Number(value);
      setSelectedSucursalId(
        Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null,
      );
      setCategoryPage(0);
      setColorPage(0);
      setIdCategoriaFilterProductos(null);
      setIdColorFilterProductos(null);
      setIdCategoriaFilterVariantes(null);
      setIdColorFilterVariantes(null);
      setCart([]);
      clearCotizacionError();
    },
    [
      clearCotizacionError,
      setIdCategoriaFilterProductos,
      setIdColorFilterProductos,
      setIdCategoriaFilterVariantes,
      setIdColorFilterVariantes,
    ],
  );

  const handleSucursalChange = useCallback(
    (value: string) => {
      if (cart.length > 0) {
        setPendingSucursalChange(value);
        return;
      }
      applySucursalChange(value);
    },
    [cart.length, applySucursalChange],
  );

  const handleConfirmSucursalChange = useCallback(() => {
    if (pendingSucursalChange !== null) {
      applySucursalChange(pendingSucursalChange);
      setPendingSucursalChange(null);
    }
  }, [pendingSucursalChange, applySucursalChange]);

  const handleCancelSucursalChange = useCallback(() => {
    setPendingSucursalChange(null);
  }, []);

  const handleOpenDiscountEditor = useCallback(() => {
    setDiscountDraft(
      discount.mode === "none"
        ? { mode: "percent", value: "" }
        : { ...discount },
    );
    setIsDiscountEditorActive(true);
    clearCotizacionError();
  }, [clearCotizacionError, discount]);

  const handleDiscountDraftModeChange = useCallback(
    (mode: DiscountMode) => {
      setDiscountDraft((prev) => ({ mode, value: prev.value }));
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleDiscountDraftValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDiscountDraft((prev) => ({ ...prev, value: event.target.value }));
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const commitDiscountDraft = useCallback(() => {
    if (normalizedDiscountDraftValue <= 0) {
      setDiscount(createEmptyDiscountState());
    } else {
      setDiscount({
        mode: discountDraft.mode,
        value: String(normalizedDiscountDraftValue),
      });
    }
    setIsDiscountEditorActive(false);
    clearCotizacionError();
  }, [clearCotizacionError, discountDraft.mode, normalizedDiscountDraftValue]);

  const handleApplyDiscount = useCallback(() => {
    commitDiscountDraft();
  }, [commitDiscountDraft]);
  const handleNotesChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setNotes(event.target.value);
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const closeModal = useCallback(() => {
    setModalProduct(null);
    setModalVariantSelection(null);
  }, []);

  const openProductModal = useCallback(
    (producto: ProductoResumen, colorId: number | null = null) => {
      setModalVariantSelection(
        colorId !== null ? { colorId, tallaId: 0 } : null,
      );
      setModalProduct(producto);
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleEditCartItemPrice = useCallback(
    (item: CartItemData, newPrice: number) => {
      setCart((previous) =>
        previous.map((current) => {
          if (item.varianteId && current.varianteId) {
            return current.varianteId === item.varianteId
              ? { ...current, precio: newPrice, precioSeleccionado: "editado" }
              : current;
          }
          return current.id === item.id &&
            current.talla === item.talla &&
            current.color === item.color
            ? { ...current, precio: newPrice, precioSeleccionado: "editado" }
            : current;
        }),
      );
    },
    [],
  );

  const addVariantToCart = useCallback(
    (variant: SelectedVariant) => {
      setCart((previous) => {
        const index = previous.findIndex(
          (item) => item.varianteId === variant.varianteId,
        );
        if (index >= 0) {
          return previous.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  cantidad: item.cantidad + variant.cantidad,
                  precio: variant.precio,
                  precioSeleccionado: variant.precioSeleccionado,
                  preciosDisponibles: variant.preciosDisponibles,
                  imageUrl: variant.imageUrl ?? item.imageUrl ?? null,
                }
              : item,
          );
        }
        return [
          ...previous,
          {
            id: variant.id,
            varianteId: variant.varianteId,
            nombre: variant.nombre,
            precio: variant.precio,
            precioSeleccionado: variant.precioSeleccionado,
            preciosDisponibles: variant.preciosDisponibles,
            cantidad: variant.cantidad,
            talla: variant.talla,
            color: variant.color,
            imageUrl: variant.imageUrl ?? null,
          },
        ];
      });
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleSelectCatalogVariant = useCallback(
    (variant: CatalogVariantItem) => {
      if (!variant.variantId || variant.variantId <= 0) {
        setCotizacionError(
          "La variante seleccionada no tiene un identificador valido.",
        );
        return;
      }
      const nextItem = buildCatalogVariantCartSelection(variant);
      setCart((previous) => {
        const index = previous.findIndex(
          (item) => item.varianteId === nextItem.varianteId,
        );
        if (index >= 0) {
          return previous.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  precioSeleccionado:
                    item.precioSeleccionado ?? nextItem.precioSeleccionado,
                  preciosDisponibles:
                    item.preciosDisponibles ?? nextItem.preciosDisponibles,
                  imageUrl: item.imageUrl ?? nextItem.imageUrl ?? null,
                }
              : item,
          );
        }
        return [...previous, nextItem];
      });
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleSelectCartItemPrice = useCallback(
    (targetItem: CartItemData, priceType: VentaLineaPrecioTipo) => {
      setCart((previous) =>
        previous.map((item) => {
          const isSameItem =
            targetItem.varianteId && item.varianteId
              ? item.varianteId === targetItem.varianteId
              : item.id === targetItem.id &&
                item.talla === targetItem.talla &&
                item.color === targetItem.color;
          if (!isSameItem) return item;
          const selectedOption =
            item.preciosDisponibles?.find(
              (option) => option.type === priceType,
            ) ?? null;
          if (!selectedOption) return item;
          return {
            ...item,
            precio: selectedOption.precio,
            precioSeleccionado: priceType,
          };
        }),
      );
      setCotizacionError(null);
    },
    [],
  );

  const updateQty = useCallback(
    (
      id: number,
      talla: string,
      color: string,
      delta: number,
      varianteId?: number,
    ) => {
      setCart((previous) =>
        previous.map((item) => {
          const isSameItem =
            varianteId && item.varianteId
              ? item.varianteId === varianteId
              : item.id === id && item.talla === talla && item.color === color;
          if (!isSameItem) return item;
          return { ...item, cantidad: Math.max(1, item.cantidad + delta) };
        }),
      );
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const removeFromCart = useCallback(
    (id: number, talla: string, color: string, varianteId?: number) => {
      setCart((previous) =>
        previous.filter((item) => {
          if (varianteId && item.varianteId)
            return item.varianteId !== varianteId;
          return !(
            item.id === id &&
            item.talla === talla &&
            item.color === color
          );
        }),
      );
      clearCotizacionError();
    },
    [clearCotizacionError],
  );

  const handleGenerateQuote = useCallback(async () => {
    if (isDiscountEditorActive) commitDiscountDraft();
    if (!canGenerate) {
      const message = generationIssues[0] ?? "Completa los datos obligatorios.";
      setCotizacionError(message);
      toast.error(message);
      return;
    }
    if (submittingCotizacion) return;
    const invalidItem = cart.find(
      (item) => typeof item.varianteId !== "number" || item.varianteId <= 0,
    );
    if (invalidItem) {
      const message = `El item "${invalidItem.nombre}" no tiene una variante valida. Vuelve a seleccionarlo.`;
      setCotizacionError(message);
      toast.error(message);
      return;
    }
    if (resolvedSucursalId === null || selectedClient.idCliente === null) {
      const message =
        "Debes seleccionar una sucursal y un cliente antes de registrar la cotizacion.";
      setCotizacionError(message);
      toast.error(message);
      return;
    }
    if (!selectedCotizacionSerie) {
      const message =
        "No hay una serie de cotizacion configurada. Crea una en Configuracion > Comprobantes.";
      setCotizacionError(message);
      toast.error(message);
      return;
    }
    const payload: CotizacionCreateRequest = {
      idSucursal: resolvedSucursalId,
      idCliente: selectedClient.idCliente,
      serie: selectedCotizacionSerie,
      descuentoTotal: payloadDiscountValue,
      tipoDescuento: payloadDiscountType,
      observacion: notes.trim().length > 0 ? notes.trim() : null,
      detalles: cart.map((item) => ({
        idProductoVariante: item.varianteId as number,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precio.toFixed(2)),
        descuento: 0,
      })),
    };
    setSubmittingCotizacion(true);
    setCotizacionError(null);
    const requestUrl = isEditing
      ? `/api/cotizacion/actualizar/${cotizacionId}`
      : "/api/cotizacion/insertar";
    const requestMethod = isEditing ? "PUT" : "POST";
    const requestPromise = (async () => {
      const response = await authFetch(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafe(response);
      if (!response.ok)
        throw new Error(
          getCotizacionErrorMessage(
            data,
            `Error ${response.status} al registrar la cotizacion`,
          ),
        );
      return data as CotizacionWriteResponse;
    })();
    toast.promise(requestPromise, {
      loading: isEditing
        ? "Actualizando cotizacion..."
        : "Registrando cotizacion...",
      success: (data) =>
        `Cotizacion ${formatRegisteredQuoteCode(data.serie, data.correlativo)} ${isEditing ? "actualizada" : "registrada"}`,
      error: (error) =>
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor. Intente nuevamente.",
    });
    try {
      const responseData = await requestPromise;
      if (isEditing)
        router.push(
          `/ventas/cotizacion/historial?cotizacionId=${responseData.idCotizacion}`,
        );
      else resetQuoteForm();
    } catch (error) {
      setCotizacionError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la cotizacion.",
      );
    } finally {
      setSubmittingCotizacion(false);
    }
  }, [
    canGenerate,
    cart,
    commitDiscountDraft,
    generationIssues,
    isDiscountEditorActive,
    notes,
    payloadDiscountType,
    payloadDiscountValue,
    resolvedSucursalId,
    resetQuoteForm,
    router,
    selectedClient.idCliente,
    submittingCotizacion,
    cotizacionId,
    isEditing,
    selectedCotizacionSerie,
  ]);

  if (isEditing && loadingCotizacion) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
        <div className="rounded-2xl border bg-card px-8 py-10 shadow-sm">
          <LoaderSpinner text="Cargando cotizacion..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ProductModal
        product={modalProduct}
        initialSelection={modalVariantSelection}
        idSucursal={resolvedSucursalId}
        onClose={closeModal}
        onConfirm={addVariantToCart}
      />
      <ClienteCreateDialog
        open={isClientCreateOpen}
        onOpenChange={handleClientCreateOpenChange}
        onCreate={createCliente}
        prefill={clientCreatePrefill}
        onCreated={handleClientCreated}
      />

      <Dialog
        open={pendingSucursalChange !== null}
        onOpenChange={(open) => {
          if (!open) handleCancelSucursalChange();
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Cambiar sucursal?</DialogTitle>
            <DialogDescription>
              Tienes{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {cart.length} {cart.length === 1 ? "producto" : "productos"}
              </span>{" "}
              en la cotizacion actual. Al cambiar de sucursal se eliminará la
              cotizacion completa porque el stock es diferente por sucursal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSucursalChange}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmSucursalChange}>
              Cambiar sucursal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Sheet SUCURSAL (mobile) ─── */}
      <Sheet open={sucursalSheetOpen} onOpenChange={setSucursalSheetOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[75dvh] flex-col gap-0 p-0"
        >
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Seleccionar Sucursal</SheetTitle>
          </SheetHeader>
          <div className="shrink-0 px-4 pt-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar sucursal..."
                value={sheetSearchSucursal}
                onChange={(e) => setSheetSearchSucursal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto space-y-1 px-4 pb-6 pt-2">
            {filteredSucursalSheetOptions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No se encontraron sucursales
              </div>
            ) : (
              filteredSucursalSheetOptions.map((option) => {
                const isSelected =
                  option.value === String(effectiveSelectedSucursalId ?? "");
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleSucursalChange(option.value);
                      setSucursalSheetOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${isSelected ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" : "hover:bg-slate-50 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60"}`}
                  >
                    {option.label}
                    {isSelected && (
                      <CheckCircleIcon className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Sheet CLIENTE (mobile) ─── */}
      <Sheet open={clienteSheetOpen} onOpenChange={setClienteSheetOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[75dvh] flex-col gap-0 p-0"
        >
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Seleccionar Cliente</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-2">
            <ClientSelectSheetContent
              selected={selectedClient}
              onSelect={handleSelectClientAndClose}
              onCreateClientRequest={(prefill) => {
                setClienteSheetOpen(false);
                handleClientCreateRequest(prefill);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Sheet CATÁLOGO (mobile) ─── */}
      <Sheet open={addProductSheetOpen} onOpenChange={setAddProductSheetOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] flex-col gap-0 p-0"
        >
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Agregar Producto
            </SheetTitle>
          </SheetHeader>

          <div className="flex shrink-0 flex-col gap-2 px-4 pt-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, nombre, color o talla..."
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setSheetConOfertaFilter(!sheetConOfertaFilter)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all ${sheetConOfertaFilter ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/70 dark:bg-blue-500/10 dark:text-blue-200" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                aria-pressed={sheetConOfertaFilter}
              >
                <TagIcon className="h-3.5 w-3.5" />
                {sheetConOfertaFilter ? "Ofertas activas" : "Solo ofertas"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSheetSoloDisponiblesFilter(!sheetSoloDisponiblesFilter)
                }
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all ${sheetSoloDisponiblesFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                aria-pressed={sheetSoloDisponiblesFilter}
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {sheetSoloDisponiblesFilter ? "Disponibles" : "Disponible"}
              </button>
            </div>
            {resolvedSucursalId !== null && (
              <>
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                  <CategoryFilter
                    categories={categoriasDisponibles}
                    colors={coloresDisponibles}
                    activeCategoryId={sheetIdCategoriaFilter}
                    onCategoryChange={setSheetIdCategoriaFilter}
                    activeColorId={sheetIdColorFilter}
                    onColorChange={setSheetIdColorFilter}
                    categoryPage={safeCategoryPage}
                    categoryTotalPages={categoryTotalPages}
                    onCategoryNextPage={handleNextCategoryPage}
                    onCategoryPrevPage={handlePrevCategoryPage}
                    colorPage={safeColorPage}
                    colorTotalPages={colorTotalPages}
                    onColorNextPage={handleNextColorPage}
                    onColorPrevPage={handlePrevColorPage}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {sheetCatalogVariants.length} variante(s) en esta
                  pagina.
                </p>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
            {resolvedSucursalId === null ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <BuildingStorefrontIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Selecciona una sucursal
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Elige una sucursal en el panel principal
                </p>
              </div>
            ) : sheetLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoaderSpinner text="Cargando catalogo..." />
              </div>
            ) : sheetError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <CubeIcon className="h-12 w-12 text-rose-200 dark:text-rose-800" />
                <p className="text-sm font-semibold text-slate-500">
                  {sheetError}
                </p>
                <button
                  onClick={() => {
                    void refreshSheetView();
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : sheetCatalogVariants.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 xs:grid-cols-3">
                {sheetCatalogVariants.map((variant) => (
                  <ProductCard
                    key={variant.key}
                    product={variant.product}
                    variantItem={variant}
                    onAdd={() => handleSelectCatalogVariant(variant)}
                    cartQty={
                      cart.find((i) => i.varianteId === variant.variantId)
                        ?.cantidad ?? 0
                    }
                    onAddStock={
                      canManageStock &&
                      variant.stock !== null &&
                      variant.stock <= 0
                        ? () =>
                            openStockModal({
                              idSucursal: resolvedSucursalId,
                              codigoBarras: variant.codigoBarras ?? null,
                              query: !variant.codigoBarras
                                ? `${variant.productName} ${variant.tallaName}`
                                : null,
                            })
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <CubeIcon className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">
                  Sin resultados
                </p>
              </div>
            )}
            {!sheetLoading && !sheetError && (
              <ProductosPagination
                totalElements={sheetTotalElements}
                totalPages={sheetTotalPages}
                page={sheetPage}
                onPageChange={setSheetPage}
                itemLabel="variantes"
              />
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={() => setAddProductSheetOpen(false)}
              disabled={cart.length === 0}
            >
              Cotizar
              {cart.length > 0
                ? ` (${cart.reduce((s, i) => s + i.cantidad, 0)} items)`
                : ""}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-5">
        {/* ─── LEFT PANEL: catalog (desktop only) ─── */}
        <div className="hidden sm:flex min-h-0 min-w-0 flex-[7] flex-col gap-3">
          <div className="flex shrink-0 flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    isVariantView
                      ? "Buscar por SKU, nombre, color o talla..."
                      : "Buscar por nombre, SKU o categoria..."
                  }
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleConOfertaFilterChange(!conOfertaFilter)}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${conOfertaFilter ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/70 dark:bg-blue-500/10 dark:text-blue-200" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70"}`}
                  aria-pressed={conOfertaFilter}
                >
                  <TagIcon className="h-4 w-4" />
                  {conOfertaFilter ? "Ofertas activas" : "Solo ofertas"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSoloDisponiblesFilterChange(!soloDisponiblesFilter)
                  }
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${soloDisponiblesFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70"}`}
                  aria-pressed={soloDisponiblesFilter}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {soloDisponiblesFilter ? "Disponibles" : "Disponible"}
                </button>
                <button
                  type="button"
                  onClick={toggleScanner}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${scannerActive ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70"}`}
                  aria-pressed={scannerActive}
                >
                  <QrCodeIcon className="h-4 w-4" />
                  Escaner
                  {scanningBarcode && (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  )}
                </button>
                <CatalogViewToggle
                  value={catalogViewMode}
                  onChange={setCatalogViewMode}
                  iconSet="ventas"
                />
              </div>
            </div>

            {shouldShowCatalogFilters ? (
              <>
                <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                  <CategoryFilter
                    categories={categoriasDisponibles}
                    colors={coloresDisponibles}
                    activeCategoryId={idCategoriaFilter}
                    onCategoryChange={handleCategoriaFilterChange}
                    activeColorId={idColorFilter}
                    onColorChange={handleColorFilterChange}
                    categoryPage={safeCategoryPage}
                    categoryTotalPages={categoryTotalPages}
                    onCategoryNextPage={handleNextCategoryPage}
                    onCategoryPrevPage={handlePrevCategoryPage}
                    colorPage={safeColorPage}
                    colorTotalPages={colorTotalPages}
                    onColorNextPage={handleNextColorPage}
                    onColorPrevPage={handlePrevColorPage}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {visibleCatalogCount}{" "}
                  {isVariantView ? "variante(s)" : "producto(s)"} en esta
                  pagina.
                </p>
              </>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
            {resolvedSucursalId === null ? (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <BuildingStorefrontIcon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Selecciona una sucursal
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Elige una sucursal para ver el catalogo de productos
                </p>
              </div>
            ) : displayedLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoaderSpinner text="Cargando catalogo..." />
              </div>
            ) : errorProductos ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <CubeIcon className="h-12 w-12 text-rose-200 dark:text-rose-800" />
                <p className="text-sm font-semibold text-slate-500">
                  {errorProductos}
                </p>
                <button
                  onClick={() => void refreshCurrentView()}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : isVariantView ? (
              displayedCatalogVariants.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  {displayedCatalogVariants.map((variant) => (
                    <ProductCard
                      key={variant.key}
                      product={variant.product}
                      variantItem={variant}
                      onAdd={() => handleSelectCatalogVariant(variant)}
                      onAddStock={
                        canManageStock &&
                        variant.stock !== null &&
                        variant.stock <= 0
                          ? () =>
                              openStockModal({
                                idSucursal: resolvedSucursalId,
                                codigoBarras: variant.codigoBarras ?? null,
                                query: !variant.codigoBarras
                                  ? `${variant.productName} ${variant.tallaName}`
                                  : null,
                              })
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                  <CubeIcon className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">
                    Sin resultados
                  </p>
                </div>
              )
            ) : displayedProductos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {displayedProductos.map((producto) => (
                  <ProductCard
                    key={producto.idProducto}
                    product={producto}
                    onAdd={openProductModal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                <CubeIcon className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">
                  Sin resultados
                </p>
              </div>
            )}
            {!displayedLoading && !errorProductos && (
              <ProductosPagination
                totalElements={displayedTotalElements}
                totalPages={displayedTotalPages}
                page={displayedPage}
                onPageChange={handleDisplayedPageChange}
                itemLabel={isVariantView ? "variantes" : "productos"}
              />
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: cotizacion ─── */}
        <div className="flex w-full min-h-0 flex-col gap-2 sm:min-w-[340px] sm:max-w-[450px] sm:flex-[3.4]">
          <div className="py-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isEditing ? "Editar Cotizacion" : "Cotizacion"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Actualiza cliente, sucursal, productos y observaciones."
                : "Selecciona cliente, sucursal, productos y observaciones."}
            </p>
          </div>

          {/* ─── Mobile: Agregar Producto button ─── */}
          <button
            type="button"
            onClick={() => setAddProductSheetOpen(true)}
            className="sm:hidden flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100/60 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar Producto
          </button>

          {/* ─── Mobile: tappable selectors ─── */}
          <div className="sm:hidden shrink-0 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {isAdmin || hasMultipleSucursales ? (
                <button
                  type="button"
                  onClick={() => {
                    setSheetSearchSucursal("");
                    setSucursalSheetOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:bg-slate-50 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:bg-slate-700/40"
                >
                  <BuildingStorefrontIcon className="h-4 w-4 shrink-0 text-blue-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Sucursal
                    </p>
                    <p
                      className={`truncate text-xs font-medium ${hasSelectedSucursal ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      {currentSucursalDisplayName}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                  <BuildingStorefrontIcon className="h-4 w-4 shrink-0 text-blue-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Sucursal
                    </p>
                    <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                      {currentSucursalDisplayName}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setClienteSheetOpen(true)}
                className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:bg-slate-50 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:bg-slate-700/40"
              >
                <UserCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Cliente
                  </p>
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                    {selectedClient.nombre || "Cliente Generico"}
                  </p>
                </div>
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
              </button>
            </div>
          </div>

          {/* ─── Desktop: combobox selectors ─── */}
          <div className="hidden sm:flex shrink-0 flex-col gap-2 px-1">
            <div className="flex items-center gap-2">
              <SectionLabel>Sucursal</SectionLabel>
              <div className="flex-1">
                {isAdmin || hasMultipleSucursales ? (
                  <Combobox
                    id="cotizacion-sucursal"
                    value={
                      hasSelectedSucursal
                        ? String(effectiveSelectedSucursalId)
                        : ""
                    }
                    options={isAdmin ? sucursalComboboxOptions : nonAdminSucursalVentaOptions}
                    searchValue={searchSucursal}
                    onSearchValueChange={setSearchSucursal}
                    onValueChange={handleSucursalChange}
                    placeholder={isAdmin ? "Selecciona sucursal" : "Sucursal"}
                    searchPlaceholder="Buscar sucursal..."
                    emptyMessage="No se encontraron sucursales"
                    loading={loadingSucursales}
                  />
                ) : (
                  <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                    <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-300">
                      {userHasSucursal
                        ? user?.nombreSucursal ||
                          `Sucursal #${user?.idSucursal}`
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
                <ClientSelect
                  selected={selectedClient}
                  onSelect={handleClientSelect}
                  onCreateClientRequest={handleClientCreateRequest}
                />
              </div>
            </div>
          </div>

          {/* Cart */}
          <Card className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-3.5 dark:border-slate-700/60">
              <SectionLabel>Variantes Cotizadas</SectionLabel>
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
            <div
              className="min-h-0 flex-1 overflow-y-auto px-4"
              style={{ scrollbarWidth: "none" }}
            >
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                  <ShoppingBagIcon className="h-9 w-9 text-slate-200 dark:text-slate-700" />
                  <p className="max-w-[180px] text-xs font-medium leading-snug text-slate-400 dark:text-slate-600">
                    Agrega variantes para armar la propuesta comercial.
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
                      removeFromCart(
                        id,
                        item.talla,
                        item.color,
                        item.varianteId,
                      )
                    }
                    onSelectPrice={handleSelectCartItemPrice}
                    onEditPrice={handleEditCartItemPrice}
                    showPriceTypeBadge
                  />
                ))
              )}
            </div>
          </Card>

          {/* Totals + Descuento + Observaciones (desktop only) */}
          <Card className="hidden sm:block p-3.5">
            <div className="space-y-3">
              {/* Descuento */}
              <div className="space-y-2">
                {isDiscountEditorActive ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                        <TicketIcon className="h-2.5 w-2.5" />
                      </span>
                      Editando Descuento
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
                      aria-label="Cerrar editor de descuento"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenDiscountEditor}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                      <TicketIcon className="h-2.5 w-2.5" />
                    </span>
                    {payloadDiscountType ? "Editar Descuento" : "Aplicar Descuento"}
                  </button>
                )}

                {isDiscountEditorActive && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                      {DISCOUNT_MODE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleDiscountDraftModeChange(option.value)}
                          className={[
                            "flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-semibold transition-all",
                            discountDraft.mode === option.value
                              ? "bg-[#5964f2] text-white shadow-[0_8px_18px_rgba(89,100,242,0.4)]"
                              : "text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                          ].join(" ")}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step={discountDraft.mode === "percent" ? "0.1" : "0.01"}
                        max={discountDraft.mode === "percent" ? "100" : undefined}
                        value={discountDraft.value}
                        onChange={handleDiscountDraftValueChange}
                        placeholder={discountDraft.mode === "percent" ? "12" : "25.00"}
                        className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Observaciones acordeon */}
              <div className="rounded-xl border border-slate-100 overflow-hidden dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setNotesOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Observaciones</span>
                    {notes.trim().length > 0 && !notesOpen && (
                      <span className="truncate max-w-[160px] text-[11px] text-slate-400 dark:text-slate-500">
                        {notes.trim()}
                      </span>
                    )}
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${notesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {notesOpen && (
                  <div className="border-t border-slate-100 px-3 pb-3 pt-2 dark:border-slate-700/60">
                    <Textarea
                      value={notes}
                      onChange={handleNotesChange}
                      rows={3}
                      placeholder="Observaciones comerciales, tiempos de entrega o condiciones."
                      className="resize-none rounded-xl border-slate-200 bg-white text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="space-y-2 border-t border-dashed border-slate-100 pt-3 text-sm dark:border-slate-700/60">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatMonedaPen(subtotal)}</span>
                </div>
                {visibleDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Descuento</span>
                    <span className="tabular-nums">-{formatMonedaPen(visibleDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                  <span>Total cotizado</span>
                  <span className="tabular-nums text-blue-600 dark:text-blue-400">{formatMonedaPen(quoteDisplayedTotal)}</span>
                </div>
              </div>
            </div>
          </Card>

          {cotizacionError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/40 dark:bg-red-900/15">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold leading-snug text-red-700 dark:text-red-400">
                  {cotizacionError}
                </p>
                <button
                  onClick={() => setCotizacionError(null)}
                  className="mt-0.5 text-[10px] text-red-400 hover:text-red-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Action buttons (desktop) */}
          <div className="hidden sm:flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                void handleGenerateQuote();
              }}
              disabled={!canGenerate || submittingCotizacion}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all duration-200",
                canGenerate && !submittingCotizacion
                  ? "bg-gradient-to-r from-[#3266E4] to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
              ].join(" ")}
            >
              {submittingCotizacion ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  {isEditing ? "Actualizando..." : "Registrando..."}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  {isEditing ? "Actualizar Cotizacion" : "Generar Cotizacion"}
                </>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => router.push("/ventas/cotizacion/historial")}
                disabled={submittingCotizacion}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70"
              >
                Volver al historial
              </button>
            )}
            {!canGenerate && (
              <p className="text-center text-[11px] text-slate-400 dark:text-slate-600">
                {generationIssues[0]}
              </p>
            )}
          </div>

          {/* Mobile sticky footer */}
          <div className="sm:hidden shrink-0 rounded-t-2xl border-t border-slate-100 bg-white shadow-[0_-4px_20px_rgba(15,23,42,0.08)] dark:border-slate-700/60 dark:bg-slate-900 px-4 pb-6 pt-3">

            {/* Descuento mobile */}
            <div className="mb-3 space-y-2">
              {isDiscountEditorActive ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                      <TicketIcon className="h-2.5 w-2.5" />
                    </span>
                    Editando Descuento
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
                    aria-label="Cerrar editor de descuento"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenDiscountEditor}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                    <TicketIcon className="h-2.5 w-2.5" />
                  </span>
                  {payloadDiscountType ? "Editar Descuento" : "Aplicar Descuento"}
                </button>
              )}
              {isDiscountEditorActive && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                    {DISCOUNT_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleDiscountDraftModeChange(option.value)}
                        className={[
                          "flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-semibold transition-all",
                          discountDraft.mode === option.value
                            ? "bg-[#5964f2] text-white shadow-[0_8px_18px_rgba(89,100,242,0.4)]"
                            : "text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step={discountDraft.mode === "percent" ? "0.1" : "0.01"}
                      max={discountDraft.mode === "percent" ? "100" : undefined}
                      value={discountDraft.value}
                      onChange={handleDiscountDraftValueChange}
                      placeholder={discountDraft.mode === "percent" ? "12" : "25.00"}
                      className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones acordeon mobile */}
            <div className="mb-3 rounded-xl border border-slate-100 overflow-hidden dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setNotesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Observaciones</span>
                  {notes.trim().length > 0 && !notesOpen && (
                    <span className="truncate max-w-[160px] text-[11px] text-slate-400 dark:text-slate-500">
                      {notes.trim()}
                    </span>
                  )}
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${notesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {notesOpen && (
                <div className="border-t border-slate-100 px-3 pb-3 pt-2 dark:border-slate-700/60">
                  <Textarea
                    value={notes}
                    onChange={handleNotesChange}
                    rows={3}
                    placeholder="Observaciones comerciales, tiempos de entrega o condiciones."
                    className="resize-none rounded-xl border-slate-200 bg-white text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Totales mobile */}
            <div className="mb-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Total cotizado
                </p>
                <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {formatMonedaPen(quoteDisplayedTotal)}
                </p>
                {visibleDiscountAmount > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Descuento: -{formatMonedaPen(visibleDiscountAmount)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-slate-500">
                  Sub: {formatMonedaPen(subtotal)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleGenerateQuote();
              }}
              disabled={!canGenerate || submittingCotizacion}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all duration-200",
                canGenerate && !submittingCotizacion
                  ? "bg-gradient-to-r from-[#3266E4] to-indigo-600 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
              ].join(" ")}
            >
              {submittingCotizacion ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {isEditing ? "Actualizando..." : "Registrando..."}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  {isEditing ? "Actualizar Cotizacion" : "Generar Cotizacion"}
                </>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => router.push("/ventas/cotizacion/historial")}
                disabled={submittingCotizacion}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Volver al historial
              </button>
            )}
            {!canGenerate && (
              <p className="mt-1.5 text-center text-[11px] text-slate-400">
                {generationIssues[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      <AgregarStockModal
        key={`stock-modal-${stockModalSession}`}
        open={stockModalOpen}
        onOpenChange={setStockModalOpen}
        defaultIdSucursal={stockModalDefaults.idSucursal}
        defaultCodigoBarras={stockModalDefaults.codigoBarras}
        defaultQuery={stockModalDefaults.query}
        onSuccess={() => {
          if (isVariantView) refreshVariantesView();
          else refreshProductosView();
        }}
      />
    </>
  );
}
