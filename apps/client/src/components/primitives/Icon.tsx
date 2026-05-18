import { cn } from "@/lib/cn"

type IconProps = {
  name: string
  className?: string
  filled?: boolean
  weight?: 300 | 400 | 500 | 600 | 700
}

export const Icon = ({ name, className, filled = false, weight }: IconProps) => {
  const style =
    weight !== undefined
      ? {
          fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        }
      : filled
        ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
        : undefined
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", filled && "filled", className)}
      style={style}
    >
      {name}
    </span>
  )
}
