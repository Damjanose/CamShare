import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { OrderTimeline } from "../components/order/OrderTimeline"
import { fetchOrder } from "../services/orders"

export const OrderDetailPage = () => {
  const { orderId = "" } = useParams<{ orderId: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
  })

  if (isLoading) return <div className="alert alert-info">Loading order…</div>
  if (isError || !data) return <div className="alert alert-danger">Order not found</div>

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <Link to="/orders" className="small text-decoration-none mb-2 d-inline-block">
          ← Back to orders
        </Link>
        <h1 className="h3 fw-bold mb-1">Order {data.id.slice(0, 8)}…</h1>
        <p className="text-secondary text-capitalize mb-4">Status: {data.status}</p>

        <div className="row g-4">
          <div className="col-lg-6">
            <h2 className="h6 text-uppercase text-secondary">Items</h2>
            <ul className="list-group">
              {data.items.map((i) => (
                <li key={i.id} className="list-group-item d-flex justify-content-between">
                  <span>
                    {i.productName} × {i.quantity}
                  </span>
                  <span>${Number(i.unitPrice).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="fw-bold mt-3 mb-0">Total ${Number(data.total).toFixed(2)}</p>
            {data.shippingAddress && (
              <p className="small text-secondary mt-3 mb-0">
                <strong>Ship to:</strong> {data.shippingAddress}
              </p>
            )}
          </div>
          <div className="col-lg-6">
            <h2 className="h6 text-uppercase text-secondary">Timeline</h2>
            <OrderTimeline events={data.timeline} />
          </div>
        </div>
      </div>
    </div>
  )
}
