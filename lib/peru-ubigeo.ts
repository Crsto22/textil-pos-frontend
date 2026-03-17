import type { SucursalBase } from "@/lib/types/sucursal"

export interface PeruUbigeoDistrict {
  code: string
  name: string
}

export interface PeruUbigeoProvince {
  code: string
  name: string
  districts: PeruUbigeoDistrict[]
}

export interface PeruUbigeoDepartment {
  code: string
  name: string
  provinces: PeruUbigeoProvince[]
}

export interface PeruUbigeoSelection {
  departmentCode: string
  provinceCode: string
  districtCode: string
}

export type SucursalLocationFields = Pick<
  SucursalBase,
  "ubigeo" | "departamento" | "provincia" | "distrito"
>

const EMPTY_SELECTION: PeruUbigeoSelection = {
  departmentCode: "",
  provinceCode: "",
  districtCode: "",
}

let peruUbigeoCatalogPromise: Promise<PeruUbigeoDepartment[]> | null = null

function normalizeLocationName(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function buildSelection(
  departmentCode: string,
  provinceCode = "",
  districtCode = ""
): PeruUbigeoSelection {
  return {
    departmentCode,
    provinceCode,
    districtCode,
  }
}

export function loadPeruUbigeoCatalog(): Promise<PeruUbigeoDepartment[]> {
  if (!peruUbigeoCatalogPromise) {
    peruUbigeoCatalogPromise = import("./data/peru-ubigeo.json").then(
      (module) => module.default as PeruUbigeoDepartment[]
    )
  }

  return peruUbigeoCatalogPromise
}

export function getEmptyPeruUbigeoSelection(): PeruUbigeoSelection {
  return EMPTY_SELECTION
}

export function arePeruUbigeoSelectionsEqual(
  left: PeruUbigeoSelection,
  right: PeruUbigeoSelection
): boolean {
  return (
    left.departmentCode === right.departmentCode &&
    left.provinceCode === right.provinceCode &&
    left.districtCode === right.districtCode
  )
}

export function findPeruUbigeoSelection(
  catalog: PeruUbigeoDepartment[],
  fields: SucursalLocationFields
): PeruUbigeoSelection {
  const ubigeo = fields.ubigeo.trim()
  if (ubigeo.length === 6) {
    for (const department of catalog) {
      for (const province of department.provinces) {
        const district = province.districts.find((item) => item.code === ubigeo)
        if (district) {
          return buildSelection(department.code, province.code, district.code)
        }
      }
    }
  }

  const departmentName = normalizeLocationName(fields.departamento)
  if (departmentName.length === 0) {
    return EMPTY_SELECTION
  }

  const department = catalog.find(
    (item) => normalizeLocationName(item.name) === departmentName
  )
  if (!department) {
    return EMPTY_SELECTION
  }

  const provinceName = normalizeLocationName(fields.provincia)
  if (provinceName.length === 0) {
    return buildSelection(department.code)
  }

  const province = department.provinces.find(
    (item) => normalizeLocationName(item.name) === provinceName
  )
  if (!province) {
    return buildSelection(department.code)
  }

  const districtName = normalizeLocationName(fields.distrito)
  if (districtName.length === 0) {
    return buildSelection(department.code, province.code)
  }

  const district = province.districts.find(
    (item) => normalizeLocationName(item.name) === districtName
  )
  if (!district) {
    return buildSelection(department.code, province.code)
  }

  return buildSelection(department.code, province.code, district.code)
}
