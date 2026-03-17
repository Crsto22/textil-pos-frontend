"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  arePeruUbigeoSelectionsEqual,
  findPeruUbigeoSelection,
  getEmptyPeruUbigeoSelection,
  loadPeruUbigeoCatalog,
  type PeruUbigeoDepartment,
  type SucursalLocationFields,
} from "@/lib/peru-ubigeo"

interface SucursalUbigeoFieldsProps {
  enabled: boolean
  form: SucursalLocationFields
  idPrefix: string
  onChange: (next: SucursalLocationFields) => void
}

export function SucursalUbigeoFields({
  enabled,
  form,
  idPrefix,
  onChange,
}: SucursalUbigeoFieldsProps) {
  const [catalog, setCatalog] = useState<PeruUbigeoDepartment[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [selection, setSelection] = useState(getEmptyPeruUbigeoSelection())

  const locationFields = useMemo(
    () => ({
      ubigeo: form.ubigeo,
      departamento: form.departamento,
      provincia: form.provincia,
      distrito: form.distrito,
    }),
    [form.departamento, form.distrito, form.provincia, form.ubigeo]
  )

  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true)
    setCatalogError(null)

    try {
      const nextCatalog = await loadPeruUbigeoCatalog()
      setCatalog(nextCatalog)
    } catch {
      setCatalogError("No se pudo cargar la ubicacion de Peru")
    } finally {
      setIsLoadingCatalog(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled || catalog.length > 0 || isLoadingCatalog) return
    void fetchCatalog()
  }, [catalog.length, enabled, fetchCatalog, isLoadingCatalog])

  useEffect(() => {
    if (catalog.length === 0) {
      setSelection((previous) =>
        arePeruUbigeoSelectionsEqual(previous, getEmptyPeruUbigeoSelection())
          ? previous
          : getEmptyPeruUbigeoSelection()
      )
      return
    }

    const nextSelection = findPeruUbigeoSelection(catalog, locationFields)
    setSelection((previous) =>
      arePeruUbigeoSelectionsEqual(previous, nextSelection) ? previous : nextSelection
    )
  }, [catalog, locationFields])

  const selectedDepartment = useMemo(
    () =>
      catalog.find((department) => department.code === selection.departmentCode) ?? null,
    [catalog, selection.departmentCode]
  )

  const provinceOptions = useMemo(
    () => selectedDepartment?.provinces ?? [],
    [selectedDepartment]
  )

  const selectedProvince = useMemo(
    () => provinceOptions.find((province) => province.code === selection.provinceCode) ?? null,
    [provinceOptions, selection.provinceCode]
  )

  const districtOptions = useMemo(
    () => selectedProvince?.districts ?? [],
    [selectedProvince]
  )

  const handleDepartmentChange = (departmentCode: string) => {
    const department =
      catalog.find((item) => item.code === departmentCode) ?? null

    setSelection({
      departmentCode,
      provinceCode: "",
      districtCode: "",
    })

    onChange({
      ubigeo: "",
      departamento: department?.name ?? "",
      provincia: "",
      distrito: "",
    })
  }

  const handleProvinceChange = (provinceCode: string) => {
    if (!selectedDepartment) return

    const province =
      selectedDepartment.provinces.find((item) => item.code === provinceCode) ?? null

    setSelection({
      departmentCode: selectedDepartment.code,
      provinceCode,
      districtCode: "",
    })

    onChange({
      ubigeo: "",
      departamento: selectedDepartment.name,
      provincia: province?.name ?? "",
      distrito: "",
    })
  }

  const handleDistrictChange = (districtCode: string) => {
    if (!selectedDepartment || !selectedProvince) return

    const district =
      selectedProvince.districts.find((item) => item.code === districtCode) ?? null

    setSelection({
      departmentCode: selectedDepartment.code,
      provinceCode: selectedProvince.code,
      districtCode,
    })

    onChange({
      ubigeo: district?.code ?? "",
      departamento: selectedDepartment.name,
      provincia: selectedProvince.name,
      distrito: district?.name ?? "",
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-departamento-sucursal`}>Departamento</Label>
          <Select
            value={selection.departmentCode || undefined}
            onValueChange={handleDepartmentChange}
            disabled={isLoadingCatalog || catalog.length === 0}
          >
            <SelectTrigger className="w-full" id={`${idPrefix}-departamento-sucursal`}>
              <SelectValue
                placeholder={
                  isLoadingCatalog ? "Cargando departamentos..." : "Selecciona departamento"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((department) => (
                <SelectItem key={department.code} value={department.code}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-provincia-sucursal`}>Provincia</Label>
          <Select
            value={selection.provinceCode || undefined}
            onValueChange={handleProvinceChange}
            disabled={isLoadingCatalog || selectedDepartment === null}
          >
            <SelectTrigger className="w-full" id={`${idPrefix}-provincia-sucursal`}>
              <SelectValue placeholder="Selecciona provincia" />
            </SelectTrigger>
            <SelectContent>
              {provinceOptions.map((province) => (
                <SelectItem key={province.code} value={province.code}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-distrito-sucursal`}>Distrito</Label>
          <Select
            value={selection.districtCode || undefined}
            onValueChange={handleDistrictChange}
            disabled={isLoadingCatalog || selectedProvince === null}
          >
            <SelectTrigger className="w-full" id={`${idPrefix}-distrito-sucursal`}>
              <SelectValue placeholder="Selecciona distrito" />
            </SelectTrigger>
            <SelectContent>
              {districtOptions.map((district) => (
                <SelectItem key={district.code} value={district.code}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-ubigeo-sucursal`}>Ubigeo</Label>
          <Input
            id={`${idPrefix}-ubigeo-sucursal`}
            value={form.ubigeo}
            placeholder="Se completa automaticamente"
            readOnly
          />
          <p className="text-xs text-slate-500">
            Se completa automaticamente al seleccionar el distrito.
          </p>
        </div>
      </div>

      {catalogError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <p>{catalogError}</p>
          <button
            type="button"
            onClick={() => void fetchCatalog()}
            className="mt-1 font-medium underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}
    </>
  )
}
