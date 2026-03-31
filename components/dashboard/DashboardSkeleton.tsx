interface DashboardSkeletonProps {
  showFilters?: boolean
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
}

export function DashboardSkeleton({
  showFilters = true,
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.15_0_0)]"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-9 w-9" />
            </div>
            <SkeletonBlock className="mt-4 h-8 w-24" />
            <SkeletonBlock className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.15_0_0)] lg:col-span-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-2 h-4 w-52" />
          <SkeletonBlock className="mt-6 h-72 w-full" />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.15_0_0)] lg:col-span-3">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-2 h-4 w-48" />
          <SkeletonBlock className="mt-6 h-72 w-full" />
        </div>
      </div>
    </div>
  )
}
