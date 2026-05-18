import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { fetchProducts } from "../services/products"

export const HomePage = () => {
  const { data: featured, isLoading: fLoad } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featured: true }),
  })

  const { data: arrivals, isLoading: aLoad } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => fetchProducts(),
  })

  const newArrivals = (arrivals ?? []).filter((p) => p.urgencyBadge === "new").slice(0, 4)

  return (
    <div>
      <div className="p-4 p-md-5 mb-4 rounded-3 bg-dark text-white shadow">
        <h1 className="display-6 fw-bold">Jewellery offers</h1>
        <p className="col-lg-8 fs-5 opacity-75 mb-0">
          Curated pieces with clear urgency—new drops, low stock, and order tracking in real time.
        </p>
        <Link className="btn btn-light btn-sm mt-3" to="/products">
          Browse catalogue
        </Link>
      </div>

      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Featured</h2>
          <Link to="/products?featured=1" className="small">
            View all
          </Link>
        </div>
        {fLoad && <div className="alert alert-info py-2">Loading featured…</div>}
        <div className="row g-3">
          {featured?.map((p) => (
            <div key={p.id} className="col-6 col-lg-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">New arrivals</h2>
        </div>
        {aLoad && <div className="alert alert-info py-2">Loading…</div>}
        <div className="row g-3">
          {newArrivals.map((p) => (
            <div key={p.id} className="col-6 col-lg-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        {newArrivals.length === 0 && !aLoad && <p className="text-secondary">No new badges right now.</p>}
      </section>
    </div>
  )
}
