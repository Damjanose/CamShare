import { db } from "./db.js"
import type { CartResponse } from "@jewellery/types"

export const getOrCreateCartId = async (userId: string) => {
  const existing = await db.selectFrom("carts").select("id").where("user_id", "=", userId).executeTakeFirst()
  if (existing) return existing.id
  const row = await db.insertInto("carts").values({ user_id: userId }).returning("id").executeTakeFirstOrThrow()
  return row.id
}

export const getCart = async (userId: string): Promise<CartResponse> => {
  const cartId = await getOrCreateCartId(userId)
  const lines = await db
    .selectFrom("cart_items")
    .innerJoin("products", "products.id", "cart_items.product_id")
    .select([
      "cart_items.product_id as product_id",
      "cart_items.quantity as quantity",
      "products.name as name",
      "products.price as price",
    ])
    .where("cart_items.cart_id", "=", cartId)
    .execute()

  const ids = lines.map((l) => l.product_id)
  const imgs =
    ids.length === 0
      ? []
      : await db.selectFrom("product_images").selectAll().where("product_id", "in", ids).orderBy("sort_order asc").execute()
  const imgByProduct = new Map<string, string>()
  for (const im of imgs) {
    if (!imgByProduct.has(im.product_id)) imgByProduct.set(im.product_id, im.url)
  }

  let subtotal = 0
  const items = lines.map((l) => {
    const line = Number(l.price) * l.quantity
    subtotal += line
    return {
      productId: l.product_id,
      name: l.name,
      price: l.price,
      quantity: l.quantity,
      imageUrl: imgByProduct.get(l.product_id) ?? null,
    }
  })

  return {
    items,
    subtotal: subtotal.toFixed(2),
  }
}

export const addCartItem = async (userId: string, productId: string, quantity: number) => {
  const cartId = await getOrCreateCartId(userId)
  const product = await db.selectFrom("products").select(["id", "is_active"]).where("id", "=", productId).executeTakeFirst()
  if (!product?.is_active) throw new Error("Product not available")

  const existing = await db
    .selectFrom("cart_items")
    .select("quantity")
    .where("cart_id", "=", cartId)
    .where("product_id", "=", productId)
    .executeTakeFirst()

  const nextQty = (existing?.quantity ?? 0) + quantity
  if (existing) {
    await db
      .updateTable("cart_items")
      .set({ quantity: nextQty })
      .where("cart_id", "=", cartId)
      .where("product_id", "=", productId)
      .execute()
  } else {
    await db.insertInto("cart_items").values({ cart_id: cartId, product_id: productId, quantity }).execute()
  }

  await db.updateTable("carts").set({ updated_at: new Date() }).where("id", "=", cartId).execute()
  return getCart(userId)
}

export const setCartItemQuantity = async (userId: string, productId: string, quantity: number) => {
  const cartId = await getOrCreateCartId(userId)
  if (quantity <= 0) {
    await db.deleteFrom("cart_items").where("cart_id", "=", cartId).where("product_id", "=", productId).execute()
  } else {
    const updated = await db
      .updateTable("cart_items")
      .set({ quantity })
      .where("cart_id", "=", cartId)
      .where("product_id", "=", productId)
      .executeTakeFirst()
    if (Number(updated.numUpdatedRows ?? 0) < 1) throw new Error("Cart line not found")
  }
  await db.updateTable("carts").set({ updated_at: new Date() }).where("id", "=", cartId).execute()
  return getCart(userId)
}

export const removeCartItem = async (userId: string, productId: string) => {
  const cartId = await getOrCreateCartId(userId)
  await db.deleteFrom("cart_items").where("cart_id", "=", cartId).where("product_id", "=", productId).execute()
  await db.updateTable("carts").set({ updated_at: new Date() }).where("id", "=", cartId).execute()
  return getCart(userId)
}
