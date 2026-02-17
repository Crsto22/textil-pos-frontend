import { memo, useMemo } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

interface SucursalesPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: (value: number | ((prev: number) => number)) => void
}

function SucursalesPaginationComponent({
  totalElements,
  totalPages,
  page,
  onPageChange,
}: SucursalesPaginationProps) {
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index),
    [totalPages]
  )

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {totalElements} sucursales
        {totalPages > 1 && ` - Pagina ${page + 1} de ${totalPages}`}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange((previous) => Math.max(0, previous - 1))}
            disabled={page === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                pageNumber === page
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {pageNumber + 1}
            </button>
          ))}

          <button
            onClick={() =>
              onPageChange((previous) => Math.min(totalPages - 1, previous + 1))
            }
            disabled={page >= totalPages - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export const SucursalesPagination = memo(SucursalesPaginationComponent)
