import "dotenv/config"
import bcrypt from "bcryptjs"
import pg from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required")
}

const permissions = [
  "admin",
  "product.read",
  "product.write",
  "category.read",
  "category.write",
  "order.read",
  "order.write",
]

const seed = async () => {
  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    await client.query("BEGIN")

    for (const permissionName of permissions) {
      await client.query("INSERT INTO permissions(name) VALUES($1) ON CONFLICT (name) DO NOTHING", [
        permissionName,
      ])
    }

    const passwordHash = await bcrypt.hash("Admin123!", 10)
    const userResult = await client.query(
      `
      INSERT INTO users(email, password_hash)
      VALUES($1, $2)
      ON CONFLICT (email)
      DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
      RETURNING id
      `,
      ["admin@example.com", passwordHash],
    )

    const userId = userResult.rows[0].id as string

    await client.query(
      `
      INSERT INTO user_details(user_id, full_name)
      VALUES($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = NOW()
      `,
      [userId, "Jewellery Admin"],
    )

    await client.query(
      `
      INSERT INTO user_permissions(user_id, permission_id)
      SELECT $1, p.id
      FROM permissions p
      ON CONFLICT DO NOTHING
      `,
      [userId],
    )

    await client.query(
      `
      INSERT INTO categories(name, description)
      VALUES
        ('Rings', 'Gold and silver rings'),
        ('Necklaces', 'Chains and pendants'),
        ('Watches', 'Luxury timepieces')
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW()
      `,
    )

    const ringsRes = await client.query("SELECT id FROM categories WHERE name = 'Rings' LIMIT 1")
    const neckRes = await client.query("SELECT id FROM categories WHERE name = 'Necklaces' LIMIT 1")
    const watchRes = await client.query("SELECT id FROM categories WHERE name = 'Watches' LIMIT 1")
    const ringsId = ringsRes.rows[0].id
    const neckId = neckRes.rows[0].id
    const watchId = watchRes.rows[0].id

    const products = [
      {
        cid: ringsId,
        name: "Vintage Gold Band",
        desc: "14k gold, limited run",
        price: "449.00",
        stock: 12,
        badge: "new",
        featured: true,
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
      },
      {
        cid: ringsId,
        name: "Silver Signet",
        desc: "Sterling silver",
        price: "189.00",
        stock: 3,
        badge: "low_stock",
        featured: true,
        url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
      },
      {
        cid: neckId,
        name: "Pearl Strand",
        desc: "Freshwater pearls",
        price: "320.00",
        stock: 8,
        badge: "none",
        featured: false,
        url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600",
      },
      {
        cid: watchId,
        name: "Minimal Steel Watch",
        desc: "Swiss movement",
        price: "899.00",
        stock: 0,
        badge: "sold_out",
        featured: true,
        url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600",
      },
    ]

    for (const p of products) {
      const existing = await client.query("SELECT id FROM products WHERE name = $1 LIMIT 1", [p.name])
      let productId: string
      if (existing.rows.length > 0) {
        productId = existing.rows[0].id as string
        await client.query(
          `
          UPDATE products SET
            category_id = $2,
            description = $3,
            price = $4::numeric,
            stock_quantity = $5,
            urgency_badge = $6,
            featured = $7,
            is_active = true,
            updated_at = NOW()
          WHERE id = $1
          `,
          [productId, p.cid, p.desc, p.price, p.stock, p.badge, p.featured],
        )
      } else {
        const ins = await client.query(
          `
          INSERT INTO products(category_id, name, description, price, is_active, stock_quantity, urgency_badge, featured, published_at)
          VALUES ($1, $2, $3, $4::numeric, true, $5, $6, $7, NOW())
          RETURNING id
          `,
          [p.cid, p.name, p.desc, p.price, p.stock, p.badge, p.featured],
        )
        productId = ins.rows[0].id as string
      }

      const imgCount = await client.query(
        "SELECT COUNT(*)::int AS c FROM product_images WHERE product_id = $1",
        [productId],
      )
      if (Number(imgCount.rows[0].c) === 0) {
        await client.query(
          `INSERT INTO product_images(product_id, url, sort_order) VALUES ($1, $2, 0)`,
          [productId, p.url],
        )
      }
    }

    await client.query("COMMIT")
    console.log("Seed completed")
    console.log("Admin user: admin@example.com / Admin123!")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
