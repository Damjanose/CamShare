import { describe, expect, it } from "vitest"
import type { Product } from "@jewellery/types"
import { badgeLabel, deriveDisplayBadge } from "./productBadges"

const baseProduct = (over: Partial<Product>): Product => ({
  id: "1",
  categoryId: "c",
  name: "Test",
  description: null,
  price: "10.00",
  isActive: true,
  stockQuantity: 10,
  lowStockThreshold: 5,
  urgencyBadge: "none",
  featured: false,
  publishedAt: null,
  images: [],
  createdAt: "",
  updatedAt: "",
  ...over,
})

describe("productBadges", () => {
  it("labels urgency values", () => {
    expect(badgeLabel("new")).toBe("New")
    expect(badgeLabel("low_stock")).toBe("Selling fast")
    expect(badgeLabel("sold_out")).toBe("Sold out")
    expect(badgeLabel("none")).toBe("")
  })

  it("prioritizes sold out and low stock from quantities", () => {
    expect(deriveDisplayBadge(baseProduct({ stockQuantity: 0 }))).toBe("sold_out")
    expect(deriveDisplayBadge(baseProduct({ stockQuantity: 2, lowStockThreshold: 5 }))).toBe("low_stock")
  })

  it("shows new when stock healthy and flag set", () => {
    expect(deriveDisplayBadge(baseProduct({ urgencyBadge: "new", stockQuantity: 20, lowStockThreshold: 5 }))).toBe("new")
  })
})
