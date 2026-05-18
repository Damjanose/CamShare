import type { UrgencyBadge } from "@jewellery/types"
import { badgeLabel } from "../../utils/productBadges"

const styleFor = (b: UrgencyBadge): string => {
  switch (b) {
    case "new":
      return "text-bg-success"
    case "low_stock":
      return "text-bg-warning"
    case "sold_out":
      return "text-bg-secondary"
    default:
      return "text-bg-light border"
  }
}

export const BadgePill = ({ badge }: { badge: UrgencyBadge }) => {
  const label = badgeLabel(badge)
  if (!label) return null
  return <span className={`badge rounded-pill ${styleFor(badge)}`}>{label}</span>
}
