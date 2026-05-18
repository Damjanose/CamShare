import { Link } from "react-router-dom"
import { useCart } from "../hooks/useCart"

export const CartPage = () => {
  const { data, isLoading, isError, setQty, removeLine, isUpdating } = useCart()

  if (isLoading) return <div className="alert alert-info">Loading cart…</div>
  if (isError) return <div className="alert alert-danger">Could not load cart</div>

  const items = data?.items ?? []

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-3">Cart</h1>
        {items.length === 0 ? (
          <p className="text-secondary mb-0">
            Your cart is empty. <Link to="/products">Continue shopping</Link>
          </p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">Price</th>
                    <th className="text-center">Qty</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((line) => (
                    <tr key={line.productId}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {line.imageUrl && (
                            <img src={line.imageUrl} alt="" width={48} height={48} className="rounded object-fit-cover" />
                          )}
                          <span className="fw-medium">{line.name}</span>
                        </div>
                      </td>
                      <td className="text-end">${Number(line.price).toFixed(2)}</td>
                      <td className="text-center" style={{ maxWidth: 120 }}>
                        <input
                          type="number"
                          min={1}
                          className="form-control form-control-sm"
                          defaultValue={line.quantity}
                          disabled={isUpdating}
                          onBlur={(e) => {
                            const q = Number(e.target.value)
                            if (Number.isFinite(q)) void setQty({ productId: line.productId, quantity: q })
                          }}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={isUpdating}
                          onClick={() => void removeLine(line.productId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <strong>Subtotal: ${Number(data?.subtotal ?? 0).toFixed(2)}</strong>
              <Link className="btn btn-primary" to="/checkout">
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
