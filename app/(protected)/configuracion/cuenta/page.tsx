"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Lock, User } from "lucide-react"

export default function ConfigCuentaPage() {
    const { user } = useAuth()

    return (
        <div className="max-w-2xl space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Administra tu información personal y seguridad.
            </p>

            {/* Profile info */}
            <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-[oklch(0.3_0_0)]">
                    <User className="h-5 w-5 text-[#3266E4]" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Datos personales</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
                        <input
                            type="text"
                            defaultValue={user?.nombre ?? ""}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apellido</label>
                        <input
                            type="text"
                            defaultValue={user?.apellido ?? ""}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rol</label>
                    <input
                        type="text"
                        value={user?.rol ?? ""}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-gray-50 dark:bg-[oklch(0.12_0_0)] text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                </div>

                <button className="px-6 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors">
                    Guardar cambios
                </button>
            </div>

            {/* Change password */}
            <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-[oklch(0.3_0_0)]">
                    <Lock className="h-5 w-5 text-[#3266E4]" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Cambiar contraseña</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contraseña actual</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>
                </div>

                <button className="px-6 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors">
                    Cambiar contraseña
                </button>
            </div>
        </div>
    )
}
