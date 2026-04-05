import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface ComprobantesPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}

export function ComprobantesPagination(props: ComprobantesPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="configuraciones" />
}
