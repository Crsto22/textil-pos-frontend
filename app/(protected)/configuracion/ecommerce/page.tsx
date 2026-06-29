"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { resolveBackendUrl } from "@/lib/resolve-backend-url"
import { toast } from "sonner"

interface EcommercePortada {
  idEcommercePortada: number
  desktopUrl: string
  desktopThumbUrl: string | null
  mobileUrl: string
  mobileThumbUrl: string | null
  orden: number
  estado: "ACTIVO" | "INACTIVO"
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_MB = 8
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const DESKTOP_TEMPLATE_URL = "https://canva.link/31yeqi6pa3bb9qm"
const MOBILE_TEMPLATE_URL = "https://canva.link/z8y57x1yc8jharh"

function validateImage(file: File | null): string | null {
  if (!file) return "Selecciona imagen desktop y mobile."
  if (!ACCEPTED_TYPES.includes(file.type)) return "Solo se permiten JPG, PNG o WEBP."
  if (file.size > MAX_SIZE_BYTES) return `Cada imagen debe pesar maximo ${MAX_SIZE_MB} MB.`
  return null
}

function FilePicker({
  label,
  dimensions,
  aspectClass,
  templateUrl,
  icon: Icon,
  file,
  onChange,
}: {
  label: string
  dimensions: string
  aspectClass: string
  templateUrl: string
  icon: typeof ComputerDesktopIcon
  file: File | null
  onChange: (file: File | null) => void
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null)
    event.target.value = ""
  }

  return (
    <label className="block rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <span className="mb-3 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" />
            {label}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">Medida: {dimensions}</span>
        </span>
        <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
          <a href={templateUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Plantilla
          </a>
        </Button>
      </span>
      <input type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleChange} className="sr-only" />
      <div className={`relative flex ${aspectClass} cursor-pointer items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground`}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs">
            <PhotoIcon className="h-7 w-7" />
            Seleccionar imagen
          </div>
        )}
      </div>
      {file && <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>}
    </label>
  )
}

export default function EcommercePage() {
  const { user, isLoading } = useAuth()
  const canManage = user?.rol === "ADMINISTRADOR" || user?.rol === "SISTEMA"
  const [portadas, setPortadas] = useState<EcommercePortada[]>([])
  const [desktop, setDesktop] = useState<File | null>(null)
  const [mobile, setMobile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchPortadas = async () => {
    setLoading(true)
    const response = await authFetch("/api/config/ecommerce/portadas")
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudieron cargar las portadas")
      setLoading(false)
      return
    }
    setPortadas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    if (!isLoading && canManage) {
      void fetchPortadas()
    } else if (!isLoading) {
      setLoading(false)
    }
  }, [isLoading, canManage])

  const handleCreate = async () => {
    const validation = validateImage(desktop) ?? validateImage(mobile)
    if (validation) {
      toast.error(validation)
      return
    }

    setSaving(true)
    const formData = new FormData()
    formData.append("desktop", desktop as File)
    formData.append("mobile", mobile as File)

    const response = await authFetch("/api/config/ecommerce/portadas", {
      method: "POST",
      body: formData,
    })
    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo subir la portada")
      return
    }

    setDesktop(null)
    setMobile(null)
    toast.success("Portada subida correctamente")
    await fetchPortadas()
  }

  const handleEstado = async (portada: EcommercePortada) => {
    const estado = portada.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO"
    const response = await authFetch(`/api/config/ecommerce/portadas/${portada.idEcommercePortada}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo actualizar la portada")
      return
    }
    toast.success(estado === "ACTIVO" ? "Portada activada" : "Portada desactivada")
    setPortadas((items) =>
      items.map((item) => (item.idEcommercePortada === portada.idEcommercePortada ? data : item))
    )
  }

  const handleDelete = async (portada: EcommercePortada) => {
    const response = await authFetch(`/api/config/ecommerce/portadas/${portada.idEcommercePortada}`, {
      method: "DELETE",
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(data?.message ?? "No se pudo eliminar la portada")
      return
    }
    toast.success("Portada eliminada")
    setPortadas((items) => items.filter((item) => item.idEcommercePortada !== portada.idEcommercePortada))
  }

  if (!isLoading && !canManage) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
          <ShieldExclamationIcon className="mx-auto h-9 w-9 text-amber-500" />
          <h1 className="mt-3 text-lg font-semibold">Acceso solo para administrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Esta pantalla administra portadas publicas del ecommerce.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Configuracion ecommerce</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Portadas del ecommerce</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <FilePicker
              label="Portada pantalla grande"
              dimensions="1672 x 941 px"
              aspectClass="aspect-[1672/941]"
              templateUrl={DESKTOP_TEMPLATE_URL}
              icon={ComputerDesktopIcon}
              file={desktop}
              onChange={setDesktop}
            />
            <FilePicker
              label="Portada celular"
              dimensions="1254 x 1254 px"
              aspectClass="aspect-square"
              templateUrl={MOBILE_TEMPLATE_URL}
              icon={DevicePhoneMobileIcon}
              file={mobile}
              onChange={setMobile}
            />
          </div>
          <Button onClick={handleCreate} disabled={saving || loading} className="gap-2">
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowUpTrayIcon className="h-4 w-4" />}
            Subir portada
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">Cargando portadas...</CardContent>
          </Card>
        ) : portadas.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">No hay portadas registradas.</CardContent>
          </Card>
        ) : (
          portadas.map((portada) => (
            <Card key={portada.idEcommercePortada}>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_180px_auto] lg:items-center">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Desktop",
                      dimensions: "1672 x 941 px",
                      aspectClass: "aspect-[1672/941]",
                      url: portada.desktopThumbUrl ?? portada.desktopUrl,
                    },
                    {
                      label: "Mobile",
                      dimensions: "1254 x 1254 px",
                      aspectClass: "aspect-square",
                      url: portada.mobileThumbUrl ?? portada.mobileUrl,
                    },
                  ].map((item) => (
                    <div key={item.label} className="overflow-hidden rounded-md border bg-muted">
                      <div className="border-b bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {item.label} - {item.dimensions}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveBackendUrl(item.url) ?? ""}
                        alt={`${item.label} portada`}
                        className={`${item.aspectClass} w-full object-cover`}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold">Portada #{portada.orden}</p>
                  <p className="text-xs text-muted-foreground">{portada.estado}</p>
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <Button type="button" variant="outline" onClick={() => void handleEstado(portada)}>
                    {portada.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    aria-label="Eliminar portada"
                    onClick={() => void handleDelete(portada)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
