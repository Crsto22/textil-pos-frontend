import { memo, useMemo } from "react"

interface ProductosCardsSkeletonProps {
  cards?: number
}

function ProductosCardsSkeletonComponent({ cards = 10 }: ProductosCardsSkeletonProps) {
  const indexes = useMemo(() => Array.from({ length: cards }, (_, index) => index), [cards])

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {indexes.map((index) => (
        <article key={index} className="overflow-hidden rounded-2xl border bg-card">
          <div className="h-40 w-full animate-pulse bg-muted sm:h-56" />

          <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />

            <div className="h-10 animate-pulse rounded-lg bg-muted" />

            <div className="flex gap-1.5">
              <div className="h-5 w-8 animate-pulse rounded-md bg-muted" />
              <div className="h-5 w-8 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export const ProductosCardsSkeleton = memo(ProductosCardsSkeletonComponent)
