import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface SucursalesPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: (value: number | ((prev: number) => number)) => void
}

export function SucursalesPagination(props: SucursalesPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="sucursales" />
}
