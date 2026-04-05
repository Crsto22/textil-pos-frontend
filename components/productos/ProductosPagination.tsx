import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface ProductosPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
  itemLabel?: string
}

export function ProductosPagination({ itemLabel = "productos", ...props }: ProductosPaginationProps) {
  return <PaginationResponsive {...props} itemLabel={itemLabel} />
}
