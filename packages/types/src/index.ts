export type PermissionName =
  | "admin"
  | "product.read"
  | "product.write"
  | "category.read"
  | "category.write"
  | "order.read"
  | "order.write"

export type User = {
  id: string
  email: string
  isActive: boolean
  fullName: string
  permissions: PermissionName[]
}

export type Category = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type UrgencyBadge = "new" | "low_stock" | "sold_out" | "none"

export type ProductImage = {
  id: string
  url: string
  sortOrder: number
}

export type Product = {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: string
  isActive: boolean
  stockQuantity: number
  lowStockThreshold: number
  urgencyBadge: UrgencyBadge
  featured: boolean
  publishedAt: string | null
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthResponse = {
  user: User
  tokens: AuthTokens
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  fullName: string
}

export type CreateCategoryInput = {
  name: string
  description?: string
}

export type UpdateCategoryInput = {
  name?: string
  description?: string
}

export type CreateProductInput = {
  categoryId: string
  name: string
  description?: string
  price: string
  stockQuantity?: number
  lowStockThreshold?: number
  urgencyBadge?: UrgencyBadge
  featured?: boolean
  imageUrls?: string[]
}

export type UpdateProductInput = {
  categoryId?: string
  name?: string
  description?: string
  price?: string
  isActive?: boolean
  stockQuantity?: number
  lowStockThreshold?: number
  urgencyBadge?: UrgencyBadge
  featured?: boolean
  imageUrls?: string[]
}

export type CartLine = {
  productId: string
  name: string
  price: string
  quantity: number
  imageUrl: string | null
}

export type CartResponse = {
  items: CartLine[]
  subtotal: string
}

export type CheckoutInput = {
  shippingAddress: string
  paymentMethod: string
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

export type OrderItemDto = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: string
}

export type OrderStatusEventDto = {
  id: string
  status: OrderStatus
  note: string | null
  createdAt: string
}

export type OrderSummary = {
  id: string
  userId: string
  status: OrderStatus
  total: string
  createdAt: string
  updatedAt: string
}

export type OrderDetail = OrderSummary & {
  items: OrderItemDto[]
  timeline: OrderStatusEventDto[]
  shippingAddress: string | null
  paymentMethod: string | null
}

export type NotificationDto = {
  id: string
  type: string
  title: string
  body: string | null
  readAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type UpdateOrderStatusInput = {
  status: OrderStatus
  note?: string
}
