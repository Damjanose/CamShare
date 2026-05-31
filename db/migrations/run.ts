import "dotenv/config"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import pg from "pg"

const migrationsDir = path.resolve(import.meta.dirname)
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required")
}

const run = async () => {
  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const { rows } = await client.query<{ filename: string }>(
      "SELECT filename FROM schema_migrations"
    )
    const applied = new Set(rows.map((r) => r.filename))

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b))

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping (already applied): ${file}`)
        continue
      }
      const sql = await readFile(path.join(migrationsDir, file), "utf8")
      await client.query(sql)
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file])
      console.log(`Applied migration: ${file}`)
    }
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
