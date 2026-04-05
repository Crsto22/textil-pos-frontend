import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface UsuariosPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}

export function UsuariosPagination(props: UsuariosPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="usuarios" />
}
