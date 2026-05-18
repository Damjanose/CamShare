import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { fetchProducts } from "../services/products"

export const ProductsPage = () => {
  const [params] = useSearchParams()
  const featuredOnly = params.get("featured") === "1"

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { featuredOnly }],
    queryFn: () => fetchProducts({ featured: featuredOnly || undefined }),
  })

  if (isLoading) return <div className="alert alert-info">Loading products…</div>
  if (isError) return <div className="alert alert-danger">Could not load products</div>

  return (
    <div>
      <h1 className="h3 fw-bold mb-3">{featuredOnly ? "Featured products" : "All products"}</h1>
      <div className="row g-3">
        {data?.map((product) => (
          <div key={product.id} className="col-6 col-lg-4 col-xl-3">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
