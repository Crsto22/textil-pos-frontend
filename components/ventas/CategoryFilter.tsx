"use client"

const CATEGORIES = ["Todos", "Polos", "Pantalones", "Camisas", "Casacas", "Vestidos", "Shorts"]

const COLORS: { name: string; hex: string }[] = [
    { name: "Negro", hex: "#111111" },
    { name: "Blanco", hex: "#f1f5f9" },
    { name: "Azul", hex: "#3b82f6" },
    { name: "Rojo", hex: "#ef4444" },
    { name: "Verde", hex: "#22c55e" },
    { name: "Gris", hex: "#94a3b8" },
    { name: "Rosado", hex: "#f472b6" },
]

interface CategoryFilterProps {
    activeCategory: string
    onCategoryChange: (cat: string) => void
    activeColor: string | null
    onColorChange: (color: string | null) => void
}

export default function CategoryFilter({
    activeCategory,
    onCategoryChange,
    activeColor,
    onColorChange,
}: CategoryFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Category chips */}
            <div className="flex flex-wrap gap-2 flex-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={[
                            "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
                            activeCategory === cat
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
                        ].join(" ")}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Color circles */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {COLORS.map((c) => (
                    <button
                        key={c.name}
                        title={c.name}
                        onClick={() => onColorChange(activeColor === c.name ? null : c.name)}
                        className={[
                            "h-6 w-6 rounded-full border-2 transition-all duration-150 shrink-0",
                            activeColor === c.name
                                ? "border-blue-500 scale-110 shadow-md"
                                : "border-white dark:border-slate-800 hover:scale-110",
                        ].join(" ")}
                        style={{ backgroundColor: c.hex }}
                    />
                ))}
            </div>
        </div>
    )
}
