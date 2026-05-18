import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { ProductGallery } from "../components/media/ProductGallery"
import { BadgePill } from "../components/product/BadgePill"
import { useCart } from "../hooks/useCart"
import { fetchProduct } from "../services/products"
import { useAuth } from "../types/auth-context"
import { deriveDisplayBadge } from "../utils/productBadges"

export const ProductDetailsPage = () => {
  const { productId = "" } = useParams()
  const { user } = useAuth()
  const { addItem, isUpdating } = useCart()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  })

  if (isLoading) return <div className="alert alert-info">Loading product…</div>
  if (isError || !data) return <div className="alert alert-danger">Product not found</div>

  const badge = deriveDisplayBadge(data)
  const canBuy = data.stockQuantity > 0

  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <ProductGallery images={data.images} alt={data.name} />
      </div>
      <div className="col-lg-6">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item">
              <Link to="/products">Products</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {data.name}
            </li>
          </ol>
        </nav>
        <div className="d-flex align-items-center gap-2 mb-2">
          <h1 className="h3 mb-0">{data.name}</h1>
          {badge && <BadgePill badge={badge} />}
        </div>
        <p className="text-secondary">{data.description}</p>
        <p className="display-6 fw-bold">${Number(data.price).toFixed(2)}</p>
        <p className="small text-secondary">
          {data.stockQuantity > 0 ? `${data.stockQuantity} in stock` : "Out of stock"}
        </p>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canBuy || isUpdating || !user}
            onClick={() => void addItem({ productId: data.id, quantity: 1 })}
          >
            Add to cart
          </button>
          {!user && (
            <span className="small text-secondary">
              <Link to="/login">Sign in</Link> to add items.
            </span>
          )}
          <Link className="btn btn-outline-secondary" to="/cart">
            View cart
          </Link>
        </div>
      </div>
    </div>
  )
}
