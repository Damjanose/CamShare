import { Link } from "react-router-dom"

export const AdminDashboardPage = () => (
  <div>
    <h1 className="h3 fw-bold mb-4">Admin</h1>
    <div className="row g-3">
      <div className="col-md-6">
        <Link className="card text-decoration-none text-body h-100 border-0 shadow-sm" to="/admin/products">
          <div className="card-body">
            <h2 className="h5">Products</h2>
            <p className="text-secondary small mb-0">Urgency flags, stock, media URLs.</p>
          </div>
        </Link>
      </div>
      <div className="col-md-6">
        <Link className="card text-decoration-none text-body h-100 border-0 shadow-sm" to="/admin/orders">
          <div className="card-body">
            <h2 className="h5">Orders</h2>
            <p className="text-secondary small mb-0">Lifecycle transitions and customer notifications.</p>
          </div>
        </Link>
      </div>
    </div>
  </div>
)
