import { db } from "./db.js"

export const listCategories = async () => {
  return db.selectFrom("categories").selectAll().orderBy("name asc").execute()
}

export const getCategory = async (id: string) => {
  return db.selectFrom("categories").selectAll().where("id", "=", id).executeTakeFirst()
}

export const createCategory = async (input: { name: string; description?: string }) => {
  return db
    .insertInto("categories")
    .values({ name: input.name, description: input.description ?? null })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const updateCategory = async (id: string, input: { name?: string; description?: string }) => {
  const patch: Record<string, unknown> = { updated_at: new Date() }
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  return db.updateTable("categories").set(patch as never).where("id", "=", id).returningAll().executeTakeFirst()
}

export const removeCategory = async (id: string) => {
  return db.deleteFrom("categories").where("id", "=", id).executeTakeFirst()
}
