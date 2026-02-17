import { memo, useMemo } from "react"

interface SucursalesCardsSkeletonProps {
  cards?: number
}

function SucursalesCardsSkeletonComponent({
  cards = 6,
}: SucursalesCardsSkeletonProps) {
  const cardIndexes = useMemo(
    () => Array.from({ length: cards }, (_, index) => index),
    [cards]
  )

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cardIndexes.map((cardIndex) => (
        <div
          key={cardIndex}
          className="overflow-hidden rounded-2xl bg-card shadow-sm"
        >
          {/* Header skeleton */}
          <div className="bg-muted/40 px-5 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                <div className="flex gap-1.5">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            </div>
          </div>

          {/* Info rows skeleton */}
          <div className="space-y-2 px-5 pt-4">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-9/12 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-6/12 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Staff skeleton */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-7 animate-pulse rounded-full bg-muted"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-5" />
        </div>
      ))}
    </div>
  )
}

export const SucursalesCardsSkeleton = memo(SucursalesCardsSkeletonComponent)
