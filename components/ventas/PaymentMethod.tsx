"use client"

import Image from "next/image"
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { MetodoPagoActivo } from "@/lib/types/metodo-pago"

export type PaymentKey = string

export const PAYMENT_BACKEND_MAP: Record<string, string> = {
  EFECTIVO: "EFECTIVO",
  YAPE: "YAPE",
  PLIN: "PLIN",
  TRANSFERENCIA: "TRANSFERENCIA",
  TARJETA: "TARJETA",
  efectivo: "EFECTIVO",
  yape: "YAPE",
  plin: "PLIN",
  transferencia: "TRANSFERENCIA",
  tarjeta: "TARJETA",
}

type PaymentMethodVariant = "grid" | "drawer"

interface MethodStyle {
  label: string
  description: string
  color: string
  activeRing: string
  activeBg: string
  icon: ReactNode
  iconWrap: string
  logoSrc?: string
  logoAlt?: string
}

const METHOD_STYLES: Record<string, MethodStyle> = {
  EFECTIVO: {
    label: "Efectivo",
    description: "Pago en caja",
    color: "text-emerald-600 dark:text-emerald-400",
    activeRing: "ring-2 ring-emerald-500",
    activeBg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600",
    iconWrap:
      "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: <BanknotesIcon className="h-5 w-5" />,
  },
  YAPE: {
    label: "Yape",
    description: "Pago con QR o numero",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    activeRing: "ring-2 ring-fuchsia-500",
    activeBg: "bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-300 dark:border-fuchsia-600",
    iconWrap: "border-transparent bg-transparent text-fuchsia-600 dark:text-fuchsia-300",
    icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
    logoSrc: "/img/yape-app-seeklogo.png",
    logoAlt: "Logo de Yape",
  },
  PLIN: {
    label: "Plin",
    description: "Transferencia rapida",
    color: "text-cyan-600 dark:text-cyan-400",
    activeRing: "ring-2 ring-cyan-500",
    activeBg: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-600",
    iconWrap: "border-transparent bg-transparent text-cyan-600 dark:text-cyan-300",
    icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
    logoSrc: "/img/plin-seeklogo.png",
    logoAlt: "Logo de Plin",
  },
  TRANSFERENCIA: {
    label: "Transferencia",
    description: "Bancos nacionales",
    color: "text-slate-600 dark:text-slate-300",
    activeRing: "ring-2 ring-indigo-500",
    activeBg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-500/70",
    iconWrap:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-200",
    icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
  },
  TARJETA: {
    label: "Tarjeta",
    description: "Debito o credito",
    color: "text-amber-600 dark:text-amber-400",
    activeRing: "ring-2 ring-amber-500",
    activeBg: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600",
    iconWrap:
      "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
}

const DEFAULT_STYLE: MethodStyle = {
  label: "Otro",
  description: "Metodo de pago disponible",
  color: "text-slate-600 dark:text-slate-400",
  activeRing: "ring-2 ring-slate-500",
  activeBg: "bg-slate-50 dark:bg-slate-900/20 border-slate-300 dark:border-slate-600",
  iconWrap:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
  icon: <CreditCardIcon className="h-5 w-5" />,
}

interface PaymentMethodProps {
  selected: PaymentKey | null
  onSelect: (key: PaymentKey) => void
  methods?: MetodoPagoActivo[]
  variant?: PaymentMethodVariant
}

function resolveMethodStyle(methodName: string) {
  const methodKey = PAYMENT_BACKEND_MAP[methodName] ?? methodName.trim().toUpperCase()
  return METHOD_STYLES[methodKey] ?? METHOD_STYLES[methodName] ?? { ...DEFAULT_STYLE, label: methodName }
}

export default function PaymentMethod({
  selected,
  onSelect,
  methods,
  variant = "grid",
}: PaymentMethodProps) {
  if (!methods) {
    return variant === "drawer" ? (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="min-h-[88px] rounded-[24px] border border-slate-200 bg-slate-50 animate-pulse dark:border-slate-700 dark:bg-slate-800/70"
          />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="h-16 rounded-xl border border-slate-200 bg-slate-50 animate-pulse dark:border-slate-700 dark:bg-slate-800"
          />
        ))}
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-slate-400">
        Sin metodos de pago activos
      </p>
    )
  }

  if (variant === "drawer") {
    return (
      <div className="space-y-3">
        {methods.map((method) => {
          const style = resolveMethodStyle(method.nombre)
          const isActive = selected === method.nombre

          return (
            <Button
              key={method.idMetodoPago}
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onSelect(method.nombre)}
              className={[
                "h-auto w-full justify-start gap-4 rounded-[24px] px-4 py-4 text-left shadow-none",
                isActive
                  ? "border-blue-300 bg-blue-50 hover:bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10 dark:hover:bg-blue-500/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600 dark:hover:bg-slate-800/80",
              ].join(" ")}
              aria-pressed={isActive}
            >
              <span
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  style.logoSrc ? "" : "border",
                  style.iconWrap,
                ].join(" ")}
              >
                {style.logoSrc ? (
                  <Image
                    src={style.logoSrc}
                    alt={style.logoAlt ?? `Logo ${style.label}`}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  style.icon
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-slate-800 dark:text-slate-100">
                  {style.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {style.description}
                </span>
              </span>

              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
                  isActive
                    ? "border-blue-500 bg-white dark:border-blue-400 dark:bg-slate-950"
                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-transparent",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full transition-all",
                    isActive ? "bg-blue-500 dark:bg-blue-400" : "bg-transparent",
                  ].join(" ")}
                />
              </span>
            </Button>
          )
        })}
      </div>
    )
  }

  const cols = methods.length <= 3 ? "grid-cols-3" : "grid-cols-4"

  return (
    <div className={`grid ${cols} gap-2`}>
      {methods.map((method) => {
        const style = resolveMethodStyle(method.nombre)
        const isActive = selected === method.nombre

        return (
          <button
            key={method.idMetodoPago}
            type="button"
            onClick={() => onSelect(method.nombre)}
            className={[
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all duration-150",
              isActive
                ? `${style.activeBg} ${style.activeRing} ${style.color}`
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 items-center justify-center",
                isActive ? style.color : "text-slate-400 dark:text-slate-500",
              ].join(" ")}
            >
              {style.logoSrc ? (
                <Image
                  src={style.logoSrc}
                  alt={style.logoAlt ?? `Logo ${style.label}`}
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                style.icon
              )}
            </span>
            {style.label}
          </button>
        )
      })}
    </div>
  )
}
