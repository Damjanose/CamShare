import { Link } from "react-router-dom"
import type { Product } from "@jewellery/types"
import { deriveDisplayBadge } from "../../utils/productBadges"
import { BadgePill } from "./BadgePill"

export const ProductCard = ({ product }: { product: Product }) => {
  const badge = deriveDisplayBadge(product)
  const thumb = product.images[0]?.url ?? "https://placehold.co/400x400?text=Jewellery"
  return (
    <div className="card h-100 border-0 shadow-sm overflow-hidden">
      <Link to={`/products/${product.id}`} className="ratio ratio-1x1 bg-body-secondary">
        <img src={thumb} alt="" className="object-fit-cover w-100 h-100" />
      </Link>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <Link to={`/products/${product.id}`} className="text-decoration-none text-body fw-semibold">
            {product.name}
          </Link>
          {badge && <BadgePill badge={badge} />}
        </div>
        <p className="text-secondary small flex-grow-1 text-truncate">{product.description ?? ""}</p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fw-bold">${Number(product.price).toFixed(2)}</span>
          {product.featured && <span className="badge text-bg-primary">Featured</span>}
        </div>
      </div>
    </div>
  )
}
