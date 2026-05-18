import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { fetchOrders } from "../services/orders"

export const OrdersPage = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })

  if (isLoading) return <div className="alert alert-info">Loading orders…</div>
  if (isError) return <div className="alert alert-danger">Could not load orders</div>

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-3">Orders</h1>
        {data?.length === 0 ? (
          <p className="text-secondary mb-0">
            No orders yet. <Link to="/products">Shop the catalogue</Link>
          </p>
        ) : (
          <div className="list-group">
            {data?.map((o) => (
              <Link key={o.id} className="list-group-item list-group-item-action d-flex justify-content-between" to={`/orders/${o.id}`}>
                <span>
                  <span className="fw-semibold text-capitalize">{o.status}</span>
                  <span className="text-secondary small ms-2">{new Date(o.createdAt).toLocaleString()}</span>
                </span>
                <span className="fw-medium">${Number(o.total).toFixed(2)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
