import type { Product, UrgencyBadge } from "@jewellery/types"

export const badgeLabel = (b: UrgencyBadge): string => {
  switch (b) {
    case "new":
      return "New"
    case "low_stock":
      return "Selling fast"
    case "sold_out":
      return "Sold out"
    default:
      return ""
  }
}

/** Derives the badge to show on the card from stock + server urgency flag. */
export const deriveDisplayBadge = (p: Product): UrgencyBadge | null => {
  if (p.stockQuantity <= 0) return "sold_out"
  if (p.stockQuantity <= p.lowStockThreshold) return "low_stock"
  if (p.urgencyBadge === "new") return "new"
  return null
}
