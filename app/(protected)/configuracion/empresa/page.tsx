"use client"

import { Building2, Upload } from "lucide-react"

export default function ConfigEmpresaPage() {
    return (
        <div className="max-w-2xl space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Administra la información de tu empresa. Estos datos aparecerán en las facturas.
            </p>

            <div className="bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl border border-gray-100 dark:border-[oklch(0.3_0_0)] shadow-sm p-6 space-y-5">
                {/* Logo */}
                <div className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-xl bg-[#3266E4]/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-8 w-8 text-[#3266E4]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Logo de la empresa</p>
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <Upload className="h-4 w-4" />
                            Subir logo
                        </button>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de la empresa</label>
                        <input
                            type="text"
                            defaultValue="Textil Store S.A.C."
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RUC</label>
                        <input
                            type="text"
                            defaultValue="20123456789"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dirección</label>
                        <input
                            type="text"
                            defaultValue="Av. Ejemplo 123, Lima, Perú"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[oklch(0.3_0_0)] bg-white dark:bg-[oklch(0.15_0_0)] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266E4]/30 focus:border-[#3266E4]"
                        />
                    </div>
                </div>

                <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#3266E4] text-white text-sm font-medium hover:bg-[#2755c7] transition-colors">
                    Guardar cambios
                </button>
            </div>
        </div>
    )
}
