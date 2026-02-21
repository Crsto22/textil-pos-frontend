import { memo, useMemo } from "react"

interface ProductosCardsSkeletonProps {
  cards?: number
}

function ProductosCardsSkeletonComponent({ cards = 6 }: ProductosCardsSkeletonProps) {
  const indexes = useMemo(() => Array.from({ length: cards }, (_, index) => index), [cards])

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {indexes.map((index) => (
        <article key={index} className="overflow-hidden rounded-2xl border bg-card">
          <div className="aspect-[16/10] w-full animate-pulse bg-muted" />

          <div className="space-y-3 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-12 animate-pulse rounded-lg bg-muted" />
              <div className="h-12 animate-pulse rounded-lg bg-muted" />
            </div>

            <div className="flex gap-2">
              <div className="h-6 w-10 animate-pulse rounded-md bg-muted" />
              <div className="h-6 w-10 animate-pulse rounded-md bg-muted" />
              <div className="h-6 w-10 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export const ProductosCardsSkeleton = memo(ProductosCardsSkeletonComponent)
