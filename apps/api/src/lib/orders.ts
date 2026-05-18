import type { OrderDetail, OrderStatus, OrderSummary } from "@jewellery/types"
import { db } from "./db.js"
import { emitToUser } from "../realtime.js"

const iso = (d: Date) => d.toISOString()

const computeUrgency = (stock: number, threshold: number, prev: string) => {
  if (stock <= 0) return "sold_out"
  if (stock <= threshold) return "low_stock"
  if (prev === "new") return "new"
  return "none"
}

const mapOrderSummary = (row: {
  id: string
  user_id: string
  status: string
  total: string
  created_at: Date
  updated_at: Date
}): OrderSummary => ({
  id: row.id,
  userId: row.user_id,
  status: row.status as OrderStatus,
  total: row.total,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

export const listOrdersForUser = async (userId: string) => {
  const rows = await db.selectFrom("orders").selectAll().where("user_id", "=", userId).orderBy("created_at desc").execute()
  return rows.map(mapOrderSummary)
}

export const listAllOrders = async () => {
  const rows = await db.selectFrom("orders").selectAll().orderBy("created_at desc").execute()
  return rows.map(mapOrderSummary)
}

export const getOrderDetail = async (orderId: string, requesterUserId: string, isAdmin: boolean): Promise<OrderDetail | undefined> => {
  const row = await db.selectFrom("orders").selectAll().where("id", "=", orderId).executeTakeFirst()
  if (!row) return undefined
  if (!isAdmin && row.user_id !== requesterUserId) return undefined

  const items = await db
    .selectFrom("order_items")
    .innerJoin("products", "products.id", "order_items.product_id")
    .where("order_items.order_id", "=", orderId)
    .select([
      "order_items.id as id",
      "order_items.product_id as product_id",
      "order_items.quantity as quantity",
      "order_items.unit_price as unit_price",
      "products.name as product_name",
    ])
    .execute()

  const timeline = await db
    .selectFrom("order_status_events")
    .selectAll()
    .where("order_id", "=", orderId)
    .orderBy("created_at asc")
    .execute()

  return {
    ...mapOrderSummary(row),
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
    timeline: timeline.map((t) => ({
      id: t.id,
      status: t.status as OrderStatus,
      note: t.note,
      createdAt: iso(t.created_at),
    })),
    shippingAddress: row.shipping_address,
    paymentMethod: row.payment_method,
  }
}

export const checkout = async (userId: string, input: { shippingAddress: string; paymentMethod: string }) => {
  const orderId = await db.transaction().execute(async (trx) => {
    const cart = await trx.selectFrom("carts").select("id").where("user_id", "=", userId).executeTakeFirst()
    if (!cart) throw new Error("Cart is empty")

    const lines = await trx
      .selectFrom("cart_items")
      .innerJoin("products", "products.id", "cart_items.product_id")
      .where("cart_items.cart_id", "=", cart.id)
      .select([
        "products.id as product_id",
        "products.name as name",
        "products.price as price",
        "products.stock_quantity as stock_quantity",
        "products.low_stock_threshold as low_stock_threshold",
        "products.urgency_badge as urgency_badge",
        "cart_items.quantity as quantity",
      ])
      .execute()

    if (lines.length === 0) throw new Error("Cart is empty")

    let total = 0
    for (const line of lines) {
      if (line.stock_quantity < line.quantity) {
        throw new Error(`Insufficient stock for ${line.name}`)
      }
      total += Number(line.price) * line.quantity
    }

    const order = await trx
      .insertInto("orders")
      .values({
        user_id: userId,
        status: "pending",
        total: total.toFixed(2),
        shipping_address: input.shippingAddress,
        payment_method: input.paymentMethod,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    for (const line of lines) {
      await trx
        .insertInto("order_items")
        .values({
          order_id: order.id,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.price,
        })
        .execute()

      const newStock = line.stock_quantity - line.quantity
      const urgency = computeUrgency(newStock, line.low_stock_threshold, line.urgency_badge)
      await trx
        .updateTable("products")
        .set({
          stock_quantity: newStock,
          urgency_badge: urgency,
          updated_at: new Date(),
        })
        .where("id", "=", line.product_id)
        .execute()
    }

    await trx.deleteFrom("cart_items").where("cart_id", "=", cart.id).execute()

    await trx
      .insertInto("order_status_events")
      .values({ order_id: order.id, status: "pending", note: "Order placed" })
      .execute()

    return order.id
  })

  await db
    .insertInto("notifications")
    .values({
      user_id: userId,
      type: "order_created",
      title: "Order placed",
      body: "Your order was received and is pending confirmation.",
      metadata: { orderId } as object,
    })
    .execute()

  const detail = (await getOrderDetail(orderId, userId, false)) as OrderDetail
  emitToUser(userId, "order:created", detail)
  emitToUser(userId, "notification:new", { type: "order_created", orderId })

  return detail
}

const isValidTransition = (current: OrderStatus, next: OrderStatus) => {
  if (current === "pending" && (next === "confirmed" || next === "cancelled")) return true
  if (current === "confirmed" && (next === "shipped" || next === "cancelled")) return true
  if (current === "shipped" && next === "delivered") return true
  return false
}

export const adminUpdateOrderStatus = async (orderId: string, next: OrderStatus, note: string | undefined) => {
  const row = await db.selectFrom("orders").selectAll().where("id", "=", orderId).executeTakeFirst()
  if (!row) return undefined

  const current = row.status as OrderStatus
  if (!isValidTransition(current, next)) {
    throw new Error("Invalid status transition")
  }

  await db.transaction().execute(async (trx) => {
    await trx.updateTable("orders").set({ status: next, updated_at: new Date() }).where("id", "=", orderId).execute()
    await trx
      .insertInto("order_status_events")
      .values({ order_id: orderId, status: next, note: note ?? null })
      .execute()
  })

  await db
    .insertInto("notifications")
    .values({
      user_id: row.user_id,
      type: "order_status",
      title: "Order updated",
      body: `Your order is now ${next}.`,
      metadata: { orderId, status: next } as object,
    })
    .execute()

  const detail = (await getOrderDetail(orderId, row.user_id, true)) as OrderDetail
  emitToUser(row.user_id, "order:status_updated", { orderId, status: next, order: detail })
  emitToUser(row.user_id, "notification:new", { type: "order_status", orderId, status: next })

  return detail
}
