import type { ReactNode } from "react"
import { GlassPanel } from "@/components/primitives/GlassPanel"

type StatCardProps = {
  label: string
  value: ReactNode
  sub?: ReactNode
  subTone?: "neutral" | "primary" | "amethyst"
}

export const StatCard = ({ label, value, sub, subTone = "neutral" }: StatCardProps) => {
  const subClass =
    subTone === "primary"
      ? "text-secondary"
      : subTone === "amethyst"
        ? "text-soft-amethyst"
        : "text-on-surface-variant"
  return (
    <GlassPanel className="bg-white/40 border-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <p className="font-label-md text-on-surface-variant mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-headline-lg text-headline-lg text-primary">{value}</span>
        {sub && <span className={`${subClass} font-label-md text-caption`}>{sub}</span>}
      </div>
    </GlassPanel>
  )
}
