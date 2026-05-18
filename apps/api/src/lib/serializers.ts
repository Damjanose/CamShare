import type { Selectable } from "kysely"
import type { CategoriesTable, ProductImagesTable, ProductsTable } from "./db.js"
import type { Category, Product, ProductImage, UrgencyBadge } from "@jewellery/types"

const iso = (d: Date) => d.toISOString()

export const toCategory = (row: Selectable<CategoriesTable>): Category => ({
  id: row.id,
  name: row.name,
  description: row.description,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toProductImage = (row: Selectable<ProductImagesTable>): ProductImage => ({
  id: row.id,
  url: row.url,
  sortOrder: row.sort_order,
})

export const toProduct = (row: Selectable<ProductsTable>, images: Selectable<ProductImagesTable>[]): Product => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description,
  price: row.price,
  isActive: row.is_active,
  stockQuantity: row.stock_quantity,
  lowStockThreshold: row.low_stock_threshold,
  urgencyBadge: row.urgency_badge as UrgencyBadge,
  featured: row.featured,
  publishedAt: row.published_at ? iso(row.published_at) : null,
  images: images.sort((a, b) => a.sort_order - b.sort_order).map(toProductImage),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})
