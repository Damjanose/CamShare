import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { ScrollToTop } from "@/components/ScrollToTop"
import { AppShell } from "@/components/layout/AppShell"
import { ProtectedRoute } from "@/auth/ProtectedRoute"
import { AdminRoute } from "@/auth/AdminRoute"

const UsersPage = lazy(() => import("@/pages/UsersPage").then(m => ({ default: m.UsersPage })))
const LandingPage = lazy(() => import("@/pages/LandingPage").then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage })))
const CreateEventPage = lazy(() => import("@/pages/CreateEventPage").then(m => ({ default: m.CreateEventPage })))
const EventGalleryPage = lazy(() => import("@/pages/EventGalleryPage").then(m => ({ default: m.EventGalleryPage })))
const QrInvitePage = lazy(() => import("@/pages/QrInvitePage").then(m => ({ default: m.QrInvitePage })))
const AboutPage = lazy(() => import("@/pages/AboutPage").then(m => ({ default: m.AboutPage })))
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })))
const CollectionsPage = lazy(() => import("@/pages/CollectionsPage").then(m => ({ default: m.CollectionsPage })))
const SharedPage = lazy(() => import("@/pages/SharedPage").then(m => ({ default: m.SharedPage })))
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })))
const ArchivePage = lazy(() => import("@/pages/ArchivePage").then(m => ({ default: m.ArchivePage })))
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then(m => ({ default: m.ProfilePage })))

export const App = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<CollectionsPage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:eventId" element={<EventGalleryPage />} />
          <Route path="/events/:eventId/invite" element={<QrInvitePage />} />
          <Route path="/shared" element={<SharedPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
