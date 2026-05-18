import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { checkout } from "../services/orders"
import { useOrderStore } from "../stores/orderStore"

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setLast = useOrderStore((s) => s.setLastCheckoutId)
  const [shippingAddress, setShippingAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")

  const m = useMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      setLast(order.id)
      void queryClient.invalidateQueries({ queryKey: ["cart"] })
      void queryClient.invalidateQueries({ queryKey: ["orders"] })
      navigate(`/orders/${order.id}`)
    },
  })

  return (
    <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 560 }}>
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-3">Checkout</h1>
        <p className="text-secondary small">
          MVP checkout captures shipping and a payment label only—no card processor.
        </p>
        <div className="mb-3">
          <label className="form-label" htmlFor="ship">
            Shipping address
          </label>
          <textarea
            id="ship"
            className="form-control"
            rows={3}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="pay">
            Payment method
          </label>
          <select id="pay" className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="card">Card (simulated)</option>
            <option value="cod">Cash on delivery</option>
            <option value="bank">Bank transfer</option>
          </select>
        </div>
        {m.isError && (
          <div className="alert alert-danger py-2">
            {axios.isAxiosError(m.error)
              ? String((m.error.response?.data as { message?: string })?.message ?? m.error.message)
              : m.error instanceof Error
                ? m.error.message
                : "Checkout failed"}
          </div>
        )}
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={m.isPending || !shippingAddress.trim()}
            onClick={() => void m.mutateAsync({ shippingAddress: shippingAddress.trim(), paymentMethod })}
          >
            Place order
          </button>
          <Link className="btn btn-outline-secondary" to="/cart">
            Back
          </Link>
        </div>
      </div>
    </div>
  )
}
