import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface ClientesPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}

export function ClientesPagination(props: ClientesPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="clientes" />
}
