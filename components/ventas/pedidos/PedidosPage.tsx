"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

import { Input } from "@/components/ui/input"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

type PedidoEstado = "PENDIENTE" | "PAGADO" | "CANCELADO"
type PedidoPagoEstado = "Pendiente" | "Validado" | "Cancelado"
type PedidoMetodoPago = "YAPE" | "TRANSFERENCIA"
type PedidoMetodoEnvio = "SHALOM" | "MOTORIZADO" | "RECOJO EN TIENDA"
type PedidoTipoDocumento = "DNI" | "RUC"

interface PedidoMock {
  id: number
  fecha: string
  codigo: string
  canal: string
  tipoDocumento: PedidoTipoDocumento
  numeroDocumento: string
  nombre: string
  apellido: string
  total: number
  items: number
  metodoEnvio: PedidoMetodoEnvio
  metodoPago: PedidoMetodoPago
  pagoEstado: PedidoPagoEstado
  estado: PedidoEstado
  estadoDetalle: string
  comprobante?: {
    nombre: string
    size: string
    preview: string
  }
}

const pedidosMock: PedidoMock[] = [
  {
    id: 1,
    fecha: "03/06/2026, 06:15 p. m.",
    codigo: "PED-10072",
    canal: "TDA-ONLINE",
    tipoDocumento: "DNI",
    numeroDocumento: "90352948",
    nombre: "Milagros",
    apellido: "Quispe Rojas",
    total: 153,
    items: 2,
    metodoEnvio: "SHALOM",
    metodoPago: "YAPE",
    pagoEstado: "Pendiente",
    estado: "PENDIENTE",
    estadoDetalle: "Por validar pago",
    comprobante: {
      nombre: "captura_10072.jpg",
      size: "125 KB",
      preview: "/img/guias/pantalla1.png",
    },
  },
  {
    id: 2,
    fecha: "03/06/2026, 05:48 p. m.",
    codigo: "PED-10071",
    canal: "TDA-ONLINE",
    tipoDocumento: "RUC",
    numeroDocumento: "20605487321",
    nombre: "Comercial Andina",
    apellido: "S.A.C.",
    total: 67,
    items: 1,
    metodoEnvio: "MOTORIZADO",
    metodoPago: "TRANSFERENCIA",
    pagoEstado: "Validado",
    estado: "PAGADO",
    estadoDetalle: "Pago confirmado",
    comprobante: {
      nombre: "captura_10071.jpg",
      size: "98 KB",
      preview: "/img/guias/pantalla2.png",
    },
  },
  {
    id: 3,
    fecha: "03/06/2026, 05:42 p. m.",
    codigo: "PED-10070",
    canal: "TDA-ONLINE",
    tipoDocumento: "DNI",
    numeroDocumento: "99379480",
    nombre: "Lucia",
    apellido: "Mendoza Flores",
    total: 153,
    items: 2,
    metodoEnvio: "RECOJO EN TIENDA",
    metodoPago: "YAPE",
    pagoEstado: "Validado",
    estado: "PAGADO",
    estadoDetalle: "Pago confirmado",
    comprobante: {
      nombre: "captura_10070.jpg",
      size: "110 KB",
      preview: "/img/guias/pantalla3.png",
    },
  },
  {
    id: 4,
    fecha: "03/06/2026, 05:40 p. m.",
    codigo: "PED-10069",
    canal: "TDA-ONLINE",
    tipoDocumento: "DNI",
    numeroDocumento: "92553728",
    nombre: "Carlos",
    apellido: "Salazar Vega",
    total: 134,
    items: 1,
    metodoEnvio: "MOTORIZADO",
    metodoPago: "TRANSFERENCIA",
    pagoEstado: "Validado",
    estado: "PAGADO",
    estadoDetalle: "Pago confirmado",
    comprobante: {
      nombre: "captura_10069.jpg",
      size: "105 KB",
      preview: "/img/guias/pantalla1.png",
    },
  },
  {
    id: 5,
    fecha: "03/06/2026, 04:55 p. m.",
    codigo: "PED-10068",
    canal: "TDA-ONLINE",
    tipoDocumento: "DNI",
    numeroDocumento: "98123456",
    nombre: "Valeria",
    apellido: "Torres Huaman",
    total: 89,
    items: 1,
    metodoEnvio: "SHALOM",
    metodoPago: "YAPE",
    pagoEstado: "Pendiente",
    estado: "PENDIENTE",
    estadoDetalle: "Por validar pago",
    comprobante: {
      nombre: "captura_10068.jpg",
      size: "152 KB",
      preview: "/img/guias/pantalla2.png",
    },
  },
  {
    id: 6,
    fecha: "03/06/2026, 04:30 p. m.",
    codigo: "PED-10067",
    canal: "TDA-ONLINE",
    tipoDocumento: "RUC",
    numeroDocumento: "20481234567",
    nombre: "Textiles Rivera",
    apellido: "E.I.R.L.",
    total: 210,
    items: 3,
    metodoEnvio: "RECOJO EN TIENDA",
    metodoPago: "TRANSFERENCIA",
    pagoEstado: "Validado",
    estado: "PAGADO",
    estadoDetalle: "Pago confirmado",
    comprobante: {
      nombre: "captura_10067.jpg",
      size: "120 KB",
      preview: "/img/guias/pantalla3.png",
    },
  },
  {
    id: 7,
    fecha: "03/06/2026, 03:20 p. m.",
    codigo: "PED-10066",
    canal: "TDA-ONLINE",
    tipoDocumento: "DNI",
    numeroDocumento: "90234567",
    nombre: "Rosa",
    apellido: "Castillo Leon",
    total: 45,
    items: 1,
    metodoEnvio: "MOTORIZADO",
    metodoPago: "YAPE",
    pagoEstado: "Cancelado",
    estado: "CANCELADO",
    estadoDetalle: "Pedido cancelado",
  },
]

const estadoOptions: Array<PedidoEstado | "TODOS"> = [
  "TODOS",
  "PENDIENTE",
  "PAGADO",
  "CANCELADO",
]

const pagoOptions: Array<PedidoPagoEstado | "TODOS"> = [
  "TODOS",
  "Pendiente",
  "Validado",
  "Cancelado",
]

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value)
}

function estadoClass(estado: PedidoEstado) {
  if (estado === "PAGADO") {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20"
  }
  if (estado === "CANCELADO") {
    return "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/20"
  }
  return "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20"
}

function pagoEstadoClass(estado: PedidoPagoEstado) {
  if (estado === "Validado") return "text-emerald-700 dark:text-emerald-400"
  if (estado === "Cancelado") return "text-rose-700 dark:text-rose-400"
  return "text-amber-700 dark:text-amber-400"
}

function metodoPagoClass(metodo: PedidoMetodoPago) {
  return metodo === "TRANSFERENCIA"
    ? "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20"
    : "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20"
}

function metodoEnvioClass(metodo: PedidoMetodoEnvio) {
  if (metodo === "SHALOM") {
    return "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20"
  }
  if (metodo === "MOTORIZADO") {
    return "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20"
  }
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/20"
}

export function PedidosPage() {
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState<PedidoEstado | "TODOS">("TODOS")
  const [pagoEstado, setPagoEstado] = useState<PedidoPagoEstado | "TODOS">("TODOS")
  const [periodo, setPeriodo] = useState("HOY")

  const filteredPedidos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return pedidosMock.filter((pedido) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        pedido.codigo.toLowerCase().includes(normalizedSearch) ||
        pedido.nombre.toLowerCase().includes(normalizedSearch) ||
        pedido.apellido.toLowerCase().includes(normalizedSearch) ||
        pedido.numeroDocumento.includes(normalizedSearch) ||
        pedido.tipoDocumento.toLowerCase().includes(normalizedSearch)
      const matchesEstado = estado === "TODOS" || pedido.estado === estado
      const matchesPago = pagoEstado === "TODOS" || pedido.pagoEstado === pagoEstado

      return matchesSearch && matchesEstado && matchesPago
    })
  }, [estado, pagoEstado, search])

  const resetFilters = () => {
    setSearch("")
    setEstado("TODOS")
    setPagoEstado("TODOS")
    setPeriodo("HOY")
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1 xl:col-span-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Buscar pedido
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por pedido, DNI/RUC, nombre o apellido..."
                  className="h-11 border-slate-200 bg-white pl-10 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <select
                value={estado}
                onChange={(event) => setEstado(event.target.value as PedidoEstado | "TODOS")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                {estadoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "TODOS" ? "Todos los estados" : option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Pago</label>
              <select
                value={pagoEstado}
                onChange={(event) => setPagoEstado(event.target.value as PedidoPagoEstado | "TODOS")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                {pagoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "TODOS" ? "Todos los pagos" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Periodo</label>
              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="HOY">Hoy</option>
                <option value="AYER">Ayer</option>
                <option value="SEMANA">Semana</option>
                <option value="MES">Mes</option>
              </select>
            </div>

            <div className="flex items-end xl:col-span-3">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Mostrando {filteredPedidos.length} pedido(s) de {pedidosMock.length} registros mock
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 text-left">Fecha</th>
                <th className="px-3 py-3 text-left">Pedido</th>
                <th className="px-3 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-center">Envio</th>
                <th className="px-3 py-3 text-center">Pago</th>
                <th className="px-3 py-3 text-center">Estado</th>
                <th className="px-3 py-3 text-left">Comprobante</th>
                <th className="px-3 py-3 text-center">Accion</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-14 text-center">
                    <LoaderSpinner text="Sin pedidos para los filtros seleccionados" />
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-3 font-medium">{pedido.fecha}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{pedido.codigo}</span>
                        <span className="text-xs text-muted-foreground">{pedido.canal}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {pedido.nombre} {pedido.apellido}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pedido.tipoDocumento} {pedido.numeroDocumento}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col">
                        <span className="font-semibold">{formatMoney(pedido.total)}</span>
                        <span className="text-xs text-muted-foreground">
                          {pedido.items} item{pedido.items === 1 ? "" : "s"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${metodoEnvioClass(pedido.metodoEnvio)}`}
                      >
                        {pedido.metodoEnvio}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${metodoPagoClass(pedido.metodoPago)}`}
                        >
                          {pedido.metodoPago}
                        </span>
                        <span className={`text-[11px] font-semibold ${pagoEstadoClass(pedido.pagoEstado)}`}>
                          + {pedido.pagoEstado}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${estadoClass(pedido.estado)}`}
                        >
                          {pedido.estado}
                        </span>
                        <span className="mt-1 text-[11px] text-muted-foreground">
                          {pedido.estadoDetalle}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {pedido.comprobante ? (
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                            <Image
                              src={pedido.comprobante.preview}
                              alt={pedido.comprobante.nombre}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">{pedido.comprobante.nombre}</span>
                            <span className="text-xs text-muted-foreground">{pedido.comprobante.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                        >
                          Ver detalle
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredPedidos.map((pedido) => (
            <article
              key={pedido.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {pedido.codigo}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pedido.fecha}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${estadoClass(pedido.estado)}`}
                >
                  {pedido.estado}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {pedido.nombre} {pedido.apellido}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {pedido.tipoDocumento} {pedido.numeroDocumento}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatMoney(pedido.total)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pago</p>
                  <p className={`mt-1 text-xs font-semibold ${pagoEstadoClass(pedido.pagoEstado)}`}>
                    {pedido.metodoPago} + {pedido.pagoEstado}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Envio</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {pedido.metodoEnvio}
                  </p>
                </div>
              </div>

              <div className="mt-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Captura</p>
                <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {pedido.comprobante?.nombre ?? "Sin captura"}
                </p>
              </div>

              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
              >
                <EyeIcon className="h-4 w-4" />
                Ver detalle
              </button>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
          <p className="text-xs text-muted-foreground">
            Mostrando 1 a {filteredPedidos.length} de {filteredPedidos.length} pedidos
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-500 disabled:opacity-50 dark:border-slate-700"
              disabled
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white"
            >
              1
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-500 disabled:opacity-50 dark:border-slate-700"
              disabled
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <select className="hidden h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:block">
            <option>10 por pagina</option>
          </select>
        </div>
      </section>
    </div>
  )
}
