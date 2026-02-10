"use client"

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline"
import type { ComponentType, SVGProps } from "react"

interface MetricCardProps {
    title: string
    value: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    trend?: {
        value: number       // e.g. 12.5 for +12.5%
        label: string       // e.g. "vs período anterior"
    }
    iconColor?: string    // tailwind text color class
}

export function MetricCard({ title, value, icon: Icon, trend, iconColor = "text-[#3266E4]" }: MetricCardProps) {
    const isPositive = trend && trend.value >= 0

    return (
        <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl shadow-sm border border-gray-100 dark:border-[oklch(0.3_0_0)] p-5 flex flex-col gap-3 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <div className={`h-9 w-9 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {trend && (
                <div className="flex items-center gap-1.5 text-xs">
                    {isPositive ? (
                        <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                        <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={isPositive ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                        {isPositive ? "+" : ""}{trend.value}%
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">{trend.label}</span>
                </div>
            )}
        </div>
    )
}
