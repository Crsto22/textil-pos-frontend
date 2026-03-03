import { BanknotesIcon, ClipboardDocumentCheckIcon, XCircleIcon } from "@heroicons/react/24/outline"

import { formatMonto } from "@/components/ventas/historial/historial.utils"

interface VentasHistorialStatsProps {
  ventasPaginaCount: number
  totalElements: number
  emitidasCount: number
  anuladasCount: number
  totalMontoPagina: number
}

export function VentasHistorialStats({
  ventasPaginaCount,
  totalElements,
  emitidasCount,
  anuladasCount,
  totalMontoPagina,
}: VentasHistorialStatsProps) {
  const ticketPromedio = ventasPaginaCount > 0 ? totalMontoPagina / ventasPaginaCount : 0

  const cards = [
    {
      title: "Registros Pagina",
      value: ventasPaginaCount.toString(),
      helper: `${totalElements} en total`,
      icon: ClipboardDocumentCheckIcon,
      className:
        "from-blue-500/20 to-cyan-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/30",
    },
    {
      title: "Monto Pagina",
      value: formatMonto(totalMontoPagina),
      helper: "Suma de la pagina actual",
      icon: BanknotesIcon,
      className:
        "from-emerald-500/20 to-lime-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/30",
    },
    {
      title: "Ticket Promedio",
      value: formatMonto(ticketPromedio),
      helper: "Promedio de la pagina",
      icon: ClipboardDocumentCheckIcon,
      className:
        "from-violet-500/20 to-indigo-500/10 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/30",
    },
    {
      title: "Estado (Pagina)",
      value: `${emitidasCount} / ${anuladasCount}`,
      helper: "Emitidas / Anuladas",
      icon: XCircleIcon,
      className:
        "from-rose-500/20 to-orange-500/10 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-500/30",
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.title}
            className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${card.className}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.title}</p>
              <Icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="mt-1 text-xs opacity-80">{card.helper}</p>
          </article>
        )
      })}
    </section>
  )
}
