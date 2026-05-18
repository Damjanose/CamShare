import type { HTMLAttributes } from "react"
import { cn } from "@/lib/cn"

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "flat" | "floating" | "strong"
}

export const GlassPanel = ({
  variant = "flat",
  className,
  children,
  ...rest
}: GlassPanelProps) => {
  return (
    <div
      {...rest}
      className={cn(
        variant === "strong" ? "glass-panel-strong" : "glass-panel",
        variant === "floating" && "shadow-gold-glow",
        "rounded-3xl",
        className,
      )}
    >
      {children}
    </div>
  )
}
