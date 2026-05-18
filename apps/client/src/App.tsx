import { Link, Navigate, Route, Routes } from "react-router-dom"
import { NotificationBell } from "./components/notifications/NotificationBell"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { StaffRoute } from "./components/StaffRoute"
import { useSocketLifecycle } from "./hooks/useSocketLifecycle"
import { AccountPage } from "./pages/AccountPage"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage"
import { AdminProductsPage } from "./pages/admin/AdminProductsPage"
import { CartPage } from "./pages/CartPage"
import { CategoriesPage } from "./pages/CategoriesPage"
import { CategoryProductsPage } from "./pages/CategoryProductsPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { OrderDetailPage } from "./pages/OrderDetailPage"
import { OrdersPage } from "./pages/OrdersPage"
import { ProductDetailsPage } from "./pages/ProductDetailsPage"
import { ProductsPage } from "./pages/ProductsPage"
import { RegisterPage } from "./pages/RegisterPage"
import { useAuth } from "./types/auth-context"

const Shell = () => {
  useSocketLifecycle()
  const { user, logout } = useAuth()

  const staff =
    user &&
    (user.permissions.includes("admin") ||
      user.permissions.includes("product.write") ||
      user.permissions.includes("order.write"))

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-semibold" to="/">
            Jewellery
          </Link>
          <div className="navbar-nav d-flex flex-row flex-wrap gap-2 gap-md-3 align-items-center">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/categories">
              Categories
            </Link>
            <Link className="nav-link" to="/products">
              Products
            </Link>
            {user && (
              <>
                <Link className="nav-link" to="/cart">
                  Cart
                </Link>
                <Link className="nav-link" to="/account">
                  Account
                </Link>
                <NotificationBell />
              </>
            )}
            {staff && (
              <Link className="nav-link text-primary fw-medium" to="/admin">
                Admin
              </Link>
            )}
            {!user && (
              <Link className="nav-link" to="/login">
                Login
              </Link>
            )}
            {!user && (
              <Link className="btn btn-primary btn-sm px-3" to="/register">
                Register
              </Link>
            )}
            {user && (
              <button className="btn btn-outline-danger btn-sm px-3" onClick={() => void logout()}>
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="container py-4 py-md-5">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId/products" element={<CategoryProductsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <StaffRoute>
                <AdminDashboardPage />
              </StaffRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <StaffRoute>
                <AdminProductsPage />
              </StaffRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <StaffRoute>
                <AdminOrdersPage />
              </StaffRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export const App = () => <Shell />
