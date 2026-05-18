import { Link } from "react-router-dom"

export const AccountPage = () => (
  <div className="card border-0 shadow-sm">
    <div className="card-body p-4">
      <h1 className="h3 fw-bold mb-3">Account</h1>
      <p className="text-secondary">Manage orders and notifications.</p>
      <div className="d-flex flex-column gap-2 col-md-6">
        <Link className="btn btn-outline-primary text-start" to="/orders">
          Order history
        </Link>
        <Link className="btn btn-outline-primary text-start" to="/notifications">
          Notifications
        </Link>
      </div>
    </div>
  </div>
)
