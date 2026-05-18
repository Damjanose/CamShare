import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OrderStatus } from "@jewellery/types"
import { Link } from "react-router-dom"
import { fetchOrders, updateOrderStatus } from "../../services/orders"

const nextOptions = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case "pending":
      return ["confirmed", "cancelled"]
    case "confirmed":
      return ["shipped", "cancelled"]
    case "shipped":
      return ["delivered"]
    default:
      return []
  }
}

export const AdminOrdersPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })

  if (isLoading) return <div className="alert alert-info">Loading…</div>

  return (
    <div>
      <h1 className="h3 fw-bold mb-3">Admin orders</h1>
      <div className="table-responsive card border-0 shadow-sm">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>When</th>
              <th>Status</th>
              <th>Total</th>
              <th>Next step</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td className="text-capitalize">{o.status}</td>
                <td>${Number(o.total).toFixed(2)}</td>
                <td>
                  <div className="d-flex flex-wrap gap-1">
                    {nextOptions(o.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={patch.isPending}
                        onClick={() => void patch.mutateAsync({ id: o.id, status: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </td>
                <td>
                  <Link to={`/orders/${o.id}`} className="btn btn-sm btn-outline-secondary">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
