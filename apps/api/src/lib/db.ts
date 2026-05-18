import type { Generated } from "kysely"
import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"

export interface UsersTable {
  id: Generated<string>
  email: string
  password_hash: string
  is_active: Generated<boolean>
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface UserDetailsTable {
  user_id: string
  full_name: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface PermissionsTable {
  id: Generated<string>
  name: string
}

export interface UserPermissionsTable {
  user_id: string
  permission_id: string
}

export interface AuthSessionsTable {
  id: Generated<string>
  user_id: string
  refresh_token_hash: string
  user_agent: string | null
  ip_address: string | null
  expires_at: Date
  revoked_at: Date | null
  created_at: Generated<Date>
}

export interface CategoriesTable {
  id: Generated<string>
  name: string
  description: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface ProductsTable {
  id: Generated<string>
  category_id: string
  name: string
  description: string | null
  price: string
  is_active: boolean
  stock_quantity: number
  low_stock_threshold: number
  urgency_badge: string
  featured: boolean
  published_at: Date | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface ProductImagesTable {
  id: Generated<string>
  product_id: string
  url: string
  sort_order: number
  created_at: Generated<Date>
}

export interface CartsTable {
  id: Generated<string>
  user_id: string
  updated_at: Generated<Date>
}

export interface CartItemsTable {
  cart_id: string
  product_id: string
  quantity: number
}

export interface OrdersTable {
  id: Generated<string>
  user_id: string
  status: string
  total: string
  shipping_address: string | null
  payment_method: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface OrderItemsTable {
  id: Generated<string>
  order_id: string
  product_id: string
  quantity: number
  unit_price: string
}

export interface OrderStatusEventsTable {
  id: Generated<string>
  order_id: string
  status: string
  note: string | null
  created_at: Generated<Date>
}

export interface NotificationsTable {
  id: Generated<string>
  user_id: string
  type: string
  title: string
  body: string | null
  read_at: Date | null
  metadata: unknown | null
  created_at: Generated<Date>
}

export interface Database {
  users: UsersTable
  user_details: UserDetailsTable
  permissions: PermissionsTable
  user_permissions: UserPermissionsTable
  auth_sessions: AuthSessionsTable
  categories: CategoriesTable
  products: ProductsTable
  product_images: ProductImagesTable
  carts: CartsTable
  cart_items: CartItemsTable
  orders: OrdersTable
  order_items: OrderItemsTable
  order_status_events: OrderStatusEventsTable
  notifications: NotificationsTable
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required")
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString }),
  }),
})
