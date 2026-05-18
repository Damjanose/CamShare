import { Link } from "react-router-dom"
import { useCategories } from "../hooks/useCatalog"

export const CategoriesPage = () => {
  const { data, isLoading, isError } = useCategories()

  if (isLoading) return <div className="alert alert-info">Loading categories...</div>
  if (isError) return <div className="alert alert-danger">Could not load categories</div>

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-3">Categories</h1>
        <p className="text-secondary mb-4">Pick a category to see its products.</p>
        <div className="list-group mb-4">
          {data?.map((category) => (
            <Link
              key={category.id}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              to={`/categories/${category.id}/products`}
            >
              <span>{category.name}</span>
              <span className="badge text-bg-light border">Open</span>
            </Link>
          ))}
        </div>
        <Link className="btn btn-outline-primary" to="/products">
          View all products
        </Link>
      </div>
    </div>
  )
}
