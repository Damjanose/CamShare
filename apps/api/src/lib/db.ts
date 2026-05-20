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
  deleted_at: Date | null
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

export interface EventsTable {
  id: Generated<string>
  owner_id: string
  title: string
  description: string | null
  event_date: Date | null
  end_date: Date | null
  cover_image_url: string | null
  is_active: Generated<boolean>
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface EventJoinTokensTable {
  id: Generated<string>
  event_id: string
  token: string
  expires_at: Date | null
  created_at: Generated<Date>
}

export interface EventMembersTable {
  event_id: string
  user_id: string
  joined_at: Generated<Date>
}

export interface EventChannelsTable {
  id: Generated<string>
  event_id: string
  name: string
  description: string | null
  sort_order: Generated<number>
  created_at: Generated<Date>
}

export interface EventPhotosTable {
  id: Generated<string>
  channel_id: string
  uploader_id: string
  url: string
  caption: string | null
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
  events: EventsTable
  event_join_tokens: EventJoinTokensTable
  event_members: EventMembersTable
  event_channels: EventChannelsTable
  event_photos: EventPhotosTable
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
