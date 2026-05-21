import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

type Variant = "gold" | "primary" | "ghost" | "outline"
type Size = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  gold:
    "bg-champagne-gold text-white shadow-lg shadow-champagne-gold/30 hover:shadow-xl hover:shadow-champagne-gold/40 hover:-translate-y-0.5",
  primary:
    "bg-champagne-gold text-white shadow-lg shadow-champagne-gold/30 hover:shadow-xl hover:shadow-champagne-gold/40 hover:-translate-y-0.5",
  ghost:
    "glass-panel text-primary border-primary/20 hover:bg-primary/5",
  outline:
    "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5",
}

const sizeClasses: Record<Size, string> = {
  sm: "px-5 py-2 text-label-md",
  md: "px-8 py-3 text-label-md",
  lg: "px-10 py-4 text-label-md",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, type = "button", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        {...rest}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"
