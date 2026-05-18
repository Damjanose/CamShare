import { useQuery } from "@tanstack/react-query"
import type { Product } from "@jewellery/types"
import { useParams } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { apiClient } from "../api/client"

export const CategoryProductsPage = () => {
  const { categoryId = "" } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categoryProducts", categoryId],
    queryFn: async () => {
      const { data: d } = await apiClient.get<Product[]>(`/categories/${categoryId}/products`)
      return d
    },
    enabled: !!categoryId,
  })

  if (isLoading) return <div className="alert alert-info">Loading products…</div>
  if (isError) return <div className="alert alert-danger">Could not load category products</div>

  return (
    <div>
      <h1 className="h3 fw-bold mb-3">Category products</h1>
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
