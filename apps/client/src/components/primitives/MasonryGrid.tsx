import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

export const MasonryGrid = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return <div className={cn("masonry-grid-css", className)}>{children}</div>
}
