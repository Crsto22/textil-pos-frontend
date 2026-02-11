"use client"

export function LoaderOverlay() {
  return (
    <div className="flex min-h-screen items-center justify-center z-50 ">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  )
}
