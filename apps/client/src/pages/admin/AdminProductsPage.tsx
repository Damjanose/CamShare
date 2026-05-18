import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { Product, UpdateProductInput, UrgencyBadge } from "@jewellery/types"
import { useCategories } from "../../hooks/useCatalog"
import { createProduct, deleteProduct, updateProduct } from "../../services/admin"
import { fetchProducts } from "../../services/products"

export const AdminProductsPage = () => {
  const queryClient = useQueryClient()
  const { data: categories } = useCategories()
  const { data: products, isLoading } = useQuery({ queryKey: ["products", "admin"], queryFn: () => fetchProducts() })

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    stockQuantity: 10,
    urgencyBadge: "none" as UrgencyBadge,
    featured: false,
    imageUrls: "",
  })

  const c = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      setCreating(false)
      setForm({
        categoryId: form.categoryId,
        name: "",
        description: "",
        price: "",
        stockQuantity: 10,
        urgencyBadge: "none",
        featured: false,
        imageUrls: "",
      })
    },
  })

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProduct>[1] }) => updateProduct(id, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["products"] }),
  })

  const del = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["products"] }),
  })

  if (isLoading) return <div className="alert alert-info">Loading…</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 fw-bold mb-0">Admin products</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Close" : "New product"}
        </button>
      </div>

      {creating && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price</label>
                <input className="form-control" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Badge</label>
                <select
                  className="form-select"
                  value={form.urgencyBadge}
                  onChange={(e) => setForm((f) => ({ ...f, urgencyBadge: e.target.value as UrgencyBadge }))}
                >
                  {(["none", "new", "low_stock", "sold_out"] as const).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    id="feat"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="feat">
                    Featured
                  </label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Image URLs (comma separated)</label>
                <input
                  className="form-control"
                  value={form.imageUrls}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-success mt-3"
              disabled={c.isPending || !form.categoryId || !form.name || !form.price}
              onClick={() =>
                void c.mutateAsync({
                  categoryId: form.categoryId,
                  name: form.name,
                  description: form.description || undefined,
                  price: form.price,
                  stockQuantity: form.stockQuantity,
                  urgencyBadge: form.urgencyBadge,
                  featured: form.featured,
                  imageUrls: form.imageUrls
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            >
              Save product
            </button>
          </div>
        </div>
      )}

      <div className="table-responsive card border-0 shadow-sm">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Badge</th>
              <th>Featured</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <AdminProductRow
                key={p.id}
                product={p}
                onPatch={(body: UpdateProductInput) => void patch.mutateAsync({ id: p.id, body })}
                onDelete={() => void del.mutateAsync(p.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const AdminProductRow = ({
  product,
  onPatch,
  onDelete,
}: {
  product: Product
  onPatch: (body: UpdateProductInput) => void
  onDelete: () => void
}) => {
  const [stock, setStock] = useState(product.stockQuantity)
  const [badge, setBadge] = useState(product.urgencyBadge)
  const [featured, setFeatured] = useState(product.featured)

  return (
    <tr>
      <td className="fw-medium">{product.name}</td>
      <td>
        <input
          type="number"
          className="form-control form-control-sm"
          style={{ width: 88 }}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          onBlur={() => onPatch({ stockQuantity: stock, urgencyBadge: badge, featured })}
        />
      </td>
      <td>
        <select className="form-select form-select-sm" value={badge} onChange={(e) => setBadge(e.target.value as UrgencyBadge)} onBlur={() => onPatch({ stockQuantity: stock, urgencyBadge: badge, featured })}>
          {(["none", "new", "low_stock", "sold_out"] as const).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input type="checkbox" className="form-check-input" checked={featured} onChange={(e) => setFeatured(e.target.checked)} onBlur={() => onPatch({ stockQuantity: stock, urgencyBadge: badge, featured })} />
      </td>
      <td className="text-end">
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  )
}
